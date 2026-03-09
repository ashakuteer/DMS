import { Injectable } from "@nestjs/common";

import { AnalyticsSummaryService } from "./services/analytics-summary.service";
import { AnalyticsChartsService } from "./services/analytics-charts.service";
import { AnalyticsSegmentsService } from "./services/analytics-segments.service";
import { AnalyticsRiskService } from "./services/analytics-risk.service";
import { AnalyticsExportService } from "./services/analytics-export.service";
import { AnalyticsDashboardService } from "./services/analytics-dashboard.service";

@Injectable()
export class AnalyticsService {
  constructor(
    private summaryService: AnalyticsSummaryService,
    private chartsService: AnalyticsChartsService,
    private segmentsService: AnalyticsSegmentsService,
    private riskService: AnalyticsRiskService,
    private exportService: AnalyticsExportService,
    private dashboardService: AnalyticsDashboardService,
  ) {}

  // -----------------------------
  // SUMMARY
  // -----------------------------
  getSummary() {
    return this.summaryService.getSummary();
  }

  // -----------------------------
  // CHARTS
  // -----------------------------
  getCharts() {
    return this.chartsService.getMonthlyDonationSeries();
  }

  // -----------------------------
  // SEGMENTS
  // -----------------------------
  async getSegment(segment: string) {
    switch (segment) {
      case "top":
        return this.segmentsService.getTopDonorsSegment();

      case "risk":
        return this.riskService.computeAtRiskDonors();

      default:
        return [];
    }
  }

  // -----------------------------
  // EXPORTS
  // -----------------------------
  exportSummaryPdf(data: any) {
    return this.exportService.exportSummaryPdf(data);
  }

  exportDonationsDetailXlsx(filters: any) {
    return this.exportService.exportDonationsDetailXlsx(filters);
  }

  exportDonationsXlsx() {
    return this.exportService.exportDonationsXlsx();
  }

  exportRiskXlsx() {
    return this.exportService.exportRiskXlsx();
  }

  exportBoardSummaryPdf() {
    return this.exportService.exportBoardSummaryPdf();
  }

  exportHomeTotalsXlsx() {
    return this.exportService.exportHomeTotalsXlsx();
  }

  // -----------------------------
  // DASHBOARD
  // -----------------------------
  getManagementDashboard() {
    return this.dashboardService.getManagementDashboard();
  }
}
