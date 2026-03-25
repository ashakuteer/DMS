import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getSummary(): Promise<any>;
    getCharts(): Promise<{
        monthlyDonations: any;
        donationsByType: any;
        donationsByHome: any;
        sponsorshipsDue: any;
    }>;
    getSegment(segment: string): Promise<any>;
    exportDonationsDetail(from: string, to: string, home: string, type: string, res: Response): Promise<void>;
    exportPdf(res: Response): Promise<void>;
    exportXlsx(type: string, res: Response): Promise<void>;
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
    exportBoardPdf(res: Response): Promise<void>;
    exportManagementXlsx(res: Response): Promise<void>;
}
