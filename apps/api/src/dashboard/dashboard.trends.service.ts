import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardTrendsService {
  private readonly logger = new Logger(DashboardTrendsService.name);

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

  async getMonthlyTrends() {
    const cached = this.getCached<any[]>("monthly_trends");
    if (cached) {
      this.logger.debug("getMonthlyTrends() served from cache");
      return cached;
    }

    const start = Date.now();
    try {
    const now = new Date();

    // Build the 12-month label/range array (for ordering & labels)
    const monthRanges = Array.from({ length: 12 }, (_, idx) => {
      const i = 11 - idx;
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        label: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        key: date.toISOString().slice(0, 7), // "YYYY-MM"
        start: new Date(date.getFullYear(), date.getMonth(), 1),
      };
    });

    const windowStart = monthRanges[0].start;

    // KEY OPTIMIZATION: was 12 separate aggregate queries (one per month).
    // Now 1 raw SQL GROUP BY query covers all 12 months in a single round-trip.
    const rawRows = await this.prisma.$queryRaw<{
      month: Date;
      amount: string | null;
      count: bigint;
    }[]>`
      SELECT
        DATE_TRUNC('month', "donationDate") AS month,
        SUM("donationAmount")               AS amount,
        COUNT(*)                            AS count
      FROM donations
      WHERE "deletedAt" IS NULL
        AND "donationDate" >= ${windowStart}
      GROUP BY DATE_TRUNC('month', "donationDate")
      ORDER BY month ASC
    `;

    // Build lookup: "YYYY-MM" → { amount, count }
    const dataByKey = new Map(
      rawRows.map((r) => [
        new Date(r.month).toISOString().slice(0, 7),
        { amount: r.amount ? Number(r.amount) : 0, count: Number(r.count) },
      ]),
    );

    // Fill all 12 months (include months with zero donations)
    const months = monthRanges.map(({ label, key }) => {
      const d = dataByKey.get(key) ?? { amount: 0, count: 0 };
      return { month: label, amount: d.amount, count: d.count };
    });

    this.setCached("monthly_trends", months);
    this.logger.log(`getMonthlyTrends() completed in ${Date.now() - start}ms`);
    return months;
    } catch (err) {
      this.logger.error(`getMonthlyTrends() FAILED after ${Date.now() - start}ms`, err instanceof Error ? err.stack : String(err));
      throw err;
    }
  }
}
