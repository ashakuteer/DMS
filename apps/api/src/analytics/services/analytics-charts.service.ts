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
  `;

  return result.map((r) => ({
    month: r.month,
    amount: Number(r.amount),
    count: Number(r.count),
  }));
}
  {
    const now = new Date()

    const months = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)

      const start = new Date(date.getFullYear(), date.getMonth(), 1)
      const end = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59
      )

      const result = await this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        _count: { id: true },
        where: {
          deletedAt: null,
          donationDate: { gte: start, lte: end },
        },
      })

      months.push({
        month: date.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        amount: result._sum.donationAmount?.toNumber() || 0,
        count: result._count.id || 0,
      })
    }

    return months
  }
}
