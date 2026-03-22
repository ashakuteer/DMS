"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const dashboard_controller_1 = require("./dashboard.controller");
const dashboard_service_1 = require("./dashboard.service");
const prisma_module_1 = require("../prisma/prisma.module");
const communication_log_module_1 = require("../communication-log/communication-log.module");
const dashboard_stats_service_1 = require("./dashboard.stats.service");
const dashboard_trends_service_1 = require("./dashboard.trends.service");
const dashboard_insights_service_1 = require("./dashboard.insights.service");
const dashboard_actions_service_1 = require("./dashboard.actions.service");
const dashboard_impact_service_1 = require("./dashboard.impact.service");
const dashboard_retention_service_1 = require("./dashboard.retention.service");
const dashboard_today_service_1 = require("./dashboard.today.service");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, communication_log_module_1.CommunicationLogModule],
        controllers: [dashboard_controller_1.DashboardController],
        providers: [
            dashboard_service_1.DashboardService,
            dashboard_stats_service_1.DashboardStatsService,
            dashboard_trends_service_1.DashboardTrendsService,
            dashboard_insights_service_1.DashboardInsightsService,
            dashboard_actions_service_1.DashboardActionsService,
            dashboard_impact_service_1.DashboardImpactService,
            dashboard_retention_service_1.DashboardRetentionService,
            dashboard_today_service_1.DashboardTodayService,
        ],
        exports: [dashboard_service_1.DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map