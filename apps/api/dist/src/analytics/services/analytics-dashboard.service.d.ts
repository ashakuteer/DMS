import { AnalyticsSummaryService } from "./analytics-summary.service";
import { AnalyticsChartsService } from "./analytics-charts.service";
import { AnalyticsSegmentsService } from "./analytics-segments.service";
import { AnalyticsRiskService } from "./analytics-risk.service";
export declare class AnalyticsDashboardService {
    private readonly summaryService;
    private readonly chartsService;
    private readonly segmentsService;
    private readonly riskService;
    constructor(summaryService: AnalyticsSummaryService, chartsService: AnalyticsChartsService, segmentsService: AnalyticsSegmentsService, riskService: AnalyticsRiskService);
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
