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
      select: {
        id: true,
        code: true,
        fullName: true,
        homeType: true,
        category: true,
        gender: true,
        dobDay: true,
        dobMonth: true,
        dobYear: true,
        approxAge: true,
        joinDate: true,
        heightCmAtJoin: true,
        weightKgAtJoin: true,
        educationClassOrRole: true,
        schoolOrCollege: true,
        healthNotes: true,
        currentHealthStatus: true,
        background: true,
        hobbies: true,
        dreamCareer: true,
        favouriteSubject: true,
        favouriteGame: true,
        favouriteActivityAtHome: true,
        bestFriend: true,
        sourceOfPrideOrHappiness: true,
        funFact: true,
        additionalNotes: true,
        protectPrivacy: true,
        photoUrl: true,
        photoPath: true,
        status: true,
        createdById: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async queueReportCampaignEmails(user: any, campaignId: string) {
    return { status: "queued", campaignId };
  }
}
