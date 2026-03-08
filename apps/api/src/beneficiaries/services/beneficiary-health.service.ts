import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiaryHealthService {

  constructor(private prisma: PrismaService) {}

  async getMetrics(beneficiaryId: string) {
    return this.prisma.healthMetric.findMany({
      where: { beneficiaryId },
      orderBy: { recordedAt: "desc" },
    });
  }

  async addMetric(user: any, beneficiaryId: string, dto: any) {
    return this.prisma.healthMetric.create({
      data: {
        ...dto,
        beneficiaryId,
        createdById: user.id,
      },
    });
  }

  async addHealthEvent(user: any, beneficiaryId: string, dto: any) {
    return this.prisma.healthEvent.create({
      data: {
        ...dto,
        beneficiaryId,
        createdById: user.id,
      },
    });
  }

  async sendHealthEventToSponsors(user: any, eventId: string) {
    return { status: "queued", eventId };
  }

  async getHealthTimeline(beneficiaryId: string) {
    return this.prisma.healthEvent.findMany({
      where: { beneficiaryId },
      orderBy: { createdAt: "desc" },
    });
  }

  async exportHealthHistoryPdf(beneficiaryId: string) {
    return this.getHealthTimeline(beneficiaryId);
  }

}
