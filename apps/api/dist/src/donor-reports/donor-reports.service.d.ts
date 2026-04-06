import { PrismaService } from '../prisma/prisma.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { DonorReportType } from '@prisma/client';
interface GenerateReportDto {
    type: DonorReportType;
    periodStart: string;
    periodEnd: string;
    donorId?: string;
    campaignId?: string;
    templateId?: string;
    title?: string;
}
interface UserContext {
    id: string;
    email: string;
    role: string;
    name?: string;
}
export declare class DonorReportsService {
    private prisma;
    private emailJobsService;
    private orgProfileService;
    private readonly logger;
    private readonly fmt;
    constructor(prisma: PrismaService, emailJobsService: EmailJobsService, orgProfileService: OrganizationProfileService);
    generate(dto: GenerateReportDto, user: UserContext): Promise<{
        donor: {
            donorCode: string;
            firstName: string;
            lastName: string;
        };
        template: {
            name: string;
            headerText: string;
            footerText: string;
            showDonationSummary: boolean;
            showDonationBreakdown: boolean;
            showBeneficiaries: boolean;
            showCampaigns: boolean;
            showUsageSummary: boolean;
        };
        generatedBy: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string | null;
        templateId: string | null;
        type: import("@prisma/client").$Enums.DonorReportType;
        status: import("@prisma/client").$Enums.DonorReportStatus;
        campaignId: string | null;
        title: string;
        periodStart: Date;
        periodEnd: Date;
        reportData: import("@prisma/client/runtime/library").JsonValue | null;
        pdfUrl: string | null;
        excelUrl: string | null;
        sharedAt: Date | null;
        sharedTo: string[];
        generatedById: string;
    }>;
    private getPeriodLabel;
    private aggregateReportData;
    private groupBy;
    findAll(page?: number, limit?: number, filters?: {
        type?: string;
        donorId?: string;
    }): Promise<{
        data: ({
            donor: {
                donorCode: string;
                firstName: string;
                lastName: string;
            };
            template: {
                name: string;
            };
            generatedBy: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            donorId: string | null;
            templateId: string | null;
            type: import("@prisma/client").$Enums.DonorReportType;
            status: import("@prisma/client").$Enums.DonorReportStatus;
            campaignId: string | null;
            title: string;
            periodStart: Date;
            periodEnd: Date;
            reportData: import("@prisma/client/runtime/library").JsonValue | null;
            pdfUrl: string | null;
            excelUrl: string | null;
            sharedAt: Date | null;
            sharedTo: string[];
            generatedById: string;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        donor: {
            donorCode: string;
            firstName: string;
            lastName: string;
        };
        template: {
            name: string;
            headerText: string;
            footerText: string;
            showDonationSummary: boolean;
            showDonationBreakdown: boolean;
            showBeneficiaries: boolean;
            showCampaigns: boolean;
            showUsageSummary: boolean;
        };
        generatedBy: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string | null;
        templateId: string | null;
        type: import("@prisma/client").$Enums.DonorReportType;
        status: import("@prisma/client").$Enums.DonorReportStatus;
        campaignId: string | null;
        title: string;
        periodStart: Date;
        periodEnd: Date;
        reportData: import("@prisma/client/runtime/library").JsonValue | null;
        pdfUrl: string | null;
        excelUrl: string | null;
        sharedAt: Date | null;
        sharedTo: string[];
        generatedById: string;
    }>;
    deleteReport(id: string): Promise<{
        message: string;
    }>;
    generatePdf(id: string): Promise<Buffer>;
    private pdfSection;
    private pdfTable;
    generateExcel(id: string): Promise<Buffer>;
    shareReport(id: string, donorIds: string[], user: UserContext): Promise<{
        message: string;
        sentCount: number;
    }>;
    private buildShareEmailHtml;
    searchDonors(search: string, limit?: number): Promise<{
        id: string;
        donorCode: string;
        firstName: string;
        lastName: string;
        personalEmail: string;
        officialEmail: string;
    }[]>;
    getTemplates(): Promise<({
        createdBy: {
            name: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        isDefault: boolean;
        headerText: string | null;
        footerText: string | null;
        showDonationSummary: boolean;
        showDonationBreakdown: boolean;
        showBeneficiaries: boolean;
        showCampaigns: boolean;
        showUsageSummary: boolean;
        customSections: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    createTemplate(dto: {
        name: string;
        headerText?: string;
        footerText?: string;
        showDonationSummary?: boolean;
        showDonationBreakdown?: boolean;
        showBeneficiaries?: boolean;
        showCampaigns?: boolean;
        showUsageSummary?: boolean;
        isDefault?: boolean;
    }, user: UserContext): Promise<{
        createdBy: {
            name: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        isDefault: boolean;
        headerText: string | null;
        footerText: string | null;
        showDonationSummary: boolean;
        showDonationBreakdown: boolean;
        showBeneficiaries: boolean;
        showCampaigns: boolean;
        showUsageSummary: boolean;
        customSections: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updateTemplate(id: string, dto: Partial<{
        name: string;
        headerText: string;
        footerText: string;
        showDonationSummary: boolean;
        showDonationBreakdown: boolean;
        showBeneficiaries: boolean;
        showCampaigns: boolean;
        showUsageSummary: boolean;
        isDefault: boolean;
    }>): Promise<{
        createdBy: {
            name: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        isDefault: boolean;
        headerText: string | null;
        footerText: string | null;
        showDonationSummary: boolean;
        showDonationBreakdown: boolean;
        showBeneficiaries: boolean;
        showCampaigns: boolean;
        showUsageSummary: boolean;
        customSections: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    deleteTemplate(id: string): Promise<{
        message: string;
    }>;
    getCampaigns(): Promise<{
        name: string;
        id: string;
        status: import("@prisma/client").$Enums.CampaignStatus;
    }[]>;
}
export {};
