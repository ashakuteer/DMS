"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const analytics_controller_1 = require("./analytics.controller");
const analytics_service_1 = require("./analytics.service");
const analytics_summary_service_1 = require("./services/analytics-summary.service");
const analytics_charts_service_1 = require("./services/analytics-charts.service");
const analytics_segments_service_1 = require("./services/analytics-segments.service");
const analytics_risk_service_1 = require("./services/analytics-risk.service");
const analytics_export_service_1 = require("./services/analytics-export.service");
const analytics_dashboard_service_1 = require("./services/analytics-dashboard.service");
const donor_segmentation_service_1 = require("./services/donor-segmentation.service");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        controllers: [analytics_controller_1.AnalyticsController],
        providers: [
            prisma_service_1.PrismaService,
            analytics_service_1.AnalyticsService,
            analytics_summary_service_1.AnalyticsSummaryService,
            analytics_charts_service_1.AnalyticsChartsService,
            analytics_segments_service_1.AnalyticsSegmentsService,
            analytics_risk_service_1.AnalyticsRiskService,
            analytics_export_service_1.AnalyticsExportService,
            analytics_dashboard_service_1.AnalyticsDashboardService,
            donor_segmentation_service_1.DonorSegmentationService,
        ],
        exports: [
            analytics_dashboard_service_1.AnalyticsDashboardService,
        ],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map