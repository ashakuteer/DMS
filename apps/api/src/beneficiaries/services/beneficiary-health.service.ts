import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiaryHealthService {

  constructor(private prisma: PrismaService) {}

  async getMetrics(beneficiaryId: string) {
    return [];
  }

  async addMetric(user: any, beneficiaryId: string, dto: any) {
    return { status: "ok" };
  }

  async addHealthEvent(user: any, beneficiaryId: string, dto: any) {
    return { status: "created" };
  }

  async sendHealthEventToSponsors(user: any, eventId: string) {
    return { status: "queued" };
  }

  async getHealthEvents(beneficiaryId: string) {
    return [];
  }

  async getHealthTimeline(beneficiaryId: string) {
    return [];
  }

  async exportHealthHistoryPdf(beneficiaryId: string) {
    return [];
  }

}
