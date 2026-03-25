import type { Response } from 'express';
import { BeneficiariesService } from './beneficiaries.service';
import { UserContext, CreateBeneficiaryDto, UpdateBeneficiaryDto, CreateSponsorshipDto, UpdateSponsorshipDto, CreateBeneficiaryUpdateDto, CreateTimelineEventDto, CreateMetricDto, CreateProgressCardDto, CreateHealthEventDto, CreateReportCampaignDto } from './types';
import { StorageService } from '../storage/storage.service';
export declare class BeneficiariesController {
    private readonly beneficiariesService;
    private readonly storageService;
    constructor(beneficiariesService: BeneficiariesService, storageService: StorageService);
    findAll(user: UserContext, page?: string, limit?: string, search?: string, homeType?: string, status?: string, sponsored?: string, classGrade?: string, school?: string, academicYear?: string): Promise<{
        data: any[];
        pagination: {
            total: number;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
    exportExcel(user: UserContext): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        status: import(".prisma/client").$Enums.BeneficiaryStatus;
        createdById: string;
        isDeleted: boolean;
        deletedAt: Date;
        gender: import(".prisma/client").$Enums.Gender;
        category: import(".prisma/client").$Enums.BeneficiaryCategory;
        dobDay: number;
        dobMonth: number;
        fullName: string;
        homeType: import(".prisma/client").$Enums.HomeType;
        dobYear: number;
        approxAge: number;
        joinDate: Date;
        heightCmAtJoin: number;
        weightKgAtJoin: import("@prisma/client/runtime/library").Decimal;
        educationClassOrRole: string;
        schoolOrCollege: string;
        healthNotes: string;
        currentHealthStatus: string;
        background: string;
        hobbies: string;
        dreamCareer: string;
        favouriteSubject: string;
        favouriteGame: string;
        favouriteActivityAtHome: string;
        bestFriend: string;
        sourceOfPrideOrHappiness: string;
        funFact: string;
        additionalNotes: string;
        protectPrivacy: boolean;
        photoUrl: string;
        photoPath: string;
    }[]>;
    downloadBulkTemplate(): Promise<void>;
    bulkUpload(user: UserContext, file: Express.Multer.File, mode?: string): Promise<void>;
    findArchived(user: UserContext, search?: string, page?: string, limit?: string): Promise<{
        data: {
            id: string;
            code: string;
            status: import(".prisma/client").$Enums.BeneficiaryStatus;
            deletedAt: Date;
            deletedBy: string;
            deleteReason: string;
            fullName: string;
            homeType: import(".prisma/client").$Enums.HomeType;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    quickSearch(q: string): Promise<{
        id: string;
        code: string;
        fullName: string;
        homeType: import(".prisma/client").$Enums.HomeType;
    }[]>;
    findById(id: string): Promise<{
        activeSponsorsCount: number;
        updatesCount: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        status: import(".prisma/client").$Enums.BeneficiaryStatus;
        createdById: string;
        createdBy: {
            name: string;
            id: string;
        };
        isDeleted: boolean;
        deletedAt: Date;
        gender: import(".prisma/client").$Enums.Gender;
        category: import(".prisma/client").$Enums.BeneficiaryCategory;
        dobDay: number;
        dobMonth: number;
        sponsorships: {
            donor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
                primaryPhone: string;
                personalEmail: string;
            };
            id: string;
            createdAt: Date;
            isActive: boolean;
            updatedAt: Date;
            startDate: Date;
            endDate: Date;
            donorId: string;
            status: import(".prisma/client").$Enums.SponsorshipStatus;
            currency: string;
            notes: string;
            beneficiaryId: string;
            sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
            amount: import("@prisma/client/runtime/library").Decimal;
            inKindItem: string;
            frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
            dueDayOfMonth: number;
            nextDueDate: Date;
        }[];
        fullName: string;
        homeType: import(".prisma/client").$Enums.HomeType;
        dobYear: number;
        approxAge: number;
        joinDate: Date;
        heightCmAtJoin: number;
        weightKgAtJoin: import("@prisma/client/runtime/library").Decimal;
        educationClassOrRole: string;
        schoolOrCollege: string;
        healthNotes: string;
        currentHealthStatus: string;
        background: string;
        hobbies: string;
        dreamCareer: string;
        favouriteSubject: string;
        favouriteGame: string;
        favouriteActivityAtHome: string;
        bestFriend: string;
        sourceOfPrideOrHappiness: string;
        funFact: string;
        additionalNotes: string;
        protectPrivacy: boolean;
        photoUrl: string;
        photoPath: string;
        updates: {
            id: string;
            createdAt: Date;
            attachments: {
                document: {
                    id: string;
                    title: string;
                    storagePath: string;
                    mimeType: string;
                };
                id: string;
                documentId: string;
            }[];
            content: string;
            createdById: string;
            createdBy: {
                name: string;
                id: string;
            };
            title: string;
            beneficiaryId: string;
            updateType: import(".prisma/client").$Enums.BeneficiaryUpdateType;
            mediaUrls: string[];
            isPrivate: boolean;
            shareWithDonor: boolean;
        }[];
        timelineEvents: {
            id: string;
            createdAt: Date;
            description: string;
            beneficiaryId: string;
            eventType: import(".prisma/client").$Enums.BeneficiaryEventType;
            eventDate: Date;
        }[];
    }>;
    create(user: UserContext, dto: CreateBeneficiaryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        status: import(".prisma/client").$Enums.BeneficiaryStatus;
        createdById: string;
        isDeleted: boolean;
        deletedAt: Date;
        gender: import(".prisma/client").$Enums.Gender;
        category: import(".prisma/client").$Enums.BeneficiaryCategory;
        dobDay: number;
        dobMonth: number;
        fullName: string;
        homeType: import(".prisma/client").$Enums.HomeType;
        dobYear: number;
        approxAge: number;
        joinDate: Date;
        heightCmAtJoin: number;
        weightKgAtJoin: import("@prisma/client/runtime/library").Decimal;
        educationClassOrRole: string;
        schoolOrCollege: string;
        healthNotes: string;
        currentHealthStatus: string;
        background: string;
        hobbies: string;
        dreamCareer: string;
        favouriteSubject: string;
        favouriteGame: string;
        favouriteActivityAtHome: string;
        bestFriend: string;
        sourceOfPrideOrHappiness: string;
        funFact: string;
        additionalNotes: string;
        protectPrivacy: boolean;
        photoUrl: string;
        photoPath: string;
    }>;
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
    getSponsors(id: string): Promise<({
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        currency: string;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    })[]>;
    addSponsor(user: UserContext, id: string, dto: CreateSponsorshipDto): Promise<any>;
    getUpdates(id: string): Promise<({
        attachments: ({
            document: {
                id: string;
                title: string;
                storagePath: string;
                mimeType: string;
            };
        } & {
            id: string;
            updateId: string;
            documentId: string;
        })[];
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        createdById: string;
        title: string;
        beneficiaryId: string;
        updateType: import(".prisma/client").$Enums.BeneficiaryUpdateType;
        mediaUrls: string[];
        isPrivate: boolean;
        shareWithDonor: boolean;
    })[]>;
    addUpdate(user: UserContext, id: string, dto: CreateBeneficiaryUpdateDto): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        createdById: string;
        title: string;
        beneficiaryId: string;
        updateType: import(".prisma/client").$Enums.BeneficiaryUpdateType;
        mediaUrls: string[];
        isPrivate: boolean;
        shareWithDonor: boolean;
    }>;
    getTimelineEvents(id: string): Promise<any>;
    addTimelineEvent(id: string, dto: CreateTimelineEventDto): Promise<any>;
    getMetrics(id: string): Promise<any[]>;
    addMetric(user: UserContext, id: string, dto: CreateMetricDto): Promise<any>;
    getProgressCards(id: string): Promise<({
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        createdById: string;
        remarks: string | null;
        classGrade: string;
        school: string | null;
        academicYear: string;
        beneficiaryId: string;
        term: import(".prisma/client").$Enums.ProgressTerm;
        overallPercentage: import("@prisma/client/runtime/library").Decimal | null;
        fileDocumentId: string | null;
    })[]>;
    addProgressCard(user: UserContext, id: string, dto: CreateProgressCardDto): Promise<{
        id: string;
        createdAt: Date;
        createdById: string;
        remarks: string | null;
        classGrade: string;
        school: string | null;
        academicYear: string;
        beneficiaryId: string;
        term: import(".prisma/client").$Enums.ProgressTerm;
        overallPercentage: import("@prisma/client/runtime/library").Decimal | null;
        fileDocumentId: string | null;
    }>;
    getEducationTimeline(id: string): Promise<{
        id: string;
        createdAt: Date;
        createdById: string;
        remarks: string | null;
        classGrade: string;
        school: string | null;
        academicYear: string;
        beneficiaryId: string;
        term: import(".prisma/client").$Enums.ProgressTerm;
        overallPercentage: import("@prisma/client/runtime/library").Decimal | null;
        fileDocumentId: string | null;
    }[]>;
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
    getDocuments(user: UserContext, id: string): Promise<({
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        description: string | null;
        createdById: string;
        title: string;
        shareWithDonor: boolean;
        ownerType: import(".prisma/client").$Enums.DocumentOwnerType;
        ownerId: string | null;
        docType: import(".prisma/client").$Enums.DocumentType;
        storageBucket: string;
        storagePath: string;
        mimeType: string;
        sizeBytes: number;
        isSensitive: boolean;
    })[]>;
    createDocument(user: UserContext, id: string, file: Express.Multer.File, body: any): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        createdById: string;
        title: string;
        shareWithDonor: boolean;
        ownerType: import(".prisma/client").$Enums.DocumentOwnerType;
        ownerId: string | null;
        docType: import(".prisma/client").$Enums.DocumentType;
        storageBucket: string;
        storagePath: string;
        mimeType: string;
        sizeBytes: number;
        isSensitive: boolean;
    }>;
    getDocument(user: UserContext, docId: string): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        createdById: string;
        title: string;
        shareWithDonor: boolean;
        ownerType: import(".prisma/client").$Enums.DocumentOwnerType;
        ownerId: string | null;
        docType: import(".prisma/client").$Enums.DocumentType;
        storageBucket: string;
        storagePath: string;
        mimeType: string;
        sizeBytes: number;
        isSensitive: boolean;
    }>;
}
export declare class ReportCampaignsController {
    private readonly beneficiariesService;
    constructor(beneficiariesService: BeneficiariesService);
    findAll(): Promise<({
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
    create(user: UserContext, dto: CreateReportCampaignDto): Promise<{
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
    getSummary(): Promise<number>;
    getByDonor(donorId: string): Promise<({
        beneficiary: {
            id: string;
            code: string;
            status: import(".prisma/client").$Enums.BeneficiaryStatus;
            fullName: string;
            homeType: import(".prisma/client").$Enums.HomeType;
            photoUrl: string;
            updates: {
                id: string;
                createdAt: Date;
                content: string;
                title: string;
                updateType: import(".prisma/client").$Enums.BeneficiaryUpdateType;
            }[];
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        currency: string;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    })[]>;
    getByBeneficiary(beneficiaryId: string): Promise<({
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        currency: string;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    })[]>;
    create(user: UserContext, dto: any): Promise<{
        beneficiary: {
            id: string;
            code: string;
            status: import(".prisma/client").$Enums.BeneficiaryStatus;
            fullName: string;
            homeType: import(".prisma/client").$Enums.HomeType;
            photoUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        currency: string;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    }>;
    update(user: UserContext, id: string, dto: UpdateSponsorshipDto): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        currency: string;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        currency: string;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    }>;
    sendUpdate(user: UserContext, id: string): Promise<{
        success: boolean;
        donorName: string;
        beneficiaryName: string;
        results: {
            whatsapp?: string;
            email?: string;
        };
        latestUpdateTitle: string;
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
    getHistory(id: string): Promise<({
        changedBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        sponsorshipId: string;
        oldStatus: import(".prisma/client").$Enums.SponsorshipStatus;
        newStatus: import(".prisma/client").$Enums.SponsorshipStatus;
        oldAmount: import("@prisma/client/runtime/library").Decimal | null;
        newAmount: import("@prisma/client/runtime/library").Decimal | null;
        note: string | null;
        changedAt: Date;
        changedById: string;
    })[]>;
}
export declare class BeneficiaryUpdatesController {
    private readonly beneficiariesService;
    constructor(beneficiariesService: BeneficiariesService);
    delete(id: string): Promise<{
        success: boolean;
    }>;
    getSponsorsForUpdate(id: string): Promise<{
        update: {
            id: string;
            title: string;
            content: string;
            updateType: import(".prisma/client").$Enums.BeneficiaryUpdateType;
            isPrivate: boolean;
        };
        sponsors: ({
            donor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
                primaryPhone: string;
                personalEmail: string;
            };
        } & {
            id: string;
            createdAt: Date;
            isActive: boolean;
            updatedAt: Date;
            startDate: Date | null;
            endDate: Date | null;
            donorId: string;
            status: import(".prisma/client").$Enums.SponsorshipStatus;
            currency: string;
            notes: string | null;
            beneficiaryId: string;
            sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
            amount: import("@prisma/client/runtime/library").Decimal | null;
            inKindItem: string | null;
            frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
            dueDayOfMonth: number | null;
            nextDueDate: Date | null;
        })[];
    }>;
    sendToSponsors(user: UserContext, id: string, body: {
        donorIds?: string[];
        channel: 'EMAIL' | 'WHATSAPP';
    }): Promise<{
        success: boolean;
        dispatchCount: number;
    }>;
}
export declare class SponsorDispatchesController {
    private readonly beneficiariesService;
    constructor(beneficiariesService: BeneficiariesService);
    markCopied(id: string): Promise<{
        error: string | null;
        id: string;
        createdAt: Date;
        donorId: string;
        channel: import(".prisma/client").$Enums.SponsorDispatchChannel;
        status: import(".prisma/client").$Enums.SponsorDispatchStatus;
        sentAt: Date | null;
        updateId: string;
    }>;
}
