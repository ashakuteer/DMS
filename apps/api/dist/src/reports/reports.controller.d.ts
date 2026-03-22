import { Response } from 'express';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getMonthlyDonations(startDate?: string, endDate?: string, page?: string, limit?: string, search?: string): Promise<{
        data: {
            id: string;
            donationDate: Date;
            donorName: string;
            donorCode: string;
            donationType: import(".prisma/client").$Enums.DonationType;
            donationMode: import(".prisma/client").$Enums.DonationMode;
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
            category: import(".prisma/client").$Enums.DonorCategory;
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
            paymentMode: import(".prisma/client").$Enums.DonationMode;
            financialYear: string;
            donationCategory: import(".prisma/client").$Enums.DonationType;
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
            donationMode: import(".prisma/client").$Enums.DonationMode;
            donationType: import(".prisma/client").$Enums.DonationType;
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
