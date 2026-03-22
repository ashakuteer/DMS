"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsDashboardService = void 0;
const common_1 = require("@nestjs/common");
const analytics_summary_service_1 = require("./analytics-summary.service");
const analytics_charts_service_1 = require("./analytics-charts.service");
const analytics_segments_service_1 = require("./analytics-segments.service");
const analytics_risk_service_1 = require("./analytics-risk.service");
let AnalyticsDashboardService = class AnalyticsDashboardService {
    constructor(summaryService, chartsService, segmentsService, riskService) {
        this.summaryService = summaryService;
        this.chartsService = chartsService;
        this.segmentsService = segmentsService;
        this.riskService = riskService;
    }
    async getManagementDashboard() {
        const [summary, monthlyDonations, topDonors, atRiskDonors,] = await Promise.all([
            this.summaryService.getSummary(),
            this.chartsService.getMonthlyDonationSeries(),
            this.segmentsService.getTopDonorsSegment(),
            this.riskService.computeAtRiskDonors(),
        ]);
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
            generatedAt: new Date(),
        };
    }
};
exports.AnalyticsDashboardService = AnalyticsDashboardService;
exports.AnalyticsDashboardService = AnalyticsDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [analytics_summary_service_1.AnalyticsSummaryService,
        analytics_charts_service_1.AnalyticsChartsService,
        analytics_segments_service_1.AnalyticsSegmentsService,
        analytics_risk_service_1.AnalyticsRiskService])
], AnalyticsDashboardService);
//# sourceMappingURL=analytics-dashboard.service.js.map