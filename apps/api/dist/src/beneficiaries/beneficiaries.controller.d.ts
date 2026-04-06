import type { Response } from 'express';
import { BeneficiariesService } from './beneficiaries.service';
import { UserContext, CreateBeneficiaryDto, UpdateBeneficiaryDto, CreateSponsorshipDto, UpdateSponsorshipDto, CreateBeneficiaryUpdateDto, CreateTimelineEventDto, CreateMetricDto, CreateProgressCardDto, CreateHealthEventDto, CreateReportCampaignDto } from './types';
import { StorageService } from '../storage/storage.service';
export declare class BeneficiariesController {
    private readonly beneficiariesService;
    private readonly storageService;
    constructor(beneficiariesService: BeneficiariesService, storageService: StorageService);
    findAll(user: UserContext, page?: string, limit?: string, search?: string, homeType?: string, status?: string, sponsored?: string, classGrade?: string, school?: string, academicYear?: string): Promise<{
        data: any;
        pagination: {
            total: any;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
    exportExcel(user: UserContext): Promise<any>;
    downloadBulkTemplate(): Promise<void>;
    bulkUpload(user: UserContext, file: Express.Multer.File, mode?: string): Promise<void>;
    findArchived(user: UserContext, search?: string, page?: string, limit?: string): Promise<{
        data: any;
        pagination: {
            total: any;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    quickSearch(q: string): Promise<any>;
    findById(id: string): Promise<any>;
    create(user: UserContext, dto: CreateBeneficiaryDto): Promise<any>;
    update(user: UserContext, id: string, dto: UpdateBeneficiaryDto): Promise<any>;
    delete(user: UserContext, id: string, reason?: string): Promise<{
        success: boolean;
    }>;
    restore(user: UserContext, id: string): Promise<{
        success: boolean;
    }>;
    uploadPhoto(id: string, file: Express.Multer.File): Promise<{
        photoUrl: string;
        photoPath: string;
    }>;
    deletePhoto(id: string): Promise<{
        success: boolean;
    }>;
    linkExistingPhoto(id: string, body: {
        photoUrl: string;
        photoPath?: string;
    }): Promise<{
        photoUrl: string;
        photoPath: string;
    }>;
    getSponsors(id: string): Promise<any>;
    addSponsor(user: UserContext, id: string, dto: CreateSponsorshipDto): Promise<any>;
    getUpdates(id: string): Promise<any>;
    addUpdate(user: UserContext, id: string, dto: CreateBeneficiaryUpdateDto): Promise<any>;
    getTimelineEvents(id: string): Promise<any>;
    addTimelineEvent(id: string, dto: CreateTimelineEventDto): Promise<any>;
    getMetrics(id: string): Promise<any[]>;
    addMetric(user: UserContext, id: string, dto: CreateMetricDto): Promise<any>;
    getProgressCards(id: string): Promise<any>;
    addProgressCard(user: UserContext, id: string, dto: CreateProgressCardDto): Promise<any>;
    getEducationTimeline(id: string): Promise<any>;
    exportEducationSummary(id: string, res: any): Promise<void>;
    getHealthEvents(id: string): Promise<any[]>;
    addHealthEvent(user: UserContext, id: string, dto: CreateHealthEventDto): Promise<{
        status: string;
    }>;
    notifySponsorsOfHealthEvent(user: UserContext, eventId: string): Promise<{
        status: string;
    }>;
    getHealthTimeline(id: string): Promise<any[]>;
    exportHealthHistoryPdf(id: string, res: Response): Promise<void>;
    getDocuments(user: UserContext, id: string): Promise<any>;
    createDocument(user: UserContext, id: string, file: Express.Multer.File, body: any): Promise<any>;
    getDocument(user: UserContext, docId: string): Promise<any>;
}
export declare class ReportCampaignsController {
    private readonly beneficiariesService;
    constructor(beneficiariesService: BeneficiariesService);
    findAll(): Promise<any>;
    create(user: UserContext, dto: CreateReportCampaignDto): Promise<any>;
    sendEmails(user: UserContext, id: string): Promise<{
        status: string;
        campaignId: string;
    }>;
}
export declare class SponsorshipsController {
    private readonly beneficiariesService;
    private readonly logger;
    constructor(beneficiariesService: BeneficiariesService);
    getDue(window?: string): Promise<any>;
    getSummary(): Promise<any>;
    getByDonor(donorId: string): Promise<any>;
    getByBeneficiary(beneficiaryId: string): Promise<any>;
    create(user: UserContext, dto: any): Promise<any>;
    update(user: UserContext, id: string, dto: UpdateSponsorshipDto): Promise<any>;
    delete(id: string): Promise<any>;
    sendUpdate(user: UserContext, id: string): Promise<{
        success: boolean;
        donorName: string;
        beneficiaryName: any;
        results: {
            whatsapp?: string;
            email?: string;
        };
        latestUpdateTitle: any;
    }>;
    markPaid(user: UserContext, id: string, body: {
        paymentMode?: string;
        notes?: string;
    }): Promise<any>;
    sendEmail(user: UserContext, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    queueEmail(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    skip(user: UserContext, id: string): Promise<any>;
    getHistory(id: string): Promise<any>;
}
export declare class BeneficiaryUpdatesController {
    private readonly beneficiariesService;
    constructor(beneficiariesService: BeneficiariesService);
    delete(id: string): Promise<{
        success: boolean;
    }>;
    getSponsorsForUpdate(id: string): Promise<{
        update: {
            id: any;
            title: any;
            content: any;
            updateType: any;
            isPrivate: any;
        };
        sponsors: any;
    }>;
    sendToSponsors(user: UserContext, id: string, body: {
        donorIds?: string[];
        channel: 'EMAIL' | 'WHATSAPP';
    }): Promise<{
        success: boolean;
        dispatchCount: any;
    }>;
}
export declare class SponsorDispatchesController {
    private readonly beneficiariesService;
    constructor(beneficiariesService: BeneficiariesService);
    markCopied(id: string): Promise<any>;
}
