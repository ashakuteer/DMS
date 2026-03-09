import { Injectable } from "@nestjs/common"

import { AnalyticsSummaryService } from "./services/analytics-summary.service"
import { AnalyticsChartsService } from "./services/analytics-charts.service"
import { AnalyticsSegmentsService } from "./services/analytics-segments.service"
import { AnalyticsRiskService } from "./services/analytics-risk.service"
import { AnalyticsExportService } from "./services/analytics-export.service"
import { AnalyticsDashboardService } from "./services/analytics-dashboard.service"

@Injectable()
export class AnalyticsService {
  constructor(
    private summary: AnalyticsSummaryService,
    private charts: AnalyticsChartsService,
    private segments: AnalyticsSegmentsService,
    private risk: AnalyticsRiskService,
    private exports: AnalyticsExportService,
    private dashboard: AnalyticsDashboardService
  ) {}

  getSummary() {
    return this.summary.getSummary()
  }

  getCharts() {
    return this.charts.getMonthlyDonationSeries()
  }

  getTopDonors() {
    return this.segments.getTopDonorsSegment()
  }

  getAtRiskDonors() {
    return this.risk.computeAtRiskDonors()
  }

  exportSummaryPdf(data: any) {
    return this.exports.exportSummaryPdf(data)
  }

  getDashboard() {
    return this.dashboard.getManagementDashboard()
  }
}
