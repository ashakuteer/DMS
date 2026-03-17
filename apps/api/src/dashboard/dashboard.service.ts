import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DashboardStatsService } from "./dashboard.stats.service";
import { DashboardTrendsService } from "./dashboard.trends.service";
import { DashboardInsightsService } from "./dashboard.insights.service";
import { DashboardActionsService } from "./dashboard.actions.service";
import { DashboardImpactService } from "./dashboard.impact.service";
import { DashboardRetentionService } from "./dashboard.retention.service";

/** Runs fn(); returns null instead of throwing if it rejects. */
async function safeRun<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly statsService: DashboardStatsService,
    private readonly trendsService: DashboardTrendsService,
    private readonly insightsService: DashboardInsightsService,
    private readonly actionsService: DashboardActionsService,
    private readonly impactService: DashboardImpactService,
    private readonly retentionService: DashboardRetentionService,
  ) {}

  // ─── Unified summary ────────────────────────────────────────────────────────

  async getSummary(user: { id: string; role: string }) {
    const t0 = Date.now();
    const role = user.role;

    const canSeeCore = ["ADMIN", "STAFF", "ACCOUNTANT"].includes(role);
    const canSeeTarget = ["ADMIN", "STAFF", "ACCOUNTANT", "MANAGER"].includes(role);
    const canSeeInsights = ["ADMIN", "STAFF", "TELECALLER", "ACCOUNTANT"].includes(role);
    const canSeeCards = ["ADMIN", "STAFF", "MANAGER"].includes(role);
    const canSeeImpact = ["ADMIN", "STAFF", "MANAGER"].includes(role);
    const canSeeRetention = ["ADMIN", "STAFF", "MANAGER"].includes(role);
    const canSeeActions = ["ADMIN", "STAFF", "TELECALLER"].includes(role);
    const canSeeReminders = ["ADMIN", "STAFF"].includes(role);
    const isAdmin = role === "ADMIN";

    const [
      stats,
      monthlyTarget,
      trends,
      modeSplit,
      topDonors,
      recentDonations,
      insights,
      insightCards,
      impact,
      retention,
      staffActions,
      adminInsights,
      reminders,
    ] = await Promise.all([
      canSeeCore ? safeRun(() => this.statsService.getStats()) : null,
      canSeeTarget ? safeRun(() => this.statsService.getMonthlyDonorTarget()) : null,
      canSeeCore ? safeRun(() => this.trendsService.getMonthlyTrends()) : null,
      canSeeCore ? safeRun(() => this.statsService.getDonationModeSplit()) : null,
      canSeeCore ? safeRun(() => this.statsService.getTopDonors(5)) : null,
      canSeeCore ? safeRun(() => this.statsService.getRecentDonations(10)) : null,
      canSeeInsights ? safeRun(() => this.insightsService.getAIInsights()) : null,
      canSeeCards ? safeRun(() => this.insightsService.getInsightCards()) : null,
      canSeeImpact ? safeRun(() => this.impactService.getImpactDashboard()) : null,
      canSeeRetention ? safeRun(() => this.retentionService.getRetentionAnalytics()) : null,
      canSeeActions ? safeRun(() => this.actionsService.getStaffActions()) : null,
      isAdmin ? safeRun(() => this.insightsService.getAdminInsights()) : null,
      canSeeReminders ? safeRun(() => this.getDueReminders()) : null,
    ]);

    this.logger.log(`getSummary() [role=${role}] completed in ${Date.now() - t0}ms`);

    return {
      stats,
      monthlyTarget,
      trends,
      modeSplit,
      topDonors,
      recentDonations,
      insights,
      insightCards,
      impact,
      retention,
      staffActions,
      adminInsights,
      reminders,
    };
  }

  // ─── Inline reminders query (avoids cross-module import) ─────────────────────

  private async getDueReminders() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return this.prisma.reminder.findMany({
      where: { status: "PENDING", dueDate: { lte: today } },
      select: {
        id: true,
        donorId: true,
        donationId: true,
        type: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        createdById: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
          },
        },
        donation: {
          select: {
            id: true,
            donationAmount: true,
            receiptNumber: true,
            donationDate: true,
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
    });
  }

  // ─── Individual service delegates (keep existing endpoints working) ───────────

  getStats() { return this.statsService.getStats(); }
  getMonthlyTrends() { return this.trendsService.getMonthlyTrends(); }
  getMonthlyDonorTarget() { return this.statsService.getMonthlyDonorTarget(); }
  getDonationModeSplit() { return this.statsService.getDonationModeSplit(); }
  getTopDonors(limit = 5) { return this.statsService.getTopDonors(limit); }
  getRecentDonations(limit = 10) { return this.statsService.getRecentDonations(limit); }
  getAIInsights() { return this.insightsService.getAIInsights(); }
  getDonorInsights(donorId: string) { return this.insightsService.getDonorInsights(donorId); }
  getAdminInsights() { return this.insightsService.getAdminInsights(); }
  getInsightCards() { return this.insightsService.getInsightCards(); }
  getStaffActions() { return this.actionsService.getStaffActions(); }
  getDailyActions() { return this.actionsService.getDailyActions(); }
  markActionDone(user: any, params: { donorId: string; actionType: string; description: string }) {
    return this.actionsService.markActionDone(user, params);
  }
  snoozeAction(user: any, params: { donorId: string; actionType: string; description: string; days: number }) {
    return this.actionsService.snoozeAction(user, params);
  }
  getImpactDashboard() { return this.impactService.getImpactDashboard(); }
  getRetentionAnalytics() { return this.retentionService.getRetentionAnalytics(); }
}
