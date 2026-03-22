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
    findAll(): Promise<({
        document: {
            id: string;
            title: string;
            storagePath: string;
            mimeType: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ReportCampaignType;
        status: import(".prisma/client").$Enums.ReportCampaignStatus;
        createdById: string;
        notes: string | null;
        sentAt: Date | null;
        documentId: string | null;
        periodStart: Date;
        periodEnd: Date;
        target: import(".prisma/client").$Enums.ReportTarget;
        customDonorIds: string[];
        emailsSent: number;
    })[]>;
    findOne(id: string): Promise<{
        document: {
            id: string;
            title: string;
            storagePath: string;
            mimeType: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ReportCampaignType;
        status: import(".prisma/client").$Enums.ReportCampaignStatus;
        createdById: string;
        notes: string | null;
        sentAt: Date | null;
        documentId: string | null;
        periodStart: Date;
        periodEnd: Date;
        target: import(".prisma/client").$Enums.ReportTarget;
        customDonorIds: string[];
        emailsSent: number;
    }>;
    create(dto: CreateCampaignDto, user: UserContext): Promise<{
        document: {
            id: string;
            title: string;
            storagePath: string;
            mimeType: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ReportCampaignType;
        status: import(".prisma/client").$Enums.ReportCampaignStatus;
        createdById: string;
        notes: string | null;
        sentAt: Date | null;
        documentId: string | null;
        periodStart: Date;
        periodEnd: Date;
        target: import(".prisma/client").$Enums.ReportTarget;
        customDonorIds: string[];
        emailsSent: number;
    }>;
    attachDocument(campaignId: string, documentData: {
        title: string;
        storagePath: string;
        storageBucket: string;
        mimeType: string;
        sizeBytes: number;
    }, user: UserContext): Promise<{
        document: {
            id: string;
            title: string;
            storagePath: string;
            mimeType: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ReportCampaignType;
        status: import(".prisma/client").$Enums.ReportCampaignStatus;
        createdById: string;
        notes: string | null;
        sentAt: Date | null;
        documentId: string | null;
        periodStart: Date;
        periodEnd: Date;
        target: import(".prisma/client").$Enums.ReportTarget;
        customDonorIds: string[];
        emailsSent: number;
    }>;
    send(campaignId: string, user: UserContext): Promise<{
        success: boolean;
        message: string;
        emailCount: number;
    }>;
    getWhatsAppText(campaignId: string): Promise<{
        text: string;
        reportUrl: string;
    }>;
    markWhatsAppSent(campaignId: string, donorId: string, user: UserContext): Promise<{
        success: boolean;
    }>;
    searchDonors(query: string): Promise<{
        id: string;
        donorCode: string;
        firstName: string;
        lastName: string;
        personalEmail: string;
        officialEmail: string;
    }[]>;
    getCampaignDonors(campaignId: string): Promise<{
        id: string;
        donorCode: string;
        firstName: string;
        lastName: string;
        personalEmail: string;
        officialEmail: string;
    }[]>;
    private getTargetDonors;
    private formatPeriodLabel;
    private buildEmailBody;
}
export {};
