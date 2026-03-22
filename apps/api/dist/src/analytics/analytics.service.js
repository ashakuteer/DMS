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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const analytics_summary_service_1 = require("./services/analytics-summary.service");
const analytics_charts_service_1 = require("./services/analytics-charts.service");
const analytics_segments_service_1 = require("./services/analytics-segments.service");
const analytics_risk_service_1 = require("./services/analytics-risk.service");
const analytics_export_service_1 = require("./services/analytics-export.service");
const analytics_dashboard_service_1 = require("./services/analytics-dashboard.service");
const donor_segmentation_service_1 = require("./services/donor-segmentation.service");
let AnalyticsService = class AnalyticsService {
    constructor(summaryService, chartsService, segmentsService, riskService, exportService, dashboardService, donorSegmentationService) {
        this.summaryService = summaryService;
        this.chartsService = chartsService;
        this.segmentsService = segmentsService;
        this.riskService = riskService;
        this.exportService = exportService;
        this.dashboardService = dashboardService;
        this.donorSegmentationService = donorSegmentationService;
    }
    getSummary() {
        return this.summaryService.getSummary();
    }
    getCharts() {
        return this.chartsService.getMonthlyDonationSeries();
    }
    async getSegment(segment) {
        switch (segment) {
            case "top":
                return this.segmentsService.getTopDonorsSegment();
            case "risk":
                return this.riskService.computeAtRiskDonors();
            default:
                return [];
        }
    }
    exportSummaryPdf(data) {
        return this.exportService.exportSummaryPdf(data);
    }
    exportDonationsDetailXlsx(filters) {
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
    getDonorSegmentation() {
        return this.donorSegmentationService.getDonorSegmentation();
    }
    getManagementDashboard() {
        return this.dashboardService.getManagementDashboard();
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [analytics_summary_service_1.AnalyticsSummaryService,
        analytics_charts_service_1.AnalyticsChartsService,
        analytics_segments_service_1.AnalyticsSegmentsService,
        analytics_risk_service_1.AnalyticsRiskService,
        analytics_export_service_1.AnalyticsExportService,
        analytics_dashboard_service_1.AnalyticsDashboardService,
        donor_segmentation_service_1.DonorSegmentationService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map