import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { formatHomeType, getCurrentFY } from "./dashboard.helpers";

@Injectable()
export class DashboardImpactService {
  private readonly logger = new Logger(DashboardImpactService.name);

  private readonly cache = new Map<string, { data: any; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

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

  async getImpactDashboard() {
    const cached = this.getCached<any>("impact_dashboard");
    if (cached) {
      this.logger.debug("getImpactDashboard() served from cache");
      return cached;
    }

    const start = Date.now();
    try {
    const now = new Date();
    const { fyStart, fyEnd } = getCurrentFY();

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Last 12 months window for the growth chart
    const monthRanges = Array.from({ length: 12 }, (_, idx) => {
      const i = 11 - idx;
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      return {
        label: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        key: date.toISOString().slice(0, 7),
        monthStart: new Date(date.getFullYear(), date.getMonth(), 1),
        monthEnd,
      };
    });

    const maxMonthEnd = monthRanges[monthRanges.length - 1].monthEnd;
    const windowStart = monthRanges[0].monthStart;

    // ─── All queries in ONE parallel batch ───────────────────────────────────────
    //
    // KEY OPTIMIZATION: was 48 queries (12 months × 4 counts/aggregates).
    // Now replaced with 4 raw SQL GROUP BY queries + summary queries = 1 round-trip.
    const [
      // Summary data
      totalBeneficiaries,
      beneficiariesByHome,
      totalDonors,
      activeSponsors,
      activeSponsorships,
      totalDonationsFY,
      totalCampaigns,
      newBeneficiariesThisMonth,
      newDonorsThisMonth,
      newBeneficiariesLastMonth,
      newDonorsLastMonth,

      // Per-month NEW counts (raw SQL GROUP BY — 4 queries replace 48)
      beneficiaryNewByMonth,
      donorNewByMonth,
      sponsorshipNewByMonth,
      donationByMonth,

      // Home-level metrics
      sponsorshipsByHome,
      donationsByHomeType,
    ] = await Promise.all([
      this.prisma.beneficiary.count({ where: { deletedAt: null } }),

      this.prisma.beneficiary.groupBy({
        by: ["homeType"],
        _count: { id: true },
        where: { deletedAt: null },
      }),

      this.prisma.donor.count({ where: { deletedAt: null } }),

      // Count of distinct donors with active sponsorships
      this.prisma.sponsorship.groupBy({
        by: ["donorId"],
        where: { status: "ACTIVE" },
      }),

      this.prisma.sponsorship.count({ where: { status: "ACTIVE" } }),

      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: { deletedAt: null, donationDate: { gte: fyStart, lte: fyEnd } },
      }),

      this.prisma.campaign.count({ where: { isDeleted: false } }),

      this.prisma.beneficiary.count({
        where: { deletedAt: null, createdAt: { gte: thisMonthStart } },
      }),

      this.prisma.donor.count({
        where: { deletedAt: null, createdAt: { gte: thisMonthStart } },
      }),

      this.prisma.beneficiary.count({
        where: { deletedAt: null, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      }),

      this.prisma.donor.count({
        where: { deletedAt: null, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      }),

      // New beneficiaries created per month (replaces 12 × count queries)
      this.prisma.$queryRaw<{ month: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('month', "createdAt") AS month, COUNT(*) AS count
        FROM beneficiaries
        WHERE "deletedAt" IS NULL AND "createdAt" <= ${maxMonthEnd}
        GROUP BY DATE_TRUNC('month', "createdAt")
      `,

      // New donors created per month (replaces 12 × count queries)
      this.prisma.$queryRaw<{ month: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('month', "createdAt") AS month, COUNT(*) AS count
        FROM donors
        WHERE "deletedAt" IS NULL AND "createdAt" <= ${maxMonthEnd}
        GROUP BY DATE_TRUNC('month', "createdAt")
      `,

      // New active sponsorships created per month (replaces 12 × count queries)
      this.prisma.$queryRaw<{ month: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('month', "createdAt") AS month, COUNT(*) AS count
        FROM sponsorships
        WHERE "status" = 'ACTIVE' AND "createdAt" <= ${maxMonthEnd}
        GROUP BY DATE_TRUNC('month', "createdAt")
      `,

      // Donations amount + count per month (replaces 12 × aggregate queries)
      this.prisma.$queryRaw<{ month: Date; amount: string | null; count: bigint }[]>`
        SELECT
          DATE_TRUNC('month', "donationDate") AS month,
          SUM("donationAmount")               AS amount,
          COUNT(*)                            AS count
        FROM donations
        WHERE "deletedAt" IS NULL
          AND "donationDate" >= ${windowStart}
          AND "donationDate" <= ${maxMonthEnd}
        GROUP BY DATE_TRUNC('month', "donationDate")
      `,

      // Sponsorships count per homeType (replaces per-home loop queries)
      this.prisma.$queryRaw<{ homeType: string; count: bigint }[]>`
        SELECT b."homeType", COUNT(s.id) AS count
        FROM sponsorships s
        JOIN beneficiaries b ON b.id = s."beneficiaryId"
        WHERE s.status = 'ACTIVE'
          AND b."deletedAt" IS NULL
        GROUP BY b."homeType"
      `,

      // Donations sum per home type for FY (replaces per-home loop queries)
      this.prisma.$queryRaw<{ homeType: string; amount: string | null }[]>`
        SELECT "donationHomeType" AS "homeType", SUM("donationAmount") AS amount
        FROM donations
        WHERE "deletedAt" IS NULL
          AND "donationDate" >= ${fyStart}
          AND "donationDate" <= ${fyEnd}
          AND "donationHomeType" IS NOT NULL
        GROUP BY "donationHomeType"
      `,
    ]);

    // ─── Build cumulative monthly growth from per-month new counts ───────────────
    //
    // The original code counted "createdAt <= monthEnd" (cumulative).
    // We compute this by sorting all per-month new counts and accumulating.

    const buildCumulative = (
      rows: { month: Date; count: bigint }[],
    ): Map<string, number> => {
      // Sort ascending
      const sorted = [...rows].sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime(),
      );
      let running = 0;
      const cumMap = new Map<string, number>();
      // We need a running total up to each month in our window.
      // First, sum up everything before our window start.
      for (const r of sorted) {
        const m = new Date(r.month);
        if (m < windowStart) {
          running += Number(r.count);
        }
      }
      // Now walk through each target month
      for (const { key, monthEnd } of monthRanges) {
        // Add any months <= monthEnd and >= windowStart that we haven't added yet
        for (const r of sorted) {
          const m = new Date(r.month);
          if (m >= windowStart && m <= monthEnd) {
            // Only add if this month hasn't been counted yet in our window walk
            if (!cumMap.has(new Date(r.month).toISOString().slice(0, 7))) {
              running += Number(r.count);
              cumMap.set(new Date(r.month).toISOString().slice(0, 7), running);
            }
          }
        }
        // If no entry for this month (no new records that month), use running total
        if (!cumMap.has(key)) {
          cumMap.set(key, running);
        }
      }
      return cumMap;
    };

    const beneficiaryCumulative = buildCumulative(beneficiaryNewByMonth);
    const donorCumulative = buildCumulative(donorNewByMonth);

    // Sponsorship cumulative
    const sponsorshipCumulative = buildCumulative(sponsorshipNewByMonth);

    // Donations per month (not cumulative — just totals per month)
    const donationByMonthKey = new Map(
      donationByMonth.map((r) => [
        new Date(r.month).toISOString().slice(0, 7),
        Number(r.amount ?? 0),
      ]),
    );

    const monthlyGrowth = monthRanges.map(({ label, key }) => ({
      month: label,
      beneficiaries: beneficiaryCumulative.get(key) ?? 0,
      donors: donorCumulative.get(key) ?? 0,
      sponsorships: sponsorshipCumulative.get(key) ?? 0,
      donations: donationByMonthKey.get(key) ?? 0,
    }));

    // ─── Build homeMetrics from pre-fetched grouped data ─────────────────────────
    const homeTypeToDonationHomeType: Record<string, string> = {
      ORPHAN_GIRLS: "GIRLS_HOME",
      BLIND_BOYS: "BLIND_BOYS_HOME",
      OLD_AGE: "OLD_AGE_HOME",
    };

    const sponsorshipCountByHome = new Map(
      sponsorshipsByHome.map((r) => [r.homeType, Number(r.count)]),
    );

    const donationAmountByHomeType = new Map(
      donationsByHomeType.map((r) => [r.homeType, Number(r.amount ?? 0)]),
    );

    const homeMetrics = (beneficiariesByHome as any[]).map((h: any) => {
      const donationHomeType = homeTypeToDonationHomeType[h.homeType] || null;
      return {
        homeType: h.homeType,
        homeLabel: formatHomeType(h.homeType),
        beneficiaryCount: h._count.id,
        activeSponsorships: sponsorshipCountByHome.get(h.homeType) ?? 0,
        donationsReceived: donationHomeType
          ? donationAmountByHomeType.get(donationHomeType) ?? 0
          : 0,
      };
    });

    const result = {
      summary: {
        totalBeneficiaries,
        totalDonors,
        activeSponsors: (activeSponsors as any[]).length,
        activeSponsorships,
        totalDonationsFY: (totalDonationsFY as any)._sum.donationAmount?.toNumber() || 0,
        totalCampaigns,
      },
      growth: {
        newBeneficiariesThisMonth,
        newDonorsThisMonth,
        beneficiaryGrowthPct:
          newBeneficiariesLastMonth > 0
            ? ((newBeneficiariesThisMonth - newBeneficiariesLastMonth) /
                newBeneficiariesLastMonth) *
              100
            : newBeneficiariesThisMonth > 0
              ? 100
              : 0,
        donorGrowthPct:
          newDonorsLastMonth > 0
            ? ((newDonorsThisMonth - newDonorsLastMonth) / newDonorsLastMonth) * 100
            : newDonorsThisMonth > 0
              ? 100
              : 0,
      },
      monthlyGrowth,
      homeMetrics,
    };

    this.setCached("impact_dashboard", result);
    this.logger.log(`getImpactDashboard() completed in ${Date.now() - start}ms`);
    return result;
    } catch (err) {
      this.logger.error(`getImpactDashboard() FAILED after ${Date.now() - start}ms`, err instanceof Error ? err.stack : String(err));
      throw err;
    }
  }
}
