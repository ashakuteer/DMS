import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiaryReportsService {

  constructor(private prisma: PrismaService) {}

  async getReportCampaigns() {
    return this.prisma.reportCampaign.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createReportCampaign(user: any, dto: any) {
    return this.prisma.reportCampaign.create({
      data: {
        ...dto,
        createdById: user.id,
      },
    });
  }

  async exportToExcel(user: any) {
    return this.prisma.beneficiary.findMany({
      where: { isDeleted: false },
    });
  }

  async queueReportCampaignEmails(user: any, campaignId: string) {
    return { status: "queued", campaignId };
  }
}
