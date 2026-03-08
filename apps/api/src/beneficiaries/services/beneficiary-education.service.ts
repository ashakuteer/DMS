import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiaryEducationService {

  constructor(private prisma: PrismaService) {}

  async getProgressCards(beneficiaryId: string) {
    return this.prisma.progressCard.findMany({
      where: { beneficiaryId },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ academicYear: "desc" }],
    });
  }

  async addProgressCard(user: any, beneficiaryId: string, dto: any) {
    return this.prisma.progressCard.create({
      data: {
        ...dto,
        beneficiaryId,
        createdById: user.id,
      },
    });
  }

  async getEducationTimeline(beneficiaryId: string) {
    return this.prisma.progressCard.findMany({
      where: { beneficiaryId },
      orderBy: { academicYear: "desc" },
    });
  }

  async exportEducationSummaryPdf(beneficiaryId: string) {
    return this.getProgressCards(beneficiaryId);
  }
}
