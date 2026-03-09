import { Injectable } from "@nestjs/common"
import { AnalyticsSummaryService } from "./analytics-summary.service"
import { AnalyticsChartsService } from "./analytics-charts.service"

@Injectable()
export class AnalyticsDashboardService {
  constructor(
    private summary: AnalyticsSummaryService,
    private charts: AnalyticsChartsService
  ) {}

  async getManagementDashboard() {
    const [summary, charts] = await Promise.all([
      this.summary.getSummary(),
      this.charts.getMonthlyDonationSeries(),
    ])

    return {
      summary,
      charts,
    }
  }
}
