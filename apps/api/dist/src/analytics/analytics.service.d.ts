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
        monthlyDonations: any[];
        donationsByType: any[];
        donationsByHome: any[];
        sponsorshipsDue: any[];
    }>;
    getSegment(segment: string): Promise<{
        donorId: string;
        donorCode: string;
        donorName: string;
        totalAmount: number;
        donationCount: number;
    }[] | {
        donorId: string;
        donorCode: string;
        donorName: string;
        lastDonationDate: Date;
        lastDonationAmount: number;
        daysSinceLastDonation: number;
        hasEmail: boolean;
        hasPhone: boolean;
    }[]>;
    exportSummaryPdf(data: any): Promise<Buffer<ArrayBufferLike>>;
    exportDonationsDetailXlsx(filters: any): Promise<Buffer<ArrayBufferLike>>;
    exportDonationsXlsx(): Promise<Buffer<ArrayBufferLike>>;
    exportRiskXlsx(): Promise<Buffer<ArrayBufferLike>>;
    exportBoardSummaryPdf(): Promise<Buffer<ArrayBufferLike>>;
    exportHomeTotalsXlsx(): Promise<Buffer<ArrayBufferLike>>;
    getDonorSegmentation(): Promise<import("./services/donor-segmentation.service").DonorSegmentationResult>;
    getManagementDashboard(): Promise<{
        summary: any;
        charts: {
            monthlyDonations: {
                monthlyDonations: any[];
                donationsByType: any[];
                donationsByHome: any[];
                sponsorshipsDue: any[];
            };
        };
        segments: {
            topDonors: {
                donorId: string;
                donorCode: string;
                donorName: string;
                totalAmount: number;
                donationCount: number;
            }[];
        };
        risks: {
            atRiskDonors: {
                donorId: string;
                donorCode: string;
                donorName: string;
                lastDonationDate: Date;
                lastDonationAmount: number;
                daysSinceLastDonation: number;
                hasEmail: boolean;
                hasPhone: boolean;
            }[];
        };
        generatedAt: Date;
    }>;
}
