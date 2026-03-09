import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../prisma/prisma.service"

@Injectable()
export class AnalyticsChartsService {

  constructor(private prisma: PrismaService) {}

  async getMonthlyDonationSeries() {

    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR("donationDate", 'Mon YY') AS month,
        SUM("donationAmount") AS amount,
        COUNT(*) AS count
      FROM "Donation"
      WHERE "deletedAt" IS NULL
      AND "donationDate" >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY MIN("donationDate")
    `

    return result.map((r) => ({
      month: r.month,
      amount: Number(r.amount),
      count: Number(r.count),
    }))
  }

}
