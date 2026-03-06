import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { getCurrentFY, formatHomeType, formatMode } from "./dashboard.helpers";

@Injectable()
export class DashboardInsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAIInsights() {
    const { fyStart, fyEnd } = getCurrentFY();
    const now = new Date();

    const insights: {
      type: string;
      title: string;
      description: string;
    }[] = [];

    // We'll move logic here in the next step

    return insights;
  }

  async getDonorInsights(donorId: string) {
    // logic will be pasted in next step
    return {};
  }

  async getAdminInsights() {
    // logic will be pasted in next step
    return [];
  }

  async getInsightCards() {
    // logic will be pasted in next step
    return [];
  }
}
