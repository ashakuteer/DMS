import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../prisma/prisma.service"

@Injectable()
export class AnalyticsRiskService {
  constructor(private prisma: PrismaService) {}

  async computeAtRiskDonors() {
    const donors = await this.prisma.donor.findMany({
      where: { deletedAt: null },
      include: {
        donations: {
          orderBy: { donationDate: "desc" },
          take: 1,
        },
      },
    })

    const now = new Date()

    return donors
      .filter((d) => {
        if (!d.donations.length) return false

        const last = new Date(d.donations[0].donationDate)

        const diff =
          (now.getTime() - last.getTime()) /
          (1000 * 60 * 60 * 24)

        return diff > 90
      })
      .map((d) => ({
        donorId: d.id,
        donorName: `${d.firstName} ${d.lastName || ""}`,
        donorCode: d.donorCode,
      }))
  }
}
