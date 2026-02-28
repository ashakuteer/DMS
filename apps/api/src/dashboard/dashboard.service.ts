import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { CommunicationChannel, CommunicationType, CommunicationStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private prisma: PrismaService,
    private communicationLogService: CommunicationLogService,
  ) {}

  private getCurrentFY() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const fyStart = month >= 3 ? new Date(year, 3, 1) : new Date(year - 1, 3, 1);
    const fyEnd = month >= 3 ? new Date(year + 1, 2, 31, 23, 59, 59) : new Date(year, 2, 31, 23, 59, 59);
    return { fyStart, fyEnd };
  }

  private getMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }

  async getStats() {
    const { fyStart, fyEnd } = this.getCurrentFY();
    const { start: monthStart, end: monthEnd } = this.getMonthRange();

    const [
      totalDonationsFY,
      donationsThisMonth,
      activeDonors,
      totalBeneficiaries,
    ] = await Promise.all([
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: { gte: fyStart, lte: fyEnd },
        },
      }),
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.donor.count({
        where: { deletedAt: null },
      }),
      this.prisma.beneficiary.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      totalDonationsFY: totalDonationsFY._sum.donationAmount?.toNumber() || 0,
      donationsThisMonth: donationsThisMonth._sum.donationAmount?.toNumber() || 0,
      activeDonors,
      totalBeneficiaries,
    };
  }

  async getMonthlyTrends() {
    const months: { month: string; amount: number; count: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const result = await this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        _count: { id: true },
        where: {
          deletedAt: null,
          donationDate: { gte: start, lte: end },
        },
      });

      const monthName = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      months.push({
        month: monthName,
        amount: result._sum.donationAmount?.toNumber() || 0,
        count: result._count.id || 0,
      });
    }

    return months;
  }

  async getDonationModeSplit() {
    const { fyStart, fyEnd } = this.getCurrentFY();

    const modes = await this.prisma.donation.groupBy({
      by: ['donationMode'],
      _sum: { donationAmount: true },
      _count: { id: true },
      where: {
        deletedAt: null,
        donationDate: { gte: fyStart, lte: fyEnd },
      },
    });

    return modes.map((m) => ({
      mode: m.donationMode,
      amount: m._sum.donationAmount?.toNumber() || 0,
      count: m._count.id || 0,
    }));
  }

  async getTopDonors(limit = 5) {
    const { fyStart, fyEnd } = this.getCurrentFY();

    const topDonors = await this.prisma.donation.groupBy({
      by: ['donorId'],
      _sum: { donationAmount: true },
      _count: { id: true },
      where: {
        deletedAt: null,
        donationDate: { gte: fyStart, lte: fyEnd },
      },
      orderBy: { _sum: { donationAmount: 'desc' } },
      take: limit,
    });

    const donorIds = topDonors.map((d) => d.donorId);
    const donors = await this.prisma.donor.findMany({
      where: { id: { in: donorIds } },
      select: { id: true, firstName: true, lastName: true, donorCode: true, category: true },
    });

    const donorMap = new Map(donors.map((d) => [d.id, d]));

    return topDonors.map((td) => {
      const donor = donorMap.get(td.donorId);
      return {
        donorId: td.donorId,
        donorCode: donor?.donorCode || '',
        name: donor ? `${donor.firstName} ${donor.lastName || ''}`.trim() : 'Unknown',
        category: donor?.category || 'INDIVIDUAL',
        totalAmount: td._sum.donationAmount?.toNumber() || 0,
        donationCount: td._count.id || 0,
      };
    });
  }

  async getRecentDonations(limit = 10) {
    const donations = await this.prisma.donation.findMany({
      where: { deletedAt: null },
      orderBy: { donationDate: 'desc' },
      take: limit,
      include: {
        donor: {
          select: { id: true, firstName: true, lastName: true, donorCode: true },
        },
      },
    });

    return donations.map((d) => ({
      id: d.id,
      donorId: d.donorId,
      donorCode: d.donor.donorCode,
      donorName: `${d.donor.firstName} ${d.donor.lastName || ''}`.trim(),
      amount: d.donationAmount.toNumber(),
      date: d.donationDate,
      mode: d.donationMode,
      type: d.donationType,
      receiptNumber: d.receiptNumber,
    }));
  }

  async getAIInsights() {
    const { fyStart, fyEnd } = this.getCurrentFY();
    const now = new Date();
    const insights: { type: string; title: string; description: string }[] = [];

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisMonth, lastMonth] = await Promise.all([
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        _count: { id: true },
        where: { deletedAt: null, donationDate: { gte: thisMonthStart, lte: thisMonthEnd } },
      }),
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        _count: { id: true },
        where: { deletedAt: null, donationDate: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
    ]);

    const thisMonthAmt = thisMonth._sum.donationAmount?.toNumber() || 0;
    const lastMonthAmt = lastMonth._sum.donationAmount?.toNumber() || 0;

    if (lastMonthAmt > 0 && thisMonthAmt > 0) {
      const change = ((thisMonthAmt - lastMonthAmt) / lastMonthAmt) * 100;
      const direction = change >= 0 ? 'up' : 'down';
      insights.push({
        type: direction === 'up' ? 'positive' : 'warning',
        title: 'Month-over-Month Change',
        description: `Donations are ${direction} ${Math.abs(change).toFixed(1)}% compared to last month (₹${thisMonthAmt.toLocaleString('en-IN')} vs ₹${lastMonthAmt.toLocaleString('en-IN')}).`,
      });
    }

    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const regularDonors = await this.prisma.donor.findMany({
      where: {
        deletedAt: null,
        donationFrequency: { in: ['MONTHLY', 'QUARTERLY'] },
      },
      select: { id: true },
    });

    const regularDonorIds = regularDonors.map((d) => d.id);
    if (regularDonorIds.length > 0) {
      const activeDonorIds = await this.prisma.donation.findMany({
        where: {
          deletedAt: null,
          donorId: { in: regularDonorIds },
          donationDate: { gte: sixtyDaysAgo },
        },
        select: { donorId: true },
        distinct: ['donorId'],
      });

      const inactiveCount = regularDonorIds.length - activeDonorIds.length;
      if (inactiveCount > 0) {
        insights.push({
          type: 'warning',
          title: 'Inactive Regular Donors',
          description: `${inactiveCount} regular donor(s) haven't donated in the last 60 days. Consider reaching out to re-engage them.`,
        });
      }
    }

    const donations = await this.prisma.donation.findMany({
      where: { deletedAt: null, donationDate: { gte: fyStart, lte: fyEnd } },
      select: { donationDate: true },
    });

    if (donations.length >= 5) {
      const hourCounts: Record<string, number> = {};
      donations.forEach((d) => {
        const hour = new Date(d.donationDate).getHours();
        const timeSlot = hour < 12 ? 'Morning (6AM-12PM)' : hour < 17 ? 'Afternoon (12PM-5PM)' : 'Evening (5PM-9PM)';
        hourCounts[timeSlot] = (hourCounts[timeSlot] || 0) + 1;
      });

      const topSlot = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
      if (topSlot) {
        insights.push({
          type: 'info',
          title: 'Peak Donation Time',
          description: `Most donations are received during ${topSlot[0]} (${topSlot[1]} donations). Consider scheduling outreach during these hours.`,
        });
      }
    }

    const modeTrend = await this.prisma.donation.groupBy({
      by: ['donationMode'],
      _count: { id: true },
      where: { deletedAt: null, donationDate: { gte: fyStart, lte: fyEnd } },
      orderBy: { _count: { id: 'desc' } },
    });

    if (modeTrend.length > 1) {
      const topMode = modeTrend[0];
      const total = modeTrend.reduce((sum, m) => sum + m._count.id, 0);
      if (total >= 3) {
        const percentage = ((topMode._count.id / total) * 100).toFixed(0);
        const modeName = this.formatMode(topMode.donationMode || 'OTHER');
        insights.push({
          type: 'info',
          title: 'Preferred Payment Mode',
          description: `${modeName} is the most popular payment method (${percentage}% of donations). Ensure this channel is optimized.`,
        });
      }
    }

    return insights;
  }

  async getDonorInsights(donorId: string) {
    const [donations, sponsorships] = await Promise.all([
      this.prisma.donation.findMany({
        where: { donorId, deletedAt: null },
        orderBy: { donationDate: 'desc' },
      }),
      this.prisma.sponsorship.findMany({
        where: { donorId },
        include: {
          beneficiary: {
            select: { homeType: true },
          },
        },
      }),
    ]);

    const sponsoredBeneficiariesCount = new Set(sponsorships.map(s => s.beneficiaryId)).size;
    
    const homeTypeCounts: Record<string, number> = {};
    sponsorships.forEach((s) => {
      const home = s.beneficiary?.homeType || 'UNKNOWN';
      homeTypeCounts[home] = (homeTypeCounts[home] || 0) + 1;
    });
    const mostSponsoredHomeRaw = Object.entries(homeTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const mostSponsoredHome = this.formatHomeType(mostSponsoredHomeRaw);

    if (donations.length === 0) {
      return {
        avgDonation: 0,
        frequency: 'No donations yet',
        lastDonationDaysAgo: null,
        preferredMode: 'N/A',
        preferredDonationType: 'N/A',
        mostSponsoredHome: mostSponsoredHome || 'N/A',
        sponsoredBeneficiariesCount,
        totalDonations: 0,
        donationCount: 0,
      };
    }

    const total = donations.reduce((sum, d) => sum + d.donationAmount.toNumber(), 0);
    const avgDonation = total / donations.length;

    const lastDonation = donations[0];
    const daysSinceLast = Math.floor(
      (Date.now() - new Date(lastDonation.donationDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const modeCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    donations.forEach((d) => {
      const mode = d.donationMode || 'OTHER';
      modeCounts[mode] = (modeCounts[mode] || 0) + 1;
      
      const isCash = d.donationType === 'CASH';
      const typeCategory = isCash ? 'CASH' : 'IN_KIND';
      typeCounts[typeCategory] = (typeCounts[typeCategory] || 0) + 1;
    });
    const preferredMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const preferredTypeRaw = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const preferredDonationType = preferredTypeRaw === 'CASH' ? 'Cash' : preferredTypeRaw === 'IN_KIND' ? 'In-Kind' : 'N/A';

    let frequency = 'Occasional';
    if (donations.length >= 2) {
      const dates = donations.map((d) => new Date(d.donationDate).getTime());
      const gaps: number[] = [];
      for (let i = 0; i < dates.length - 1; i++) {
        gaps.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

      if (avgGap <= 45) frequency = 'Monthly';
      else if (avgGap <= 120) frequency = 'Quarterly';
      else if (avgGap <= 400) frequency = 'Annual';
      else frequency = 'Occasional';
    }

    return {
      avgDonation: Math.round(avgDonation),
      frequency,
      lastDonationDaysAgo: daysSinceLast,
      preferredMode: this.formatMode(preferredMode),
      preferredDonationType,
      mostSponsoredHome: mostSponsoredHome || 'N/A',
      sponsoredBeneficiariesCount,
      totalDonations: total,
      donationCount: donations.length,
    };
  }

  private formatHomeType(homeType?: string): string {
    const map: Record<string, string> = {
      ORPHAN_GIRLS: 'Girls Home',
      BLIND_BOYS: 'Blind Boys Home',
      OLD_AGE: 'Old Age Home',
    };
    return map[homeType || ''] || homeType || 'N/A';
  }

  private formatMode(mode: string): string {
    const map: Record<string, string> = {
      CASH: 'Cash',
      UPI: 'UPI',
      GPAY: 'Google Pay',
      PHONEPE: 'PhonePe',
      BANK_TRANSFER: 'Bank Transfer',
      CHEQUE: 'Cheque',
      ONLINE: 'Online',
    };
    return map[mode] || mode;
  }

  async getAdminInsights() {
    const { fyStart, fyEnd } = this.getCurrentFY();
    const now = new Date();
    const insights: { type: string; title: string; description: string }[] = [];

    // 1. Month-over-month donation change
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisMonth, lastMonth] = await Promise.all([
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        _count: { id: true },
        where: { deletedAt: null, donationDate: { gte: thisMonthStart, lte: thisMonthEnd } },
      }),
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        _count: { id: true },
        where: { deletedAt: null, donationDate: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
    ]);

    const thisMonthAmt = thisMonth._sum.donationAmount?.toNumber() || 0;
    const lastMonthAmt = lastMonth._sum.donationAmount?.toNumber() || 0;

    if (lastMonthAmt > 0 && thisMonthAmt > 0) {
      const change = ((thisMonthAmt - lastMonthAmt) / lastMonthAmt) * 100;
      const direction = change >= 0 ? 'increased' : 'decreased';
      insights.push({
        type: change >= 0 ? 'positive' : 'warning',
        title: 'Month-over-Month Performance',
        description: `Total donations ${direction} by ${Math.abs(change).toFixed(1)}% this month. Current: ₹${thisMonthAmt.toLocaleString('en-IN')}, Previous: ₹${lastMonthAmt.toLocaleString('en-IN')}.`,
      });
    }

    // 2. Inactive repeat donors (missed expected cycle)
    const regularDonors = await this.prisma.donor.findMany({
      where: {
        deletedAt: null,
        donationFrequency: { in: ['MONTHLY', 'QUARTERLY'] },
      },
      select: { id: true, firstName: true, lastName: true, donationFrequency: true },
    });

    const inactiveDonors: { name: string; daysInactive: number; frequency: string }[] = [];
    for (const donor of regularDonors) {
      const lastDonation = await this.prisma.donation.findFirst({
        where: { donorId: donor.id, deletedAt: null },
        orderBy: { donationDate: 'desc' },
        select: { donationDate: true },
      });

      if (lastDonation) {
        const daysSince = Math.floor((now.getTime() - new Date(lastDonation.donationDate).getTime()) / (1000 * 60 * 60 * 24));
        const expectedCycle = donor.donationFrequency === 'MONTHLY' ? 45 : 120;
        if (daysSince > expectedCycle) {
          inactiveDonors.push({
            name: `${donor.firstName} ${donor.lastName || ''}`.trim(),
            daysInactive: daysSince,
            frequency: donor.donationFrequency || 'Regular',
          });
        }
      }
    }

    if (inactiveDonors.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Missed Donation Cycles',
        description: `${inactiveDonors.length} regular donor(s) have missed their expected donation cycle. Top: ${inactiveDonors.slice(0, 3).map(d => `${d.name} (${d.daysInactive} days)`).join(', ')}.`,
      });
    }

    // 3. Donation concentration (top donors %)
    const allDonationsFY = await this.prisma.donation.aggregate({
      _sum: { donationAmount: true },
      where: { deletedAt: null, donationDate: { gte: fyStart, lte: fyEnd } },
    });

    const topDonorsSum = await this.prisma.donation.groupBy({
      by: ['donorId'],
      _sum: { donationAmount: true },
      where: { deletedAt: null, donationDate: { gte: fyStart, lte: fyEnd } },
      orderBy: { _sum: { donationAmount: 'desc' } },
      take: 5,
    });

    const totalFY = allDonationsFY._sum.donationAmount?.toNumber() || 0;
    const top5Total = topDonorsSum.reduce((sum, d) => sum + (d._sum.donationAmount?.toNumber() || 0), 0);

    if (totalFY > 0) {
      const concentration = ((top5Total / totalFY) * 100).toFixed(1);
      const riskLevel = parseFloat(concentration) > 50 ? 'high' : parseFloat(concentration) > 30 ? 'moderate' : 'low';
      insights.push({
        type: riskLevel === 'high' ? 'warning' : 'info',
        title: 'Donation Concentration',
        description: `Top 5 donors contribute ${concentration}% of this FY's donations (₹${top5Total.toLocaleString('en-IN')} of ₹${totalFY.toLocaleString('en-IN')}). Risk level: ${riskLevel}.`,
      });
    }

    // 4. Seasonal performance hints
    const quarterlyData: { q: string; amount: number }[] = [];
    const quarters = [
      { name: 'Q1 (Apr-Jun)', start: new Date(fyStart.getFullYear(), 3, 1), end: new Date(fyStart.getFullYear(), 5, 30, 23, 59, 59) },
      { name: 'Q2 (Jul-Sep)', start: new Date(fyStart.getFullYear(), 6, 1), end: new Date(fyStart.getFullYear(), 8, 30, 23, 59, 59) },
      { name: 'Q3 (Oct-Dec)', start: new Date(fyStart.getFullYear(), 9, 1), end: new Date(fyStart.getFullYear(), 11, 31, 23, 59, 59) },
      { name: 'Q4 (Jan-Mar)', start: new Date(fyStart.getFullYear() + 1, 0, 1), end: new Date(fyStart.getFullYear() + 1, 2, 31, 23, 59, 59) },
    ];

    for (const quarter of quarters) {
      if (quarter.end <= now) {
        const result = await this.prisma.donation.aggregate({
          _sum: { donationAmount: true },
          where: { deletedAt: null, donationDate: { gte: quarter.start, lte: quarter.end } },
        });
        quarterlyData.push({ q: quarter.name, amount: result._sum.donationAmount?.toNumber() || 0 });
      }
    }

    const nonZeroQuarters = quarterlyData.filter(q => q.amount > 0);
    if (nonZeroQuarters.length >= 2) {
      const best = nonZeroQuarters.reduce((a, b) => a.amount > b.amount ? a : b);
      insights.push({
        type: 'info',
        title: 'Seasonal Performance',
        description: `Best quarter: ${best.q} (₹${best.amount.toLocaleString('en-IN')}). Plan campaigns around historically strong periods.`,
      });
    }

    return insights;
  }

  async getStaffActions() {
    const now = new Date();

    // Get all donors with their last donation using a single optimized query
    const allDonors = await this.prisma.donor.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        donorCode: true,
        primaryPhone: true,
        donationFrequency: true,
        donations: {
          where: { deletedAt: null },
          orderBy: { donationDate: 'desc' },
          take: 1,
          select: { donationDate: true },
        },
      },
    });

    // Build donor follow-up list with health status
    const followUpDonors: {
      id: string;
      name: string;
      donorCode: string;
      phone: string;
      daysSinceLastDonation: number;
      healthStatus: 'AT_RISK' | 'DORMANT';
      bestTimeToContact: string;
      followUpReason: string;
    }[] = [];

    for (const donor of allDonors) {
      const lastDonation = donor.donations[0];

      if (lastDonation) {
        const lastDate = new Date(lastDonation.donationDate);
        const daysSinceLastDonation = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        // At-Risk: 60-119 days, Dormant: 120+ days
        if (daysSinceLastDonation >= 60) {
          const healthStatus = daysSinceLastDonation >= 120 ? 'DORMANT' : 'AT_RISK';

          // Determine best time to contact based on previous donation time
          const donationHour = lastDate.getHours();
          const bestTimeToContact = donationHour < 12 ? 'Morning' : 'Evening';

          // Generate follow-up reason based on status and frequency
          let followUpReason = '';
          if (healthStatus === 'DORMANT') {
            followUpReason = 'Re-engage: Last donated over 4 months ago. Gentle reminder about ongoing projects.';
          } else if (donor.donationFrequency === 'MONTHLY') {
            followUpReason = 'Monthly donor overdue. Check if they need payment assistance or reminders.';
          } else if (donor.donationFrequency === 'QUARTERLY') {
            followUpReason = 'Quarterly donor approaching due date. Share recent impact stories.';
          } else {
            followUpReason = 'Regular check-in: Share recent accomplishments and upcoming initiatives.';
          }

          followUpDonors.push({
            id: donor.id,
            name: `${donor.firstName} ${donor.lastName || ''}`.trim(),
            donorCode: donor.donorCode,
            phone: donor.primaryPhone || 'N/A',
            daysSinceLastDonation,
            healthStatus,
            bestTimeToContact,
            followUpReason,
          });
        }
      }
    }

    // Sort by days since last donation (most urgent first)
    followUpDonors.sort((a, b) => b.daysSinceLastDonation - a.daysSinceLastDonation);

    // Separate At-Risk and Dormant donors
    const atRiskDonors = followUpDonors.filter(d => d.healthStatus === 'AT_RISK');
    const dormantDonors = followUpDonors.filter(d => d.healthStatus === 'DORMANT');

    // Best time to call analysis
    const recentDonations = await this.prisma.donation.findMany({
      where: { deletedAt: null },
      select: { donationDate: true },
      orderBy: { donationDate: 'desc' },
      take: 100,
    });

    let bestCallTime = { day: 'Weekdays', slot: 'Morning (9AM-12PM)' };
    if (recentDonations.length >= 10) {
      const dayOfWeekCounts: Record<string, number> = {};
      const timeSlotCounts: Record<string, number> = {};

      recentDonations.forEach((d) => {
        const date = new Date(d.donationDate);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day = days[date.getDay()];
        dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1;

        const hour = date.getHours();
        let slot = 'Morning (9AM-12PM)';
        if (hour >= 12 && hour < 17) slot = 'Afternoon (12PM-5PM)';
        else if (hour >= 17) slot = 'Evening (5PM-9PM)';
        timeSlotCounts[slot] = (timeSlotCounts[slot] || 0) + 1;
      });

      const bestDay = Object.entries(dayOfWeekCounts).sort((a, b) => b[1] - a[1])[0];
      const bestSlot = Object.entries(timeSlotCounts).sort((a, b) => b[1] - a[1])[0];
      bestCallTime = { day: bestDay?.[0] || 'Weekdays', slot: bestSlot?.[0] || 'Morning (9AM-12PM)' };
    }

    return {
      followUpDonors: followUpDonors.slice(0, 15), // Top 15 for display
      atRiskCount: atRiskDonors.length,
      dormantCount: dormantDonors.length,
      bestCallTime,
      summary: {
        total: followUpDonors.length,
        atRisk: atRiskDonors.length,
        dormant: dormantDonors.length,
      },
    };
  }

  async getDailyActions() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const in7Days = new Date(now);
    in7Days.setDate(now.getDate() + 7);
    const in15Days = new Date(now);
    in15Days.setDate(now.getDate() + 15);

    const donorSelect = {
      id: true,
      donorCode: true,
      firstName: true,
      lastName: true,
      primaryPhone: true,
      whatsappPhone: true,
      personalEmail: true,
      officialEmail: true,
      healthScore: true,
      healthStatus: true,
    };

    const [allSpecialOccasions, reminderTasks, pledgesDue, atRiskDonors, beneficiariesWithBirthdays, activeMonthlySponsors] = await Promise.all([
      this.prisma.donorSpecialOccasion.findMany({
        where: { donor: { isDeleted: false } },
        include: { donor: { select: donorSelect } },
      }),
      this.prisma.reminderTask.findMany({
        where: {
          status: 'OPEN',
          dueDate: { lte: in15Days },
          donor: { isDeleted: false },
        },
        include: {
          donor: { select: donorSelect },
          sourcePledge: { select: { id: true, pledgeType: true, amount: true, quantity: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.pledge.findMany({
        where: {
          status: 'PENDING',
          isDeleted: false,
          expectedFulfillmentDate: { lte: in15Days },
          donor: { isDeleted: false },
        },
        include: { donor: { select: donorSelect } },
        orderBy: { expectedFulfillmentDate: 'asc' },
      }),
      this.prisma.donor.findMany({
        where: { isDeleted: false, healthStatus: 'RED' },
        select: donorSelect,
        orderBy: { healthScore: 'asc' },
        take: 50,
      }),
      this.prisma.beneficiary.findMany({
        where: {
          isDeleted: false,
          status: 'ACTIVE',
          dobMonth: { not: null },
          dobDay: { not: null },
        },
        include: {
          sponsorships: {
            where: { isActive: true, status: 'ACTIVE' },
            include: {
              donor: { select: donorSelect },
            },
          },
        },
      }),
      this.prisma.sponsorship.findMany({
        where: {
          isActive: true,
          status: 'ACTIVE',
          frequency: 'MONTHLY',
          donor: { isDeleted: false },
          beneficiary: { isDeleted: false },
        },
        include: {
          donor: { select: donorSelect },
          beneficiary: {
            select: {
              id: true,
              code: true,
              fullName: true,
              homeType: true,
              photoUrl: true,
            },
          },
        },
      }),
    ]);

    const todaySpecialDays: any[] = [];
    const upcoming7Days: any[] = [];
    const upcoming15Days: any[] = [];

    for (const occasion of allSpecialOccasions) {
      const occasionDate = new Date(now.getFullYear(), occasion.month - 1, occasion.day);
      if (occasionDate < now) {
        occasionDate.setFullYear(now.getFullYear() + 1);
      }
      
      const daysUntil = Math.ceil((occasionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const item = {
        id: occasion.id,
        donorId: occasion.donorId,
        donorName: [occasion.donor.firstName, occasion.donor.lastName].filter(Boolean).join(' '),
        donorCode: occasion.donor.donorCode,
        type: occasion.type,
        relatedPersonName: occasion.relatedPersonName,
        month: occasion.month,
        day: occasion.day,
        daysUntil,
        donor: occasion.donor,
      };

      if (occasion.month === currentMonth && occasion.day === currentDay) {
        todaySpecialDays.push(item);
      } else if (daysUntil > 0 && daysUntil <= 7) {
        upcoming7Days.push(item);
      } else if (daysUntil > 7 && daysUntil <= 15) {
        upcoming15Days.push(item);
      }
    }

    const mapReminder = (r: any) => ({
      id: r.id,
      type: r.type,
      donorId: r.donorId,
      donorName: [r.donor.firstName, r.donor.lastName].filter(Boolean).join(' '),
      donorCode: r.donor.donorCode,
      title: r.title,
      dueDate: r.dueDate,
      status: r.status,
      offsetDays: r.offsetDays,
      pledgeId: r.sourcePledge?.id,
      pledgeType: r.sourcePledge?.pledgeType,
      pledgeAmount: r.sourcePledge?.amount,
      pledgeQuantity: r.sourcePledge?.quantity,
      daysOverdue: new Date(r.dueDate) < todayStart 
        ? Math.ceil((todayStart.getTime() - new Date(r.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      daysUntil: new Date(r.dueDate) >= todayStart
        ? Math.ceil((new Date(r.dueDate).getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      donor: r.donor,
    });

    const todayReminders = reminderTasks
      .filter(r => {
        const due = new Date(r.dueDate);
        return due >= todayStart && due <= todayEnd;
      })
      .map(mapReminder);

    const overdueReminders = reminderTasks
      .filter(r => new Date(r.dueDate) < todayStart)
      .map(mapReminder);

    const upcoming7Reminders = reminderTasks
      .filter(r => {
        const due = new Date(r.dueDate);
        return due > todayEnd && due <= in7Days;
      })
      .map(mapReminder);

    const upcoming15Reminders = reminderTasks
      .filter(r => {
        const due = new Date(r.dueDate);
        return due > in7Days && due <= in15Days;
      })
      .map(mapReminder);

    const pledgeReminders = reminderTasks
      .filter(r => r.type === 'PLEDGE')
      .map(mapReminder);

    const followUpReminders = reminderTasks
      .filter(r => r.type === 'FOLLOW_UP')
      .map(mapReminder);

    const mapPledge = (p: any) => ({
      id: p.id,
      donorId: p.donorId,
      donorName: [p.donor.firstName, p.donor.lastName].filter(Boolean).join(' '),
      donorCode: p.donor.donorCode,
      pledgeType: p.pledgeType,
      amount: p.amount,
      quantity: p.quantity,
      currency: p.currency,
      expectedFulfillmentDate: p.expectedFulfillmentDate,
      notes: p.notes,
      daysOverdue: new Date(p.expectedFulfillmentDate) < todayStart
        ? Math.ceil((todayStart.getTime() - new Date(p.expectedFulfillmentDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      daysUntil: new Date(p.expectedFulfillmentDate) >= todayStart
        ? Math.ceil((new Date(p.expectedFulfillmentDate).getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      donor: p.donor,
    });

    const overduePledges = pledgesDue
      .filter(p => new Date(p.expectedFulfillmentDate) < todayStart)
      .map(mapPledge);

    const dueTodayPledges = pledgesDue
      .filter(p => {
        const due = new Date(p.expectedFulfillmentDate);
        return due >= todayStart && due <= todayEnd;
      })
      .map(mapPledge);

    const upcoming7Pledges = pledgesDue
      .filter(p => {
        const due = new Date(p.expectedFulfillmentDate);
        return due > todayEnd && due <= in7Days;
      })
      .map(mapPledge);

    // Process beneficiary birthdays
    const beneficiaryBirthdays: any[] = [];
    for (const beneficiary of beneficiariesWithBirthdays) {
      if (!beneficiary.dobMonth || !beneficiary.dobDay) continue;
      
      const birthdayDate = new Date(now.getFullYear(), beneficiary.dobMonth - 1, beneficiary.dobDay);
      if (birthdayDate < now) {
        birthdayDate.setFullYear(now.getFullYear() + 1);
      }
      
      const daysUntil = Math.ceil((birthdayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil >= 0 && daysUntil <= 7) {
        beneficiaryBirthdays.push({
          id: beneficiary.id,
          beneficiaryId: beneficiary.id,
          beneficiaryCode: beneficiary.code,
          beneficiaryName: beneficiary.fullName,
          homeType: beneficiary.homeType,
          photoUrl: beneficiary.photoUrl,
          dobMonth: beneficiary.dobMonth,
          dobDay: beneficiary.dobDay,
          daysUntil,
          isToday: daysUntil === 0,
          sponsorCount: beneficiary.sponsorships.length,
          sponsors: beneficiary.sponsorships.map((s: any) => ({
            donorId: s.donorId,
            donorCode: s.donor.donorCode,
            donorName: `${s.donor.firstName} ${s.donor.lastName || ''}`.trim(),
            primaryPhone: s.donor.primaryPhone,
            personalEmail: s.donor.personalEmail,
          })),
        });
      }
    }
    beneficiaryBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);

    // Process monthly sponsorships due (consider due around start of month or based on startDate day)
    const monthlySponsorshipsDue: any[] = [];
    for (const sponsorship of activeMonthlySponsors) {
      const startDay = (sponsorship as any).dueDayOfMonth ?? (sponsorship.startDate ? new Date(sponsorship.startDate).getDate() : null);
      if (startDay === null) continue;

      let dueDate: Date;
      if ((sponsorship as any).nextDueDate) {
        dueDate = new Date((sponsorship as any).nextDueDate);
      } else {
        dueDate = new Date(now.getFullYear(), now.getMonth(), startDay);
        if (dueDate < todayStart) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
      }
      
      const daysUntil = Math.ceil((dueDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 7 || (daysUntil < 0 && daysUntil >= -30)) {
        monthlySponsorshipsDue.push({
          id: sponsorship.id,
          sponsorshipId: sponsorship.id,
          donorId: sponsorship.donorId,
          donorCode: sponsorship.donor.donorCode,
          donorName: `${sponsorship.donor.firstName} ${sponsorship.donor.lastName || ''}`.trim(),
          beneficiaryId: sponsorship.beneficiaryId,
          beneficiaryCode: sponsorship.beneficiary.code,
          beneficiaryName: sponsorship.beneficiary.fullName,
          homeType: sponsorship.beneficiary.homeType,
          amount: sponsorship.amount,
          currency: sponsorship.currency,
          frequency: sponsorship.frequency,
          dueDay: startDay,
          daysUntil: daysUntil,
          isOverdue: daysUntil < 0,
          donor: sponsorship.donor,
          beneficiary: sponsorship.beneficiary,
        });
      }
    }
    monthlySponsorshipsDue.sort((a, b) => a.daysUntil - b.daysUntil);

    return {
      todaySpecialDays: {
        birthdays: todaySpecialDays.filter(o => o.type === 'DOB_SELF' || o.type === 'DOB_SPOUSE' || o.type === 'DOB_CHILD'),
        anniversaries: todaySpecialDays.filter(o => o.type === 'ANNIVERSARY'),
        memorials: todaySpecialDays.filter(o => o.type === 'DEATH_ANNIVERSARY'),
        other: todaySpecialDays.filter(o => o.type === 'OTHER'),
      },
      upcomingSpecialDays: {
        next7Days: upcoming7Days.sort((a, b) => a.daysUntil - b.daysUntil),
        next15Days: upcoming15Days.sort((a, b) => a.daysUntil - b.daysUntil),
      },
      reminders: {
        today: todayReminders,
        overdue: overdueReminders,
        upcoming7: upcoming7Reminders,
        upcoming15: upcoming15Reminders,
      },
      pledges: {
        overdue: overduePledges,
        dueToday: dueTodayPledges,
        upcoming7: upcoming7Pledges,
      },
      followUps: {
        dueToday: followUpReminders.filter(r => r.daysUntil === 0 && r.daysOverdue === 0),
        overdue: followUpReminders.filter(r => r.daysOverdue > 0),
      },
      atRiskDonors: atRiskDonors.map(d => ({
        id: d.id,
        donorId: d.id,
        donorName: [d.firstName, d.lastName].filter(Boolean).join(' '),
        donorCode: d.donorCode,
        healthScore: d.healthScore,
        healthStatus: d.healthStatus,
        donor: d,
      })),
      beneficiaryBirthdays: {
        today: beneficiaryBirthdays.filter(b => b.isToday),
        upcoming7: beneficiaryBirthdays.filter(b => !b.isToday),
      },
      sponsorshipsDue: monthlySponsorshipsDue,
      stats: {
        todayTotal: todaySpecialDays.length + todayReminders.length,
        upcoming7Total: upcoming7Days.length + upcoming7Reminders.length,
        upcoming15Total: upcoming15Days.length + upcoming15Reminders.length,
        overdueTotal: overdueReminders.length + overduePledges.length,
        pledgesDue: overduePledges.length + dueTodayPledges.length + upcoming7Pledges.length,
        followUpsDueToday: followUpReminders.filter(r => r.daysUntil === 0 && r.daysOverdue === 0).length,
        overdueFollowUps: followUpReminders.filter(r => r.daysOverdue > 0).length,
        atRiskCount: atRiskDonors.length,
        beneficiaryBirthdaysCount: beneficiaryBirthdays.length,
        sponsorshipsDueCount: monthlySponsorshipsDue.length,
      },
    };
  }

  async getImpactDashboard() {
    const now = new Date();
    const { fyStart, fyEnd } = this.getCurrentFY();

    const [
      totalBeneficiaries,
      beneficiariesByHome,
      totalDonors,
      activeSponsors,
      activeSponsorships,
      totalDonationsFY,
      totalCampaigns,
    ] = await Promise.all([
      this.prisma.beneficiary.count({ where: { deletedAt: null } }),
      this.prisma.beneficiary.groupBy({
        by: ['homeType'],
        _count: { id: true },
        where: { deletedAt: null },
      }),
      this.prisma.donor.count({ where: { deletedAt: null } }),
      this.prisma.sponsorship.findMany({
        where: { status: 'ACTIVE' },
        select: { donorId: true },
        distinct: ['donorId'],
      }),
      this.prisma.sponsorship.count({ where: { status: 'ACTIVE' } }),
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: { deletedAt: null, donationDate: { gte: fyStart, lte: fyEnd } },
      }),
      this.prisma.campaign.count({ where: { isDeleted: false } }),
    ]);

    const monthlyGrowth: {
      month: string;
      beneficiaries: number;
      donors: number;
      sponsorships: number;
      donations: number;
    }[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      const monthLabel = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

      const [bCount, dCount, sCount, donationAgg] = await Promise.all([
        this.prisma.beneficiary.count({
          where: { deletedAt: null, createdAt: { lte: monthEnd } },
        }),
        this.prisma.donor.count({
          where: { deletedAt: null, createdAt: { lte: monthEnd } },
        }),
        this.prisma.sponsorship.count({
          where: { status: 'ACTIVE', createdAt: { lte: monthEnd } },
        }),
        this.prisma.donation.aggregate({
          _sum: { donationAmount: true },
          _count: { id: true },
          where: {
            deletedAt: null,
            donationDate: {
              gte: new Date(date.getFullYear(), date.getMonth(), 1),
              lte: monthEnd,
            },
          },
        }),
      ]);

      monthlyGrowth.push({
        month: monthLabel,
        beneficiaries: bCount,
        donors: dCount,
        sponsorships: sCount,
        donations: donationAgg._sum.donationAmount?.toNumber() || 0,
      });
    }

    const homeMetrics = await Promise.all(
      beneficiariesByHome.map(async (h) => {
        const homeTypeToDonation: Record<string, string> = {
          ORPHAN_GIRLS: 'GIRLS_HOME',
          BLIND_BOYS: 'BLIND_BOYS_HOME',
          OLD_AGE: 'OLD_AGE_HOME',
        };
        const donationHomeType = homeTypeToDonation[h.homeType] || null;

        const [sponsorshipCount, donationTotal] = await Promise.all([
          this.prisma.sponsorship.count({
            where: {
              status: 'ACTIVE',
              beneficiary: { homeType: h.homeType, deletedAt: null },
            },
          }),
          donationHomeType
            ? this.prisma.donation.aggregate({
                _sum: { donationAmount: true },
                where: {
                  deletedAt: null,
                  donationHomeType: donationHomeType as any,
                  donationDate: { gte: fyStart, lte: fyEnd },
                },
              })
            : Promise.resolve({ _sum: { donationAmount: null } }),
        ]);

        return {
          homeType: h.homeType,
          homeLabel: this.formatHomeType(h.homeType),
          beneficiaryCount: h._count.id,
          activeSponsorships: sponsorshipCount,
          donationsReceived: donationTotal._sum.donationAmount?.toNumber() || 0,
        };
      }),
    );

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [newBeneficiariesThisMonth, newDonorsThisMonth, newBeneficiariesLastMonth, newDonorsLastMonth] = await Promise.all([
      this.prisma.beneficiary.count({
        where: { deletedAt: null, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      }),
      this.prisma.donor.count({
        where: { deletedAt: null, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      }),
      this.prisma.beneficiary.count({
        where: { deletedAt: null, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      }),
      this.prisma.donor.count({
        where: { deletedAt: null, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      }),
    ]);

    return {
      summary: {
        totalBeneficiaries,
        totalDonors,
        activeSponsors: activeSponsors.length,
        activeSponsorships,
        totalDonationsFY: totalDonationsFY._sum.donationAmount?.toNumber() || 0,
        totalCampaigns,
      },
      growth: {
        newBeneficiariesThisMonth,
        newDonorsThisMonth,
        beneficiaryGrowthPct: newBeneficiariesLastMonth > 0
          ? ((newBeneficiariesThisMonth - newBeneficiariesLastMonth) / newBeneficiariesLastMonth * 100)
          : (newBeneficiariesThisMonth > 0 ? 100 : 0),
        donorGrowthPct: newDonorsLastMonth > 0
          ? ((newDonorsThisMonth - newDonorsLastMonth) / newDonorsLastMonth * 100)
          : (newDonorsThisMonth > 0 ? 100 : 0),
      },
      monthlyGrowth,
      homeMetrics,
    };
  }

  async getRetentionAnalytics() {
    const now = new Date();
    const { fyStart, fyEnd } = this.getCurrentFY();

    const allDonors = await this.prisma.donor.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        donorCode: true,
        createdAt: true,
        donations: {
          where: { deletedAt: null },
          select: { id: true, donationDate: true, donationAmount: true },
          orderBy: { donationDate: 'desc' },
        },
      },
    });

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);

    const repeatDonors: {
      id: string;
      donorCode: string;
      name: string;
      totalDonations: number;
      totalAmount: number;
      firstDonation: string;
      lastDonation: string;
      avgFrequencyDays: number;
    }[] = [];

    const lapsedDonors: {
      id: string;
      donorCode: string;
      name: string;
      totalDonations: number;
      totalAmount: number;
      lastDonation: string;
      daysSinceLastDonation: number;
    }[] = [];

    let oneTimeDonorCount = 0;
    let neverDonatedCount = 0;

    for (const donor of allDonors) {
      const name = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
      const donations = donor.donations;

      if (donations.length === 0) {
        neverDonatedCount++;
        continue;
      }

      const totalAmount = donations.reduce(
        (sum, d) => sum + (d.donationAmount ? Number(d.donationAmount) : 0),
        0,
      );
      const firstDonation = donations[donations.length - 1].donationDate;
      const lastDonation = donations[0].donationDate;
      const daysSinceLast = Math.floor(
        (now.getTime() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24),
      );

      if (donations.length >= 2) {
        const sortedDates = donations
          .map((d) => new Date(d.donationDate).getTime())
          .sort((a, b) => a - b);
        let totalGap = 0;
        for (let i = 1; i < sortedDates.length; i++) {
          totalGap += sortedDates[i] - sortedDates[i - 1];
        }
        const avgGapMs = totalGap / (sortedDates.length - 1);
        const avgFrequencyDays = Math.round(avgGapMs / (1000 * 60 * 60 * 24));

        repeatDonors.push({
          id: donor.id,
          donorCode: donor.donorCode,
          name,
          totalDonations: donations.length,
          totalAmount,
          firstDonation: firstDonation.toISOString(),
          lastDonation: lastDonation.toISOString(),
          avgFrequencyDays,
        });

        if (daysSinceLast > 180) {
          lapsedDonors.push({
            id: donor.id,
            donorCode: donor.donorCode,
            name,
            totalDonations: donations.length,
            totalAmount,
            lastDonation: lastDonation.toISOString(),
            daysSinceLastDonation: daysSinceLast,
          });
        }
      } else {
        oneTimeDonorCount++;
        if (daysSinceLast > 180) {
          lapsedDonors.push({
            id: donor.id,
            donorCode: donor.donorCode,
            name,
            totalDonations: 1,
            totalAmount,
            lastDonation: lastDonation.toISOString(),
            daysSinceLastDonation: daysSinceLast,
          });
        }
      }
    }

    lapsedDonors.sort((a, b) => b.daysSinceLastDonation - a.daysSinceLastDonation);
    repeatDonors.sort((a, b) => b.totalDonations - a.totalDonations);

    const retentionOverTime: {
      month: string;
      totalDonors: number;
      activeDonors: number;
      retentionPct: number;
      newDonors: number;
      returningDonors: number;
    }[] = [];

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = monthStart.toLocaleDateString('en-IN', {
        month: 'short',
        year: '2-digit',
      });

      const donorsRegisteredByMonth = allDonors.filter(
        (d) => new Date(d.createdAt) <= monthEnd && d.donations.length > 0,
      ).length;

      const donorsActiveInMonth = new Set<string>();
      const newDonorsInMonth = new Set<string>();
      const returningDonorsInMonth = new Set<string>();

      for (const donor of allDonors) {
        const donationsInMonth = donor.donations.filter((d) => {
          const dd = new Date(d.donationDate);
          return dd >= monthStart && dd <= monthEnd;
        });

        if (donationsInMonth.length > 0) {
          donorsActiveInMonth.add(donor.id);

          const hadPriorDonation = donor.donations.some(
            (d) => new Date(d.donationDate) < monthStart,
          );
          if (hadPriorDonation) {
            returningDonorsInMonth.add(donor.id);
          } else {
            newDonorsInMonth.add(donor.id);
          }
        }
      }

      const retentionPct =
        donorsRegisteredByMonth > 0
          ? Math.round((donorsActiveInMonth.size / donorsRegisteredByMonth) * 100 * 10) / 10
          : 0;

      retentionOverTime.push({
        month: monthLabel,
        totalDonors: donorsRegisteredByMonth,
        activeDonors: donorsActiveInMonth.size,
        retentionPct,
        newDonors: newDonorsInMonth.size,
        returningDonors: returningDonorsInMonth.size,
      });
    }

    const donorsWhoEverDonated = allDonors.filter((d) => d.donations.length > 0).length;
    const activeLast6Months = allDonors.filter((d) =>
      d.donations.some((don) => new Date(don.donationDate) >= sixMonthsAgo),
    ).length;
    const activeLast12Months = allDonors.filter((d) =>
      d.donations.some((don) => new Date(don.donationDate) >= twelveMonthsAgo),
    ).length;

    return {
      summary: {
        totalDonors: allDonors.length,
        donorsWhoEverDonated,
        repeatDonorCount: repeatDonors.length,
        oneTimeDonorCount,
        neverDonatedCount,
        lapsedDonorCount: lapsedDonors.length,
        activeLast6Months,
        activeLast12Months,
        overallRetentionPct:
          donorsWhoEverDonated > 0
            ? Math.round((repeatDonors.length / donorsWhoEverDonated) * 100 * 10) / 10
            : 0,
      },
      retentionOverTime,
      repeatDonors: repeatDonors.slice(0, 50),
      lapsedDonors: lapsedDonors.slice(0, 50),
    };
  }

  async getInsightCards() {
    const now = new Date();
    const { fyStart, fyEnd } = this.getCurrentFY();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const oneEightyDaysAgo = new Date(now);
    oneEightyDaysAgo.setDate(now.getDate() - 180);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const cards: {
      key: string;
      title: string;
      count: number;
      description: string;
      type: 'warning' | 'info' | 'positive' | 'urgent';
      details?: { name: string; id: string; extra?: string }[];
    }[] = [];

    const allDonors = await this.prisma.donor.findMany({
      where: { deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });

    const followUpDonors: { name: string; id: string; extra?: string }[] = [];
    for (const donor of allDonors) {
      const [lastLog, lastMsg] = await Promise.all([
        this.prisma.communicationLog.findFirst({
          where: { donorId: donor.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
        this.prisma.communicationMessage.findFirst({
          where: { donorId: donor.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

      const lastContact = [lastLog?.createdAt, lastMsg?.createdAt]
        .filter(Boolean)
        .sort((a, b) => b!.getTime() - a!.getTime())[0] || null;

      if (!lastContact || lastContact < thirtyDaysAgo) {
        const daysSince = lastContact
          ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        followUpDonors.push({
          name: `${donor.firstName} ${donor.lastName || ''}`.trim(),
          id: donor.id,
          extra: daysSince ? `Last contact ${daysSince} days ago` : 'Never contacted',
        });
      }
    }

    cards.push({
      key: 'follow_up_needed',
      title: 'Donors Needing Follow-up',
      count: followUpDonors.length,
      description: followUpDonors.length > 0
        ? `${followUpDonors.length} donor(s) haven't been contacted in over 30 days or never contacted.`
        : 'All donors have been contacted recently.',
      type: 'warning',
      details: followUpDonors.slice(0, 5),
    });

    const donationsByDonor = await this.prisma.donation.groupBy({
      by: ['donorId'],
      _sum: { donationAmount: true },
      where: {
        deletedAt: null,
        donationDate: { gte: fyStart, lte: fyEnd },
      },
      orderBy: { _sum: { donationAmount: 'desc' } },
    });

    const top10PctCount = Math.max(1, Math.ceil(donationsByDonor.length * 0.1));
    const highValueDonorEntries = donationsByDonor.slice(0, top10PctCount);
    const highValueTotal = highValueDonorEntries.reduce(
      (sum, d) => sum + (d._sum.donationAmount?.toNumber() || 0),
      0,
    );

    const highValueDonorIds = highValueDonorEntries.map((d) => d.donorId);
    const highValueDonorNames = await this.prisma.donor.findMany({
      where: { id: { in: highValueDonorIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    cards.push({
      key: 'high_value',
      title: 'High Value Donors',
      count: highValueDonorEntries.length,
      description: `Top 10% of donors contributed ₹${highValueTotal.toLocaleString('en-IN')} this financial year.`,
      type: 'positive',
      details: highValueDonorNames.slice(0, 5).map((d) => ({
        name: `${d.firstName} ${d.lastName || ''}`.trim(),
        id: d.id,
      })),
    });

    const donorsWithRecentDonation = await this.prisma.donation.findMany({
      where: {
        deletedAt: null,
        donationDate: { gte: oneEightyDaysAgo },
      },
      select: { donorId: true },
      distinct: ['donorId'],
    });
    const recentDonorIds = new Set(donorsWithRecentDonation.map((d) => d.donorId));

    const donorsWithOlderDonation = await this.prisma.donation.findMany({
      where: {
        deletedAt: null,
        donationDate: { lt: oneEightyDaysAgo },
      },
      select: { donorId: true },
      distinct: ['donorId'],
    });

    const dormantDonorIds = donorsWithOlderDonation
      .map((d) => d.donorId)
      .filter((id) => !recentDonorIds.has(id));

    const dormantDonorDetails = await this.prisma.donor.findMany({
      where: { id: { in: dormantDonorIds.slice(0, 5) }, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });

    cards.push({
      key: 'dormant',
      title: 'Dormant Donors',
      count: dormantDonorIds.length,
      description: dormantDonorIds.length > 0
        ? `${dormantDonorIds.length} donor(s) have not donated in the last 6 months but had previous donations.`
        : 'No dormant donors detected.',
      type: 'info',
      details: dormantDonorDetails.map((d) => ({
        name: `${d.firstName} ${d.lastName || ''}`.trim(),
        id: d.id,
        extra: 'No donation in 180+ days',
      })),
    });

    const pledgesDueThisWeek = await this.prisma.pledge.findMany({
      where: {
        status: 'PENDING',
        isDeleted: false,
        expectedFulfillmentDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        donor: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const pledgeTotalAmount = pledgesDueThisWeek.reduce(
      (sum, p) => sum + (p.amount?.toNumber() || 0),
      0,
    );

    cards.push({
      key: 'pledges_due',
      title: 'Pledges Due This Week',
      count: pledgesDueThisWeek.length,
      description: pledgesDueThisWeek.length > 0
        ? `${pledgesDueThisWeek.length} pledge(s) worth ₹${pledgeTotalAmount.toLocaleString('en-IN')} due within 7 days.`
        : 'No pledges due this week.',
      type: 'urgent',
      details: pledgesDueThisWeek.slice(0, 5).map((p) => ({
        name: `${p.donor.firstName} ${p.donor.lastName || ''}`.trim(),
        id: p.donor.id,
        extra: `₹${p.amount?.toNumber().toLocaleString('en-IN') || '0'} due ${new Date(p.expectedFulfillmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      })),
    });

    return cards;
  }

  async markActionDone(
    user: any,
    params: { donorId: string; actionType: string; description: string },
  ) {
    await this.communicationLogService.create({
      donorId: params.donorId,
      channel: CommunicationChannel.EMAIL,
      type: CommunicationType.GENERAL,
      status: CommunicationStatus.SENT,
      subject: `Action Completed: ${params.actionType}`,
      messagePreview: params.description,
      sentById: user.id || user.sub,
    });

    this.logger.log(`Daily action marked done: ${params.actionType} for donor ${params.donorId} by user ${user.id || user.sub}`);
    return { success: true, message: 'Action marked as done and logged to timeline' };
  }

  async snoozeAction(
    user: any,
    params: { donorId: string; actionType: string; description: string; days: number },
  ) {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + params.days);

    await this.communicationLogService.create({
      donorId: params.donorId,
      channel: CommunicationChannel.EMAIL,
      type: CommunicationType.GENERAL,
      status: CommunicationStatus.SENT,
      subject: `Action Snoozed: ${params.actionType}`,
      messagePreview: `${params.description} - Snoozed for ${params.days} days until ${snoozeUntil.toLocaleDateString('en-IN')}`,
      sentById: user.id || user.sub,
    });

    this.logger.log(`Daily action snoozed: ${params.actionType} for donor ${params.donorId}, ${params.days} days`);
    return { success: true, message: `Action snoozed for ${params.days} days`, snoozeUntil };
  }
}
