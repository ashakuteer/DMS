import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class CampaignsAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getCampaignTotalRaised(campaignId: string): Promise<number> {
    const donations = await this.prisma.donation.findMany({
      where: { campaignId, isDeleted: false },
      select: { donationAmount: true },
    });
    return donations.reduce((sum, d) => sum + Number(d.donationAmount), 0);
  }

  async getAnalytics(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    const donations = await this.prisma.donation.findMany({
      where: { campaignId, isDeleted: false },
      select: {
        id: true,
        donationAmount: true,
        donationDate: true,
        donationType: true,
        donationMode: true,
        donationHomeType: true,
        donorId: true,
      },
      orderBy: { donationDate: 'asc' },
    });

    const totalRaised = donations.reduce((sum, d) => sum + Number(d.donationAmount), 0);
    const goalAmount = campaign.goalAmount ? Number(campaign.goalAmount) : 0;
    const uniqueDonors = new Set(donations.map((d) => d.donorId)).size;
    const avgDonation = donations.length > 0 ? totalRaised / donations.length : 0;

    const monthlyData: Record<string, { month: string; amount: number; count: number }> = {};
    for (const d of donations) {
      const date = new Date(d.donationDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      if (!monthlyData[key]) {
        monthlyData[key] = { month: label, amount: 0, count: 0 };
      }
      monthlyData[key].amount += Number(d.donationAmount);
      monthlyData[key].count++;
    }

    const byType: Record<string, { type: string; amount: number; count: number }> = {};
    for (const d of donations) {
      const type = d.donationType || 'OTHER';
      if (!byType[type]) byType[type] = { type, amount: 0, count: 0 };
      byType[type].amount += Number(d.donationAmount);
      byType[type].count++;
    }

    const byMode: Record<string, { mode: string; amount: number; count: number }> = {};
    for (const d of donations) {
      const mode = d.donationMode || 'OTHER';
      if (!byMode[mode]) byMode[mode] = { mode, amount: 0, count: 0 };
      byMode[mode].amount += Number(d.donationAmount);
      byMode[mode].count++;
    }

    const byHome: Record<string, { home: string; amount: number; count: number }> = {};
    for (const d of donations) {
      const home = d.donationHomeType || 'GENERAL';
      if (!byHome[home]) byHome[home] = { home, amount: 0, count: 0 };
      byHome[home].amount += Number(d.donationAmount);
      byHome[home].count++;
    }

    let cumulativeData: { month: string; cumulative: number }[] = [];
    let runningTotal = 0;
    const sortedMonths = Object.keys(monthlyData).sort();
    for (const key of sortedMonths) {
      runningTotal += monthlyData[key].amount;
      cumulativeData.push({ month: monthlyData[key].month, cumulative: runningTotal });
    }

    return {
      summary: {
        totalRaised,
        goalAmount,
        progressPercent:
          goalAmount > 0 ? Math.min(100, Math.round((totalRaised / goalAmount) * 100)) : 0,
        totalDonations: donations.length,
        uniqueDonors,
        avgDonation: Math.round(avgDonation),
        remaining: Math.max(0, goalAmount - totalRaised),
      },
      monthlyDonations: Object.values(monthlyData),
      cumulativeProgress: cumulativeData,
      byType: Object.values(byType).sort((a, b) => b.amount - a.amount),
      byMode: Object.values(byMode).sort((a, b) => b.amount - a.amount),
      byHome: Object.values(byHome).sort((a, b) => b.amount - a.amount),
    };
  }

  async getTimeline(id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign || campaign.isDeleted) {
      throw new NotFoundException('Campaign not found');
    }

    const donations = await this.prisma.donation.findMany({
      where: { campaignId: id, isDeleted: false },
      orderBy: { donationDate: 'desc' },
      select: {
        id: true,
        donationAmount: true,
        donationDate: true,
        donationType: true,
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const [donationLinkedLogs, campaignAppealLogs] = await Promise.all([
      this.prisma.communicationLog.findMany({
        where: { donation: { campaignId: id } },
        orderBy: { createdAt: 'desc' },
        include: { donor: { select: { id: true, firstName: true, lastName: true } } },
      }),
      this.prisma.communicationLog.findMany({
        where: { metadata: { path: ['campaignId'], equals: id } },
        orderBy: { createdAt: 'desc' },
        include: { donor: { select: { id: true, firstName: true, lastName: true } } },
      }),
    ]);

    const seenIds = new Set<string>();
    const communicationLogs = [...donationLinkedLogs, ...campaignAppealLogs].filter((cl) => {
      if (seenIds.has(cl.id)) return false;
      seenIds.add(cl.id);
      return true;
    });

    const timeline: any[] = [];

    for (const d of donations) {
      timeline.push({
        type: 'DONATION',
        date: d.donationDate,
        donorName: `${d.donor.firstName} ${d.donor.lastName || ''}`.trim(),
        donorCode: d.donor.donorCode,
        amount: Number(d.donationAmount),
        donationType: d.donationType,
        id: d.id,
      });
    }

    for (const cl of communicationLogs) {
      timeline.push({
        type: 'MESSAGE',
        date: cl.createdAt,
        channel: cl.channel,
        subject: cl.subject,
        donorName: cl.donor
          ? `${cl.donor.firstName} ${cl.donor.lastName || ''}`.trim()
          : 'Unknown',
        id: cl.id,
      });
    }

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }
}
