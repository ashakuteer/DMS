import { PrismaService } from '../prisma/prisma.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { ReportCampaignType, ReportTarget } from '@prisma/client';
interface UserContext {
    userId: string;
    role: string;
}
interface CreateCampaignDto {
    name: string;
    type: ReportCampaignType;
    periodStart: string;
    periodEnd: string;
    target: ReportTarget;
    customDonorIds?: string[];
    notes?: string;
}
export declare class ReportCampaignsService {
    private prisma;
    private emailJobsService;
    private orgProfileService;
    private readonly logger;
    constructor(prisma: PrismaService, emailJobsService: EmailJobsService, orgProfileService: OrganizationProfileService);
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateCampaignDto, user: UserContext): Promise<any>;
    attachDocument(campaignId: string, documentData: {
        title: string;
        storagePath: string;
        storageBucket: string;
        mimeType: string;
        sizeBytes: number;
    }, user: UserContext): Promise<any>;
    send(campaignId: string, user: UserContext): Promise<{
        success: boolean;
        message: string;
        emailCount: number;
    }>;
    getWhatsAppText(campaignId: string): Promise<{
        text: string;
        reportUrl: any;
    }>;
    markWhatsAppSent(campaignId: string, donorId: string, user: UserContext): Promise<{
        success: boolean;
    }>;
    searchDonors(query: string): Promise<any>;
    getCampaignDonors(campaignId: string): Promise<any>;
    private getTargetDonors;
    private formatPeriodLabel;
    private buildEmailBody;
}
export {};
