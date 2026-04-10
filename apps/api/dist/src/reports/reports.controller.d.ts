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
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        filters: import("@prisma/client/runtime/library").JsonValue;
        groupBy: string;
    }>;
    getReportHistory(): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        filters: import("@prisma/client/runtime/library").JsonValue;
        groupBy: string;
    }[]>;
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
        topDonors: {
            id: string;
            name: string;
            donorCode: string;
            city: string;
            totalAmount: any;
            donationCount: number;
        }[];
        donationTrend: {
            month: string;
            amount: number;
        }[];
    }>;
    getMonthlyDonations(startDate?: string, endDate?: string, page?: string, limit?: string, search?: string): Promise<{
        data: {
            id: string;
            donationDate: Date;
            donorName: string;
            donorCode: string;
            donationType: import("@prisma/client").$Enums.DonationType;
            donationMode: import("@prisma/client").$Enums.DonationMode;
            amount: import("@prisma/client/runtime/library").Decimal;
            receiptNumber: string;
            remarks: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        summary: {
            totalAmount: number | import("@prisma/client/runtime/library").Decimal;
            totalCount: number;
        };
    }>;
    getDonorReport(startDate?: string, endDate?: string, page?: string, limit?: string, search?: string, sortBy?: string, sortOrder?: string): Promise<{
        data: {
            id: string;
            donorCode: string;
            donorName: string;
            city: string;
            country: string;
            lifetimeTotal: number;
            fyTotal: number;
            donationCount: number;
            lastDonation: Date;
            healthStatus: "AT_RISK" | "DORMANT" | "HEALTHY";
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    exportDonorReportExcel(startDate: string, endDate: string, res: Response): Promise<void>;
    exportDonorReportPdf(startDate: string, endDate: string, res: Response): Promise<void>;
    getDonorSummary(startDate?: string, endDate?: string, page?: string, limit?: string, search?: string): Promise<{
        data: {
            id: string;
            donorName: string;
            donorCode: string;
            category: import("@prisma/client").$Enums.DonorCategory;
            fyTotal: number;
            fyCount: number;
            lifetimeTotal: number;
            lifetimeCount: number;
            lastDonation: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getBoardSummaryPdf(res: Response): Promise<void>;
    getReceiptsAudit(startDate?: string, endDate?: string, page?: string, limit?: string, search?: string, paymentMode?: string): Promise<{
        data: {
            id: string;
            receiptNumber: string;
            receiptDate: Date;
            donorName: string;
            donorCode: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMode: import("@prisma/client").$Enums.DonationMode;
            financialYear: string;
            donationCategory: import("@prisma/client").$Enums.DonationType;
            generatedBy: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        summary: {
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            totalCount: number;
        };
    }>;
    exportReceiptsAuditExcel(startDate: string, endDate: string, paymentMode: string, res: Response): Promise<void>;
    exportReceiptsAuditPdf(startDate: string, endDate: string, paymentMode: string, res: Response): Promise<void>;
    getReceiptRegister(startDate?: string, endDate?: string, page?: string, limit?: string, search?: string): Promise<{
        data: {
            id: string;
            receiptNumber: string;
            donationDate: Date;
            donorName: string;
            donorCode: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            donationMode: import("@prisma/client").$Enums.DonationMode;
            donationType: import("@prisma/client").$Enums.DonationType;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
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
