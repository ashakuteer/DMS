import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../prisma/prisma.service"
import {
  getCurrentFY,
  getMonthRange,
  getTrailing12MonthsRange,
} from "../utils/analytics-date.utils"

@Injectable()
export class AnalyticsSummaryService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const { start: monthStart, end: monthEnd } = getMonthRange()
    const { start: t12Start, end: t12End } = getTrailing12MonthsRange()

    const [
      totalDonors,
      donationsThisMonth,
      donationsT12,
      donationCountThisMonth,
    ] = await Promise.all([
      this.prisma.donor.count({ where: { deletedAt: null } }),

      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: { gte: monthStart, lte: monthEnd },
        },
      }),

      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: { gte: t12Start, lte: t12End },
        },
      }),

      this.prisma.donation.count({
        where: {
          deletedAt: null,
          donationDate: { gte: monthStart, lte: monthEnd },
        },
      }),
    ])

    return {
      totalDonors,
      donationsThisMonth:
        donationsThisMonth._sum.donationAmount?.toNumber() || 0,
      donationsT12: donationsT12._sum.donationAmount?.toNumber() || 0,
      donationCountThisMonth,
    }
  }
}
