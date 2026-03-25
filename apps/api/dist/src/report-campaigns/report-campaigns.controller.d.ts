import { ReportCampaignsService } from './report-campaigns.service';
import { StorageService } from '../storage/storage.service';
export declare class ReportCampaignsController {
    private readonly service;
    private readonly storageService;
    constructor(service: ReportCampaignsService, storageService: StorageService);
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
    searchDonors(query: string): Promise<{
        id: string;
        donorCode: string;
        firstName: string;
        lastName: string;
        personalEmail: string;
        officialEmail: string;
    }[]>;
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
    getCampaignDonors(id: string): Promise<{
        id: string;
        donorCode: string;
        firstName: string;
        lastName: string;
        personalEmail: string;
        officialEmail: string;
    }[]>;
    create(body: {
        name: string;
        type: 'QUARTERLY' | 'ANNUAL' | 'AUDIT' | 'EVENT';
        periodStart: string;
        periodEnd: string;
        target: string;
        customDonorIds?: string[];
        notes?: string;
    }, user: any): Promise<{
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
    attachDocument(id: string, file: Express.Multer.File, body: {
        title?: string;
    }, user: any): Promise<{
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
    send(id: string, user: any): Promise<{
        success: boolean;
        message: string;
        emailCount: number;
    }>;
    getWhatsAppText(id: string): Promise<{
        text: string;
        reportUrl: string;
    }>;
    markWhatsAppSent(id: string, donorId: string, user: any): Promise<{
        success: boolean;
    }>;
}
