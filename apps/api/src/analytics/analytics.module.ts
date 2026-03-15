import { Module } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

import { AnalyticsController } from "./analytics.controller"
import { AnalyticsService } from "./analytics.service"

import { AnalyticsSummaryService } from "./services/analytics-summary.service"
import { AnalyticsChartsService } from "./services/analytics-charts.service"
import { AnalyticsSegmentsService } from "./services/analytics-segments.service"
import { AnalyticsRiskService } from "./services/analytics-risk.service"
import { AnalyticsExportService } from "./services/analytics-export.service"
import { AnalyticsDashboardService } from "./services/analytics-dashboard.service"
import { DonorSegmentationService } from "./services/donor-segmentation.service"

@Module({
  controllers: [AnalyticsController],

  providers: [
    PrismaService,

    AnalyticsService,

    AnalyticsSummaryService,
    AnalyticsChartsService,
    AnalyticsSegmentsService,
    AnalyticsRiskService,
    AnalyticsExportService,
    AnalyticsDashboardService,
    DonorSegmentationService,
  ],

  exports: [
    AnalyticsDashboardService,
  ],
})
export class AnalyticsModule {}
