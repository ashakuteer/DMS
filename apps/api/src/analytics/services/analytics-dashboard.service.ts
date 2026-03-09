import { Injectable } from "@nestjs/common"

import { AnalyticsSummaryService } from "./analytics-summary.service"
import { AnalyticsChartsService } from "./analytics-charts.service"
import { AnalyticsSegmentsService } from "./analytics-segments.service"
import { AnalyticsRiskService } from "./analytics-risk.service"

@Injectable()
export class AnalyticsDashboardService {

  constructor(
    private summaryService: AnalyticsSummaryService,
    private chartsService: AnalyticsChartsService,
    private segmentsService: AnalyticsSegmentsService,
    private riskService: AnalyticsRiskService,
  ) {}

  async getManagementDashboard() {

    const [
      summary,
      monthlyDonations,
      topDonors,
      atRiskDonors,
    ] = await Promise.all([

      this.summaryService.getSummary(),

      this.chartsService.getMonthlyDonationSeries(),

      this.segmentsService.getTopDonorsSegment(),

      this.riskService.computeAtRiskDonors(),

    ])

    return {

      summary,

      charts: {
        monthlyDonations,
      },

      segments: {
        topDonors,
      },

      risks: {
        atRiskDonors,
      },

    }
  }
}
