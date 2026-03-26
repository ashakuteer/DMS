import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { formatHomeType, formatMode, getCurrentFY } from "./dashboard.helpers";

@Injectable()
export class DashboardInsightsService {
  private readonly logger = new Logger(DashboardInsightsService.name);

  // Simple in-memory TTL cache — drop-in ready for Redis
  private readonly cache = new Map<string, { data: any; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiresAt) return entry.data as T;
    this.cache.delete(key);
    return null;
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, { data, expiresAt: Date.now() + this.CACHE_TTL_MS });
  }

  async getAIInsights() {
    const cached = this.getCached<any[]>("ai_insights");
    if (cached) {
      this.logger.debug("getAIInsights() served from cache");
      return cached;
    }

    const start = Date.now();
    const { fyStart, fyEnd } = getCurrentFY();
    const now = new Date();
    const insights: { type: string; title: string; description: string }[] = [];

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // FIX: Run all independent queries in parallel (was 4 sequential rounds)
    const [thisMonth, lastMonth, regularDonors, donations, modeTrend] = await Promise.all([
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        _count: { id: true },
        where: {
          deletedAt: null,
          donationDate: { gte: thisMonthStart, lte: thisMonthEnd },
        },
      }),
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        _count: { id: true },
        where: {
          deletedAt: null,
          donationDate: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      this.prisma.donor.findMany({
        where: {
          deletedAt: null,
          donationFrequency: { in: ["MONTHLY", "QUARTERLY"] },
        },
        select: { id: true },
      }),
      // FIX: Added take:500 — was fetching ALL FY donations for JS time-slot analysis
      this.prisma.donation.findMany({
        where: {
          deletedAt: null,
          donationDate: { gte: fyStart, lte: fyEnd },
        },
        select: { donationDate: true },
        orderBy: { donationDate: "desc" },
        take: 500,
      }),
      this.prisma.donation.groupBy({
        by: ["donationMode"],
        _count: { id: true },
        where: {
          deletedAt: null,
          donationDate: { gte: fyStart, lte: fyEnd },
        },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    // Month-over-month insight
    const thisMonthAmt = thisMonth._sum.donationAmount?.toNumber() || 0;
    const lastMonthAmt = lastMonth._sum.donationAmount?.toNumber() || 0;

    if (lastMonthAmt > 0 && thisMonthAmt > 0) {
      const change = ((thisMonthAmt - lastMonthAmt) / lastMonthAmt) * 100;
      const direction = change >= 0 ? "up" : "down";
      insights.push({
        type: direction === "up" ? "positive" : "warning",
        title: "Month-over-Month Change",
        description: `Donations are ${direction} ${Math.abs(change).toFixed(1)}% compared to last month (₹${thisMonthAmt.toLocaleString("en-IN")} vs ₹${lastMonthAmt.toLocaleString("en-IN")}).`,
      });
    }

    // Inactive regular donors — activeDonorIds depends on regularDonors, so sequential here is correct
    const regularDonorIds = regularDonors.map((d) => d.id);

    if (regularDonorIds.length > 0) {
      const activeDonorIds = await this.prisma.donation.findMany({
        where: {
          deletedAt: null,
          donorId: { in: regularDonorIds },
          donationDate: { gte: sixtyDaysAgo },
        },
        select: { donorId: true },
        distinct: ["donorId"],
      });

      const inactiveCount = regularDonorIds.length - activeDonorIds.length;

      if (inactiveCount > 0) {
        insights.push({
          type: "warning",
          title: "Inactive Regular Donors",
          description: `${inactiveCount} regular donor(s) haven't donated in the last 60 days. Consider reaching out to re-engage them.`,
        });
      }
    }

    // FIX: Time-slot analysis now uses the limited `donations` fetched above (max 500)
    if (donations.length >= 5) {
      const hourCounts: Record<string, number> = {};

      donations.forEach((d) => {
        const hour = new Date(d.donationDate).getHours();
        const timeSlot =
          hour < 12
            ? "Morning (6AM-12PM)"
            : hour < 17
              ? "Afternoon (12PM-5PM)"
              : "Evening (5PM-9PM)";

        hourCounts[timeSlot] = (hourCounts[timeSlot] || 0) + 1;
      });

      const topSlot = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

      if (topSlot) {
        insights.push({
          type: "info",
          title: "Peak Donation Time",
          description: `Most donations are received during ${topSlot[0]} (${topSlot[1]} donations). Consider scheduling outreach during these hours.`,
        });
      }
    }

    // FIX: modeTrend was fetched in parallel above, now just process it
    if (modeTrend.length > 1) {
      const topMode = modeTrend[0];
      const total = modeTrend.reduce((sum, m) => sum + m._count.id, 0);

      if (total >= 3) {
        const percentage = ((topMode._count.id / total) * 100).toFixed(0);
        const modeName = formatMode(topMode.donationMode || "OTHER");

        insights.push({
          type: "info",
          title: "Preferred Payment Mode",
          description: `${modeName} is the most popular payment method (${percentage}% of donations). Ensure this channel is optimized.`,
        });
      }
    }

    this.setCached("ai_insights", insights);
    this.logger.log(`getAIInsights() completed in ${Date.now() - start}ms`);
    return insights;
  }

  async getDonorInsights(donorId: string) {
    const [donations, sponsorships] = await Promise.all([
      this.prisma.donation.findMany({
        where: { donorId, deletedAt: null },
        orderBy: { donationDate: "desc" },
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

    const sponsoredBeneficiariesCount = new Set(
      sponsorships.map((s) => s.beneficiaryId),
    ).size;

    const homeTypeCounts: Record<string, number> = {};
    sponsorships.forEach((s) => {
      const home = s.beneficiary?.homeType || "UNKNOWN";
      homeTypeCounts[home] = (homeTypeCounts[home] || 0) + 1;
    });

    const mostSponsoredHomeRaw = Object.entries(homeTypeCounts).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];

    const mostSponsoredHome = formatHomeType(mostSponsoredHomeRaw);

    if (donations.length === 0) {
      return {
        avgDonation: 0,
        frequency: "No donations yet",
        lastDonationDaysAgo: null,
        preferredMode: "N/A",
        preferredDonationType: "N/A",
        mostSponsoredHome: mostSponsoredHome || "N/A",
        sponsoredBeneficiariesCount,
        totalDonations: 0,
        donationCount: 0,
      };
    }

    const total = donations.reduce(
      (sum, d) => sum + d.donationAmount.toNumber(),
      0,
    );
    const avgDonation = total / donations.length;

    const lastDonation = donations[0];
    const daysSinceLast = Math.floor(
      (Date.now() - new Date(lastDonation.donationDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const modeCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    donations.forEach((d) => {
      const mode = d.donationMode || "OTHER";
      modeCounts[mode] = (modeCounts[mode] || 0) + 1;

      const isCash = d.donationType === "CASH";
      const typeCategory = isCash ? "CASH" : "IN_KIND";
      typeCounts[typeCategory] = (typeCounts[typeCategory] || 0) + 1;
    });

    const preferredMode =
      Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const preferredTypeRaw = Object.entries(typeCounts).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];

    const preferredDonationType =
      preferredTypeRaw === "CASH"
        ? "Cash"
        : preferredTypeRaw === "IN_KIND"
          ? "In-Kind"
          : "N/A";

    let frequency = "Occasional";

    if (donations.length >= 2) {
      const dates = donations.map((d) => new Date(d.donationDate).getTime());
      const gaps: number[] = [];

      for (let i = 0; i < dates.length - 1; i++) {
        gaps.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
      }

      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

      if (avgGap <= 45) frequency = "Monthly";
      else if (avgGap <= 120) frequency = "Quarterly";
      else if (avgGap <= 400) frequency = "Annual";
      else frequency = "Occasional";
    }

    return {
      avgDonation: Math.round(avgDonation),
      frequency,
      lastDonationDaysAgo: daysSinceLast,
      preferredMode: formatMode(preferredMode),
      preferredDonationType,
      mostSponsoredHome: mostSponsoredHome || "N/A",
      sponsoredBeneficiariesCount,
      totalDonations: total,
      donationCount: donations.length,
    };
  }

  async getAdminInsights() {
    const cached = this.getCached<any[]>("admin_insights");
    if (cached) {
      this.logger.debug("getAdminInsights() served from cache");
      return cached;
    }

    const start = Date.now();
    const { fyStart, fyEnd } = getCurrentFY();
    const now = new Date();
    const insights: { type: string; title: string; description: string }[] = [];

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    // FIX: Run all independent queries in parallel (was 3 sequential rounds before regularDonors loop)
    const [thisMonth, lastMonth, regularDonors, allDonationsFY, topDonorsSum] = await Promise.all([
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        _count: { id: true },
        where: {
          deletedAt: null,
          donationDate: { gte: thisMonthStart, lte: thisMonthEnd },
        },
      }),
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        _count: { id: true },
        where: {
          deletedAt: null,
          donationDate: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      this.prisma.donor.findMany({
        where: {
          deletedAt: null,
          donationFrequency: { in: ["MONTHLY", "QUARTERLY"] },
        },
        select: { id: true, firstName: true, lastName: true, donationFrequency: true },
      }),
      // FIX: Moved allDonationsFY + topDonorsSum into this parallel round (was sequential after regularDonors)
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: { gte: fyStart, lte: fyEnd },
        },
      }),
      this.prisma.donation.groupBy({
        by: ["donorId"],
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: { gte: fyStart, lte: fyEnd },
        },
        orderBy: { _sum: { donationAmount: "desc" } },
        take: 5,
      }),
    ]);

    // Month-over-month insight
    const thisMonthAmt = thisMonth._sum.donationAmount?.toNumber() || 0;
    const lastMonthAmt = lastMonth._sum.donationAmount?.toNumber() || 0;

    if (lastMonthAmt > 0 && thisMonthAmt > 0) {
      const change = ((thisMonthAmt - lastMonthAmt) / lastMonthAmt) * 100;
      const direction = change >= 0 ? "increased" : "decreased";

      insights.push({
        type: change >= 0 ? "positive" : "warning",
        title: "Month-over-Month Performance",
        description: `Total donations ${direction} by ${Math.abs(change).toFixed(1)}% this month. Current: ₹${thisMonthAmt.toLocaleString("en-IN")}, Previous: ₹${lastMonthAmt.toLocaleString("en-IN")}.`,
      });
    }

    // Inactive regular donors — latestDonations depends on regularDonors, sequential is correct
    const regularDonorIds = regularDonors.map((d) => d.id);

    const latestDonations = regularDonorIds.length
      ? await this.prisma.donation.findMany({
          where: {
            donorId: { in: regularDonorIds },
            deletedAt: null,
          },
          orderBy: { donationDate: "desc" },
          select: { donorId: true, donationDate: true },
          take: Math.max(regularDonorIds.length * 3, 500),
        })
      : [];

    const latestDonationMap = new Map<string, Date>();
    for (const donation of latestDonations) {
      if (!latestDonationMap.has(donation.donorId)) {
        latestDonationMap.set(donation.donorId, donation.donationDate);
      }
    }

    const inactiveDonors: { name: string; daysInactive: number; frequency: string }[] = [];

    for (const donor of regularDonors) {
      const lastDonation = latestDonationMap.get(donor.id);

      if (lastDonation) {
        const daysSince = Math.floor(
          (now.getTime() - new Date(lastDonation).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        const expectedCycle = donor.donationFrequency === "MONTHLY" ? 45 : 120;

        if (daysSince > expectedCycle) {
          inactiveDonors.push({
            name: `${donor.firstName} ${donor.lastName || ""}`.trim(),
            daysInactive: daysSince,
            frequency: donor.donationFrequency || "Regular",
          });
        }
      }
    }

    if (inactiveDonors.length > 0) {
      insights.push({
        type: "warning",
        title: "Missed Donation Cycles",
        description: `${inactiveDonors.length} regular donor(s) have missed their expected donation cycle. Top: ${inactiveDonors
          .slice(0, 3)
          .map((d) => `${d.name} (${d.daysInactive} days)`)
          .join(", ")}.`,
      });
    }

    // Donation concentration insight (uses allDonationsFY + topDonorsSum fetched in round 1)
    const totalFY = allDonationsFY._sum.donationAmount?.toNumber() || 0;
    const top5Total = topDonorsSum.reduce(
      (sum, d) => sum + (d._sum.donationAmount?.toNumber() || 0),
      0,
    );

    if (totalFY > 0) {
      const concentration = ((top5Total / totalFY) * 100).toFixed(1);
      const riskLevel =
        parseFloat(concentration) > 50
          ? "high"
          : parseFloat(concentration) > 30
            ? "moderate"
            : "low";

      insights.push({
        type: riskLevel === "high" ? "warning" : "info",
        title: "Donation Concentration",
        description: `Top 5 donors contribute ${concentration}% of this FY's donations (₹${top5Total.toLocaleString("en-IN")} of ₹${totalFY.toLocaleString("en-IN")}). Risk level: ${riskLevel}.`,
      });
    }

    // FIX: Quarterly queries run in parallel instead of sequentially in a for loop
    const quarters = [
      {
        name: "Q1 (Apr-Jun)",
        start: new Date(fyStart.getFullYear(), 3, 1),
        end: new Date(fyStart.getFullYear(), 5, 30, 23, 59, 59),
      },
      {
        name: "Q2 (Jul-Sep)",
        start: new Date(fyStart.getFullYear(), 6, 1),
        end: new Date(fyStart.getFullYear(), 8, 30, 23, 59, 59),
      },
      {
        name: "Q3 (Oct-Dec)",
        start: new Date(fyStart.getFullYear(), 9, 1),
        end: new Date(fyStart.getFullYear(), 11, 31, 23, 59, 59),
      },
      {
        name: "Q4 (Jan-Mar)",
        start: new Date(fyStart.getFullYear() + 1, 0, 1),
        end: new Date(fyStart.getFullYear() + 1, 2, 31, 23, 59, 59),
      },
    ];

    const eligibleQuarters = quarters.filter((q) => q.end <= now);

    const quarterResults = await Promise.all(
      eligibleQuarters.map((q) =>
        this.prisma.donation.aggregate({
          _sum: { donationAmount: true },
          where: {
            deletedAt: null,
            donationDate: { gte: q.start, lte: q.end },
          },
        }),
      ),
    );

    const quarterlyData = quarterResults.map((result, i) => ({
      q: eligibleQuarters[i].name,
      amount: result._sum.donationAmount?.toNumber() || 0,
    }));

    const nonZeroQuarters = quarterlyData.filter((q) => q.amount > 0);

    if (nonZeroQuarters.length >= 2) {
      const best = nonZeroQuarters.reduce((a, b) => (a.amount > b.amount ? a : b));

      insights.push({
        type: "info",
        title: "Seasonal Performance",
        description: `Best quarter: ${best.q} (₹${best.amount.toLocaleString("en-IN")}). Plan campaigns around historically strong periods.`,
      });
    }

    this.setCached("admin_insights", insights);
    this.logger.log(`getAdminInsights() completed in ${Date.now() - start}ms`);
    return insights;
  }

  async getInsightCards() {
    const cached = this.getCached<any[]>("insight_cards");
    if (cached) {
      this.logger.debug("getInsightCards() served from cache");
      return cached;
    }

    const start = Date.now();
    const now = new Date();
    const { fyStart, fyEnd } = getCurrentFY();
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
      type: "warning" | "info" | "positive" | "urgent";
      details?: { name: string; id: string; extra?: string }[];
    }[] = [];

    // FIX: Was fetching ALL donors + ALL their logs + ALL messages (no limits, sequential).
    // Now: fetch only recently-contacted donor IDs (last 30 days) + counts + other data — all in parallel.
    const [
      totalDonorCount,
      recentLogDonorIds,
      recentMsgDonorIds,
      donationsByDonor,
      donorsWithRecentDonation,
      donorsWithOlderDonation,
      pledgesDueThisWeek,
    ] = await Promise.all([
      this.prisma.donor.count({ where: { deletedAt: null } }),
      // Only fetch donors contacted in last 30 days (not all logs)
      this.prisma.communicationLog.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { donorId: true },
        distinct: ["donorId"],
      }),
      this.prisma.communicationMessage.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          donorId: { not: null },
        },
        select: { donorId: true },
        distinct: ["donorId"],
      }),
      this.prisma.donation.groupBy({
        by: ["donorId"],
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: { gte: fyStart, lte: fyEnd },
        },
        orderBy: { _sum: { donationAmount: "desc" } },
      }),
      // FIX: These two were sequential — now parallel
      this.prisma.donation.findMany({
        where: {
          deletedAt: null,
          donationDate: { gte: oneEightyDaysAgo },
        },
        select: { donorId: true },
        distinct: ["donorId"],
      }),
      this.prisma.donation.findMany({
        where: {
          deletedAt: null,
          donationDate: { lt: oneEightyDaysAgo },
        },
        select: { donorId: true },
        distinct: ["donorId"],
      }),
      this.prisma.pledge.findMany({
        where: {
          status: "PENDING",
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
      }),
    ]);

    // Compute follow-up donors: total minus those recently contacted
    const recentlyContactedIds = new Set([
      ...recentLogDonorIds.map((l) => l.donorId),
      ...recentMsgDonorIds.filter((m) => m.donorId).map((m) => m.donorId!),
    ]);

    const followUpCount = Math.max(0, totalDonorCount - recentlyContactedIds.size);

    // Compute high-value donors (top 10%)
    const top10PctCount = Math.max(1, Math.ceil(donationsByDonor.length * 0.1));
    const highValueDonorEntries = donationsByDonor.slice(0, top10PctCount);
    const highValueTotal = highValueDonorEntries.reduce(
      (sum, d) => sum + (d._sum.donationAmount?.toNumber() || 0),
      0,
    );
    const highValueDonorIds = highValueDonorEntries.map((d) => d.donorId);

    // Compute dormant donors
    const recentDonorIds = new Set(donorsWithRecentDonation.map((d) => d.donorId));
    const dormantDonorIds = donorsWithOlderDonation
      .map((d) => d.donorId)
      .filter((id) => !recentDonorIds.has(id));

    // FIX: Was 3 sequential queries for names — now 3 parallel queries
    const [followUpDonorSample, dormantDonorDetails, highValueDonorNames] = await Promise.all([
      followUpCount > 0
        ? this.prisma.donor.findMany({
            where: {
              deletedAt: null,
              id: { notIn: Array.from(recentlyContactedIds) },
            },
            select: { id: true, firstName: true, lastName: true },
            take: 5,
          })
        : Promise.resolve([] as { id: string; firstName: string; lastName: string | null }[]),
      dormantDonorIds.length > 0
        ? this.prisma.donor.findMany({
            where: { id: { in: dormantDonorIds.slice(0, 5) }, deletedAt: null },
            select: { id: true, firstName: true, lastName: true },
          })
        : Promise.resolve([] as { id: string; firstName: string; lastName: string | null }[]),
      highValueDonorIds.length > 0
        ? this.prisma.donor.findMany({
            where: { id: { in: highValueDonorIds } },
            select: { id: true, firstName: true, lastName: true },
          })
        : Promise.resolve([] as { id: string; firstName: string; lastName: string | null }[]),
    ]);

    // Build insight cards
    cards.push({
      key: "follow_up_needed",
      title: "Donors Needing Follow-up",
      count: followUpCount,
      description:
        followUpCount > 0
          ? `${followUpCount} donor(s) haven't been contacted in over 30 days or never contacted.`
          : "All donors have been contacted recently.",
      type: "warning",
      details: followUpDonorSample.map((d) => ({
        name: `${d.firstName} ${d.lastName || ""}`.trim(),
        id: d.id,
        extra: "No contact in 30+ days",
      })),
    });

    cards.push({
      key: "high_value",
      title: "High Value Donors",
      count: highValueDonorEntries.length,
      description: `Top 10% of donors contributed ₹${highValueTotal.toLocaleString("en-IN")} this financial year.`,
      type: "positive",
      details: highValueDonorNames.slice(0, 5).map((d) => ({
        name: `${d.firstName} ${d.lastName || ""}`.trim(),
        id: d.id,
      })),
    });

    cards.push({
      key: "dormant",
      title: "Dormant Donors",
      count: dormantDonorIds.length,
      description:
        dormantDonorIds.length > 0
          ? `${dormantDonorIds.length} donor(s) have not donated in the last 6 months but had previous donations.`
          : "No dormant donors detected.",
      type: "info",
      details: dormantDonorDetails.map((d) => ({
        name: `${d.firstName} ${d.lastName || ""}`.trim(),
        id: d.id,
        extra: "No donation in 180+ days",
      })),
    });

    const pledgeTotalAmount = pledgesDueThisWeek.reduce(
      (sum, p) => sum + (p.amount?.toNumber() || 0),
      0,
    );

    cards.push({
      key: "pledges_due",
      title: "Pledges Due This Week",
      count: pledgesDueThisWeek.length,
      description:
        pledgesDueThisWeek.length > 0
          ? `${pledgesDueThisWeek.length} pledge(s) worth ₹${pledgeTotalAmount.toLocaleString("en-IN")} due within 7 days.`
          : "No pledges due this week.",
      type: "urgent",
      details: pledgesDueThisWeek.slice(0, 5).map((p) => ({
        name: `${p.donor.firstName} ${p.donor.lastName || ""}`.trim(),
        id: p.donor.id,
        extra: `₹${p.amount?.toNumber().toLocaleString("en-IN") || "0"} due ${new Date(p.expectedFulfillmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
      })),
    });

    this.setCached("insight_cards", cards);
    this.logger.log(`getInsightCards() completed in ${Date.now() - start}ms`);
    return cards;
  }
}
