import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../prisma/prisma.service"
import { getCurrentFY } from "../utils/analytics-date.utils"

@Injectable()
export class AnalyticsSegmentsService {
  constructor(private prisma: PrismaService) {}

  async getTopDonorsSegment() {
    const { fyStart, fyEnd } = getCurrentFY()

    const top = await this.prisma.donation.groupBy({
      by: ["donorId"],
      _sum: { donationAmount: true },
      _count: { id: true },
      where: {
        deletedAt: null,
        donationDate: { gte: fyStart, lte: fyEnd },
      },
      orderBy: { _sum: { donationAmount: "desc" } },
      take: 20,
    })

    return top
  }
}
