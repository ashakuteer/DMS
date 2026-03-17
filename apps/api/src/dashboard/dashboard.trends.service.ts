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
    const now = new Date();

    const monthRanges = Array.from({ length: 12 }, (_, idx) => {
      const i = 11 - idx;
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        label: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
      };
    });

    const results = await Promise.all(
      monthRanges.map(({ start: s, end: e }) =>
        this.prisma.donation.aggregate({
          _sum: { donationAmount: true },
          _count: { id: true },
          where: { deletedAt: null, donationDate: { gte: s, lte: e } },
        }),
      ),
    );

    const months = monthRanges.map(({ label }, i) => ({
      month: label,
      amount: results[i]._sum.donationAmount?.toNumber() || 0,
      count: results[i]._count.id || 0,
    }));

    this.setCached("monthly_trends", months);
    this.logger.log(`getMonthlyTrends() completed in ${Date.now() - start}ms`);
    return months;
  }
}
