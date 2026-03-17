import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardRetentionService {
  private readonly logger = new Logger(DashboardRetentionService.name);

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

  async getRetentionAnalytics() {
    const cached = this.getCached<any>("retention_analytics");
    if (cached) {
      this.logger.debug("getRetentionAnalytics() served from cache");
      return cached;
    }

    const start = Date.now();
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);

    // Step 1: Get per-donor donation stats from DB (aggregated, not raw rows)
    const [totalDonorCount, donorDonationStats, activeLast6Count, activeLast12Count] =
      await Promise.all([
        this.prisma.donor.count({ where: { deletedAt: null } }),
        this.prisma.donation.groupBy({
          by: ["donorId"],
          where: { deletedAt: null },
          _count: { id: true },
          _sum: { donationAmount: true },
          _min: { donationDate: true },
          _max: { donationDate: true },
        }),
        this.prisma.donation.groupBy({
          by: ["donorId"],
          where: { deletedAt: null, donationDate: { gte: sixMonthsAgo } },
          _count: { id: true },
        }),
        this.prisma.donation.groupBy({
          by: ["donorId"],
          where: { deletedAt: null, donationDate: { gte: twelveMonthsAgo } },
          _count: { id: true },
        }),
      ]);

    const donorsWhoEverDonated = donorDonationStats.length;
    const activeLast6Months = activeLast6Count.length;
    const activeLast12Months = activeLast12Count.length;
    const neverDonatedCount = totalDonorCount - donorsWhoEverDonated;

    const donorIdsWithMultiple = donorDonationStats
      .filter((d) => d._count.id >= 2)
      .map((d) => d.donorId);

    const donorIdsOneTime = donorDonationStats
      .filter((d) => d._count.id === 1)
      .map((d) => d.donorId);

    const sixMonthsAgoMs = sixMonthsAgo.getTime();

    const lapsedDonorIds = donorDonationStats
      .filter((d) => {
        const lastDate = d._max.donationDate ? new Date(d._max.donationDate).getTime() : 0;
        return now.getTime() - lastDate > 180 * 24 * 60 * 60 * 1000;
      })
      .map((d) => d.donorId);

    // Step 2: Fetch donor info only for those we need in the lists (limited)
    const [repeatDonorDetails, lapsedDonorDetails] = await Promise.all([
      donorIdsWithMultiple.length > 0
        ? this.prisma.donor.findMany({
            where: { id: { in: donorIdsWithMultiple.slice(0, 100) }, deletedAt: null },
            select: { id: true, firstName: true, lastName: true, donorCode: true },
          })
        : Promise.resolve([]),
      lapsedDonorIds.length > 0
        ? this.prisma.donor.findMany({
            where: { id: { in: lapsedDonorIds.slice(0, 100) }, deletedAt: null },
            select: { id: true, firstName: true, lastName: true, donorCode: true },
          })
        : Promise.resolve([]),
    ]);

    // Build stat lookup map
    const statsByDonorId = new Map(donorDonationStats.map((s) => [s.donorId, s]));

    const repeatDonors = repeatDonorDetails
      .map((donor) => {
        const stats = statsByDonorId.get(donor.id)!;
        const totalAmount = stats._sum.donationAmount ? Number(stats._sum.donationAmount) : 0;
        const firstDate = stats._min.donationDate!;
        const lastDate = stats._max.donationDate!;
        const spanMs = new Date(lastDate).getTime() - new Date(firstDate).getTime();
        const avgFrequencyDays =
          stats._count.id > 1
            ? Math.round(spanMs / (stats._count.id - 1) / (1000 * 60 * 60 * 24))
            : 0;
        return {
          id: donor.id,
          donorCode: donor.donorCode,
          name: [donor.firstName, donor.lastName].filter(Boolean).join(" "),
          totalDonations: stats._count.id,
          totalAmount,
          firstDonation: new Date(firstDate).toISOString(),
          lastDonation: new Date(lastDate).toISOString(),
          avgFrequencyDays,
        };
      })
      .sort((a, b) => b.totalDonations - a.totalDonations)
      .slice(0, 50);

    const lapsedDonors = lapsedDonorDetails
      .map((donor) => {
        const stats = statsByDonorId.get(donor.id)!;
        const totalAmount = stats._sum.donationAmount ? Number(stats._sum.donationAmount) : 0;
        const lastDate = stats._max.donationDate!;
        const daysSinceLastDonation = Math.floor(
          (now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          id: donor.id,
          donorCode: donor.donorCode,
          name: [donor.firstName, donor.lastName].filter(Boolean).join(" "),
          totalDonations: stats._count.id,
          totalAmount,
          lastDonation: new Date(lastDate).toISOString(),
          daysSinceLastDonation,
        };
      })
      .sort((a, b) => b.daysSinceLastDonation - a.daysSinceLastDonation)
      .slice(0, 50);

    // Step 3: Build retentionOverTime using parallel DB queries (no in-memory loops over all donors)
    const monthRanges = Array.from({ length: 12 }, (_, idx) => {
      const i = 11 - idx;
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      return {
        label: monthStart.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        monthStart,
        monthEnd,
      };
    });

    const retentionRows = await Promise.all(
      monthRanges.map(async ({ label, monthStart, monthEnd }) => {
        // Active donors: donated in this month
        const [activeDonorsInMonth, newDonorsInMonth, totalRegistered] = await Promise.all([
          this.prisma.donation.groupBy({
            by: ["donorId"],
            where: { deletedAt: null, donationDate: { gte: monthStart, lte: monthEnd } },
            _count: { id: true },
          }),
          // New: first donation ever was in this month (no prior donations)
          this.prisma.donation.groupBy({
            by: ["donorId"],
            where: {
              deletedAt: null,
              donorId: {
                notIn: await this.prisma.donation
                  .findMany({
                    where: { deletedAt: null, donationDate: { lt: monthStart } },
                    select: { donorId: true },
                    distinct: ["donorId"],
                  })
                  .then((rows) => rows.map((r) => r.donorId)),
              },
              donationDate: { gte: monthStart, lte: monthEnd },
            },
            _count: { id: true },
          }),
          // Total donors registered by end of this month who ever donated
          this.prisma.donation.groupBy({
            by: ["donorId"],
            where: { deletedAt: null },
            _min: { donationDate: true },
            having: { donationDate: { _min: { lte: monthEnd } } },
          }),
        ]);

        const activeDonorCount = activeDonorsInMonth.length;
        const newDonorCount = newDonorsInMonth.length;
        const returningDonorCount = activeDonorCount - newDonorCount;
        const totalDonors = totalRegistered.length;
        const retentionPct =
          totalDonors > 0
            ? Math.round((activeDonorCount / totalDonors) * 1000) / 10
            : 0;

        return {
          month: label,
          totalDonors,
          activeDonors: activeDonorCount,
          retentionPct,
          newDonors: newDonorCount,
          returningDonors: Math.max(0, returningDonorCount),
        };
      }),
    );

    const result = {
      summary: {
        totalDonors: totalDonorCount,
        donorsWhoEverDonated,
        repeatDonorCount: donorIdsWithMultiple.length,
        oneTimeDonorCount: donorIdsOneTime.length,
        neverDonatedCount,
        lapsedDonorCount: lapsedDonorIds.length,
        activeLast6Months,
        activeLast12Months,
        overallRetentionPct:
          donorsWhoEverDonated > 0
            ? Math.round((donorIdsWithMultiple.length / donorsWhoEverDonated) * 1000) / 10
            : 0,
      },
      retentionOverTime: retentionRows,
      repeatDonors,
      lapsedDonors,
    };

    this.setCached("retention_analytics", result);
    this.logger.log(`getRetentionAnalytics() completed in ${Date.now() - start}ms`);
    return result;
  }
}
