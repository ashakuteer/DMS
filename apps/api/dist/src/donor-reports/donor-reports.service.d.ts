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
    generate(dto: GenerateReportDto, user: UserContext): Promise<any>;
    private getPeriodLabel;
    private aggregateReportData;
    private groupBy;
    findAll(page?: number, limit?: number, filters?: {
        type?: string;
        donorId?: string;
    }): Promise<{
        data: any;
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
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
    searchDonors(search: string, limit?: number): Promise<any>;
    getTemplates(): Promise<any>;
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
    }, user: UserContext): Promise<any>;
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
    }>): Promise<any>;
    deleteTemplate(id: string): Promise<{
        message: string;
    }>;
    getCampaigns(): Promise<any>;
}
export {};
