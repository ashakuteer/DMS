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
      orderBy: {
        _sum: { donationAmount: "desc" },
      },
      take: 20,
    })

    const donorIds = top.map((d) => d.donorId)

    const donors = await this.prisma.donor.findMany({
      where: {
        id: { in: donorIds },
      },
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        lastName: true,
      },
    })

    const donorMap = new Map(donors.map((d) => [d.id, d]))

    return top.map((t) => {

      const donor = donorMap.get(t.donorId)

      return {
        donorId: t.donorId,
        donorCode: donor?.donorCode || "",
        donorName: donor
          ? `${donor.firstName} ${donor.lastName || ""}`.trim()
          : "Unknown",
        totalAmount: Number(t._sum.donationAmount || 0),
        donationCount: t._count.id || 0,
      }
    })
  }
}
