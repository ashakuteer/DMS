import { AnalyticsSummaryService } from "./services/analytics-summary.service";
import { AnalyticsChartsService } from "./services/analytics-charts.service";
import { AnalyticsSegmentsService } from "./services/analytics-segments.service";
import { AnalyticsRiskService } from "./services/analytics-risk.service";
import { AnalyticsExportService } from "./services/analytics-export.service";
import { AnalyticsDashboardService } from "./services/analytics-dashboard.service";
import { DonorSegmentationService } from "./services/donor-segmentation.service";
export declare class AnalyticsService {
    private summaryService;
    private chartsService;
    private segmentsService;
    private riskService;
    private exportService;
    private dashboardService;
    private donorSegmentationService;
    constructor(summaryService: AnalyticsSummaryService, chartsService: AnalyticsChartsService, segmentsService: AnalyticsSegmentsService, riskService: AnalyticsRiskService, exportService: AnalyticsExportService, dashboardService: AnalyticsDashboardService, donorSegmentationService: DonorSegmentationService);
    getSummary(): Promise<any>;
    getCharts(): Promise<{
        monthlyDonations: any;
        donationsByType: any;
        donationsByHome: any;
        sponsorshipsDue: any;
    }>;
    getSegment(segment: string): Promise<any>;
    exportSummaryPdf(data: any): Promise<Buffer>;
    exportDonationsDetailXlsx(filters: any): Promise<Buffer>;
    exportDonationsXlsx(): Promise<Buffer>;
    exportRiskXlsx(): Promise<Buffer>;
    exportBoardSummaryPdf(): Promise<Buffer>;
    exportHomeTotalsXlsx(): Promise<Buffer>;
    getDonorSegmentation(): Promise<import("./services/donor-segmentation.service").DonorSegmentationResult>;
    getManagementDashboard(): Promise<{
        summary: any;
        charts: {
            monthlyDonations: {
                monthlyDonations: any;
                donationsByType: any;
                donationsByHome: any;
                sponsorshipsDue: any;
            };
        };
        segments: {
            topDonors: any;
        };
        risks: {
            atRiskDonors: any;
        };
        generatedAt: Date;
    }>;
}
