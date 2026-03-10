import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  getMonthRange,
  getTrailing12MonthsRange,
} from "../utils/analytics-date.utils";

@Injectable()
export class AnalyticsSummaryService {
  constructor(private prisma: PrismaService) {}

  private cache = new Map<string, { data: any; expires: number }>();

  async getSummary() {
    const cacheKey = "analytics_summary";
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const { start: monthStart, end: monthEnd } = getMonthRange();
    const { start: t12Start, end: t12End } = getTrailing12MonthsRange();

    const [
      totalDonors,
      donationsThisMonth,
      donationsT12,
      donationCountThisMonth,
    ] = await Promise.all([
      this.prisma.donor.count({
        where: { deletedAt: null },
      }),
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: {
            gte: t12Start,
            lte: t12End,
          },
        },
      }),
      this.prisma.donation.count({
        where: {
          deletedAt: null,
          donationDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
    ]);

    const result = {
      totalDonors,
      donationsThisMonth:
        Number(donationsThisMonth._sum.donationAmount) || 0,
      donationsT12:
        Number(donationsT12._sum.donationAmount) || 0,
      donationCountThisMonth,
    };

    this.cache.set(cacheKey, {
      data: result,
      expires: Date.now() + 5 * 60 * 1000,
    });

    return result;
  }
}
