import { Response } from 'express';
import { ReportsService } from './reports.service';
import { SmartReportsService } from './smart-reports.service';
export declare class ReportsController {
    private readonly reportsService;
    private readonly smartReportsService;
    constructor(reportsService: ReportsService, smartReportsService: SmartReportsService);
    getSmartReport(groupBy?: string, gender?: string, city?: string, state?: string, country?: string, profession?: string, category?: string, occasion?: string, donationType?: string, minAmount?: string, maxAmount?: string, dateFrom?: string, dateTo?: string, visited?: string): Promise<import("./smart-reports.service").SmartReportRow[]>;
    exportSmartReport(format?: string, groupBy?: string, gender?: string, city?: string, state?: string, country?: string, profession?: string, category?: string, occasion?: string, donationType?: string, minAmount?: string, maxAmount?: string, dateFrom?: string, dateTo?: string, visited?: string, res?: Response): Promise<void>;
    saveReport(body: {
        name: string;
        filters: any;
        groupBy: string;
    }): Promise<any>;
    getReportHistory(): Promise<any>;
    getAnalytics(): Promise<{
        monthlyDonations: {
            month: string;
            amount: number;
            count: number;
        }[];
        professionStats: {
            profession: string;
            count: number;
        }[];
        categoryStats: {
            amount: number;
            count: number;
            category: string;
        }[];
        occasionStats: {
            amount: number;
            count: number;
            occasion: string;
        }[];
        geoStats: {
            hyderabad: number;
            telanganaOther: number;
            otherStates: number;
            international: number;
        };
        repeatVsOneTime: {
            repeat: number;
            oneTime: number;
        };
        topDonors: any;
        donationTrend: {
            month: string;
            amount: number;
        }[];
    }>;
    getMonthlyDonations(startDate?: string, endDate?: string, page?: string, limit?: string, search?: string): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
        summary: {
            totalAmount: any;
            totalCount: any;
        };
    }>;
    getDonorReport(startDate?: string, endDate?: string, page?: string, limit?: string, search?: string, sortBy?: string, sortOrder?: string): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    exportDonorReportExcel(startDate: string, endDate: string, res: Response): Promise<void>;
    exportDonorReportPdf(startDate: string, endDate: string, res: Response): Promise<void>;
    getDonorSummary(startDate?: string, endDate?: string, page?: string, limit?: string, search?: string): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getBoardSummaryPdf(res: Response): Promise<void>;
    getReceiptsAudit(startDate?: string, endDate?: string, page?: string, limit?: string, search?: string, paymentMode?: string): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
        summary: {
            totalAmount: any;
            totalCount: any;
        };
    }>;
    exportReceiptsAuditExcel(startDate: string, endDate: string, paymentMode: string, res: Response): Promise<void>;
    exportReceiptsAuditPdf(startDate: string, endDate: string, paymentMode: string, res: Response): Promise<void>;
    getReceiptRegister(startDate?: string, endDate?: string, page?: string, limit?: string, search?: string): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    exportMonthlyDonationsExcel(startDate: string, endDate: string, res: Response): Promise<void>;
    exportMonthlyDonationsPdf(startDate: string, endDate: string, res: Response): Promise<void>;
    exportDonorSummaryExcel(startDate: string, endDate: string, res: Response): Promise<void>;
    exportDonorSummaryPdf(startDate: string, endDate: string, res: Response): Promise<void>;
    exportReceiptRegisterExcel(startDate: string, endDate: string, res: Response): Promise<void>;
    exportReceiptRegisterPdf(startDate: string, endDate: string, res: Response): Promise<void>;
}
