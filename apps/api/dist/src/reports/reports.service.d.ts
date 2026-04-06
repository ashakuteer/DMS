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
export declare class ReportsService {
    private readonly prisma;
    private orgProfileService;
    constructor(prisma: PrismaService, orgProfileService: OrganizationProfileService);
    private getFYDates;
    private buildDateFilter;
    getMonthlyDonations(filter: DateFilter, pagination: PaginationParams): Promise<{
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
    getDonorSummary(filter: DateFilter, pagination: PaginationParams): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getDonorReport(filter: DateFilter, params: DonorReportParams): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    exportDonorReportExcel(filter: DateFilter): Promise<Buffer>;
    exportDonorReportPdf(filter: DateFilter): Promise<Buffer>;
    getReceiptsAudit(filter: DateFilter, params: ReceiptAuditParams): Promise<{
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
    exportReceiptsAuditExcel(filter: DateFilter, paymentMode?: string): Promise<Buffer>;
    exportReceiptsAuditPdf(filter: DateFilter, paymentMode?: string): Promise<Buffer>;
    getReceiptRegister(filter: DateFilter, pagination: PaginationParams): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
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
