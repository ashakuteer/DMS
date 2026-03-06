import { Injectable } from "@nestjs/common";
import { DashboardStatsService } from "./dashboard.stats.service";
import { DashboardTrendsService } from "./dashboard.trends.service";
import { DashboardInsightsService } from "./dashboard.insights.service";
import { DashboardActionsService } from "./dashboard.actions.service";
import { DashboardImpactService } from "./dashboard.impact.service";
import { DashboardRetentionService } from "./dashboard.retention.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly statsService: DashboardStatsService,
    private readonly trendsService: DashboardTrendsService,
    private readonly insightsService: DashboardInsightsService,
    private readonly actionsService: DashboardActionsService,
    private readonly impactService: DashboardImpactService,
    private readonly retentionService: DashboardRetentionService,
  ) {}

  getStats() {
    return this.statsService.getStats();
  }

  getMonthlyTrends() {
    return this.trendsService.getMonthlyTrends();
  }

  getDonationModeSplit() {
    return this.statsService.getDonationModeSplit();
  }

  getTopDonors(limit = 5) {
    return this.statsService.getTopDonors(limit);
  }

  getRecentDonations(limit = 10) {
    return this.statsService.getRecentDonations(limit);
  }

  getAIInsights() {
    return this.insightsService.getAIInsights();
  }

  getDonorInsights(donorId: string) {
    return this.insightsService.getDonorInsights(donorId);
  }

  getAdminInsights() {
    return this.insightsService.getAdminInsights();
  }

  getInsightCards() {
    return this.insightsService.getInsightCards();
  }

  getStaffActions() {
    return this.actionsService.getStaffActions();
  }

  getDailyActions() {
    return this.actionsService.getDailyActions();
  }

  markActionDone(
    user: any,
    params: { donorId: string; actionType: string; description: string },
  ) {
    return this.actionsService.markActionDone(user, params);
  }

  snoozeAction(
    user: any,
    params: { donorId: string; actionType: string; description: string; days: number },
  ) {
    return this.actionsService.snoozeAction(user, params);
  }

  getImpactDashboard() {
    return this.impactService.getImpactDashboard();
  }

  getRetentionAnalytics() {
    return this.retentionService.getRetentionAnalytics();
  }
}
