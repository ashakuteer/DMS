import { Module } from "@nestjs/common"

import { AnalyticsService } from "./analytics.service"
import { AnalyticsController } from "./analytics.controller"

import { AnalyticsSummaryService } from "./services/analytics-summary.service"
import { AnalyticsChartsService } from "./services/analytics-charts.service"
import { AnalyticsSegmentsService } from "./services/analytics-segments.service"
import { AnalyticsRiskService } from "./services/analytics-risk.service"
import { AnalyticsExportService } from "./services/analytics-export.service"
import { AnalyticsDashboardService } from "./services/analytics-dashboard.service"

@Module({
  providers: [
    AnalyticsService,
    AnalyticsSummaryService,
    AnalyticsChartsService,
    AnalyticsSegmentsService,
    AnalyticsRiskService,
    AnalyticsExportService,
    AnalyticsDashboardService,
  ],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
