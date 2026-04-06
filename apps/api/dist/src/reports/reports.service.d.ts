import { PrismaService } from '../prisma/prisma.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
interface DateFilter {
    startDate?: string;
    endDate?: string;
}
interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
}
interface DonorReportParams extends PaginationParams {
    sortBy?: 'lifetime' | 'fy' | 'lastDonation';
    sortOrder?: 'asc' | 'desc';
}
interface ReceiptAuditParams extends PaginationParams {
    paymentMode?: string;
}
type DonorHealth = 'HEALTHY' | 'AT_RISK' | 'DORMANT';
export declare class ReportsService {
    private readonly prisma;
    private orgProfileService;
    constructor(prisma: PrismaService, orgProfileService: OrganizationProfileService);
    private getFYDates;
    private buildDateFilter;
    getMonthlyDonations(filter: DateFilter, pagination: PaginationParams): Promise<{
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
    getDonorSummary(filter: DateFilter, pagination: PaginationParams): Promise<{
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
    getDonorReport(filter: DateFilter, params: DonorReportParams): Promise<{
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
            healthStatus: DonorHealth;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    exportDonorReportExcel(filter: DateFilter): Promise<Buffer>;
    exportDonorReportPdf(filter: DateFilter): Promise<Buffer>;
    getReceiptsAudit(filter: DateFilter, params: ReceiptAuditParams): Promise<{
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
    exportReceiptsAuditExcel(filter: DateFilter, paymentMode?: string): Promise<Buffer>;
    exportReceiptsAuditPdf(filter: DateFilter, paymentMode?: string): Promise<Buffer>;
    getReceiptRegister(filter: DateFilter, pagination: PaginationParams): Promise<{
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
    exportMonthlyDonationsExcel(filter: DateFilter): Promise<Buffer>;
    exportMonthlyDonationsPdf(filter: DateFilter): Promise<Buffer>;
    exportDonorSummaryExcel(filter: DateFilter): Promise<Buffer>;
    exportDonorSummaryPdf(filter: DateFilter): Promise<Buffer>;
    exportReceiptRegisterExcel(filter: DateFilter): Promise<Buffer>;
    exportReceiptRegisterPdf(filter: DateFilter): Promise<Buffer>;
    generateBoardSummaryPdf(): Promise<Buffer>;
}
export {};
