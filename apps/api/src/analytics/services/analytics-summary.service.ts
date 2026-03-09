import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../prisma/prisma.service"
import {
  getMonthRange,
  getTrailing12MonthsRange,
} from "../utils/analytics-date.utils"

@Injectable()
export class AnalyticsSummaryService {

  constructor(private prisma: PrismaService) {}

  // simple memory cache
  private cache = new Map<string, any>()

  async getSummary() {

    const cacheKey = "analytics_summary"

    // return cached result if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const { start: monthStart, end: monthEnd } = getMonthRange()
    const { start: t12Start, end: t12End } = getTrailing12MonthsRange()

    // run queries in parallel
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

    ])

    const result = {
      totalDonors,

      donationsThisMonth:
        donationsThisMonth._sum.donationAmount
          ? Number(donationsThisMonth._sum.donationAmount)
          : 0,

      donationsT12:
        donationsT12._sum.donationAmount
          ? Number(donationsT12._sum.donationAmount)
          : 0,

      donationCountThisMonth,
    }

    // store in cache
    this.cache.set(cacheKey, result)

    // auto clear cache after 5 minutes
    setTimeout(() => {
      this.cache.delete(cacheKey)
    }, 300000)

    return result
  }
}
