import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardTrendsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyTrends() {
    const months: { month: string; amount: number; count: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      const result = await this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        _count: { id: true },
        where: {
          deletedAt: null,
          donationDate: { gte: start, lte: end },
        },
      });

      const monthName = date.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });

      months.push({
        month: monthName,
        amount: result._sum.donationAmount?.toNumber() || 0,
        count: result._count.id || 0,
      });
    }

    return months;
  }
}
