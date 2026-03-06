import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { PrismaModule } from "../prisma/prisma.module";
import { CommunicationLogModule } from "../communication-log/communication-log.module";
import { DashboardStatsService } from "./dashboard.stats.service";
import { DashboardTrendsService } from "./dashboard.trends.service";
import { DashboardInsightsService } from "./dashboard.insights.service";
import { DashboardActionsService } from "./dashboard.actions.service";
import { DashboardImpactService } from "./dashboard.impact.service";
import { DashboardRetentionService } from "./dashboard.retention.service";

@Module({
  imports: [PrismaModule, CommunicationLogModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardStatsService,
    DashboardTrendsService,
    DashboardInsightsService,
    DashboardActionsService,
    DashboardImpactService,
    DashboardRetentionService,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
