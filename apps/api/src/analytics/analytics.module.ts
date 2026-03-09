import { Module } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

import { AnalyticsController } from "./analytics.controller"

import { AnalyticsSummaryService } from "./services/analytics-summary.service"
import { AnalyticsChartsService } from "./services/analytics-charts.service"
import { AnalyticsSegmentsService } from "./services/analytics-segments.service"
import { AnalyticsRiskService } from "./services/analytics-risk.service"
import { AnalyticsExportService } from "./services/analytics-export.service"
import { AnalyticsDashboardService } from "./services/analytics-dashboard.service"

@Module({
  controllers: [AnalyticsController],

  providers: [
    PrismaService,

    AnalyticsSummaryService,
    AnalyticsChartsService,
    AnalyticsSegmentsService,
    AnalyticsRiskService,
    AnalyticsExportService,
    AnalyticsDashboardService,
  ],

  exports: [
    AnalyticsDashboardService,
  ],
})
export class AnalyticsModule {}
