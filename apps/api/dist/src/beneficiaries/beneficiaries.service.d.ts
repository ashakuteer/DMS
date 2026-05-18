import { BeneficiaryCoreService } from './services/beneficiary-core.service';
import { BeneficiarySponsorshipService } from './services/beneficiary-sponsorship.service';
import { BeneficiaryUpdatesService } from './services/beneficiary-updates.service';
import { BeneficiaryHealthService } from './services/beneficiary-health.service';
import { BeneficiaryEducationService } from './services/beneficiary-education.service';
import { BeneficiaryDocumentsService } from './services/beneficiary-documents.service';
import { BeneficiaryReportsService } from './services/beneficiary-reports.service';
import { BeneficiaryRemindersService } from './services/beneficiary-reminders.service';
export declare class BeneficiariesService {
    private core;
    private sponsorship;
    private updates;
    private health;
    private education;
    private documents;
    private reports;
    private reminders;
    constructor(core: BeneficiaryCoreService, sponsorship: BeneficiarySponsorshipService, updates: BeneficiaryUpdatesService, health: BeneficiaryHealthService, education: BeneficiaryEducationService, documents: BeneficiaryDocumentsService, reports: BeneficiaryReportsService, reminders: BeneficiaryRemindersService);
    quickSearch(q: string): Promise<{
        code: string;
        id: string;
        fullName: string;
        homeType: import(".prisma/client").$Enums.HomeType;
    }[]>;
    findAll(user: any, options: any): Promise<{
        data: any[];
        pagination: {
            total: number;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<{
        activeSponsorsCount: number;
        updatesCount: number;
        code: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
            currency: string;
            startDate: Date;
            endDate: Date;
            donorId: string;
            status: import(".prisma/client").$Enums.SponsorshipStatus;
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
    create(user: any, dto: any): Promise<{
        code: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
    update(user: any, id: string, dto: any): any;
    delete(user: any, id: string, deleteReason?: string): Promise<{
        success: boolean;
    }>;
    restore(user: any, id: string): Promise<{
        success: boolean;
    }>;
    findArchived(user: any, search?: string, page?: number, limit?: number): Promise<{
        data: {
            code: string;
            id: string;
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
    updatePhoto(id: string, url: string | null, path?: string | null): any;
    getSponsors(beneficiaryId: string): Promise<({
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
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    })[]>;
    addSponsor(user: any, beneficiaryId: string, dto: any): any;
    getDonorSponsorships(donorId: string): Promise<({
        beneficiary: {
            code: string;
            id: string;
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
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    })[]>;
    getSponsorshipsByBeneficiary(beneficiaryId: string): Promise<({
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
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    })[]>;
    sendUpdateToSponsor(userId: string, sponsorshipId: string): Promise<{
        success: boolean;
        donorName: string;
        beneficiaryName: string;
        results: {
            whatsapp?: string;
            email?: string;
        };
        latestUpdateTitle: string;
    }>;
    createSponsorshipForDonor(user: any, dto: any): Promise<{
        beneficiary: {
            code: string;
            id: string;
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
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    }>;
    getUpdates(beneficiaryId: string): Promise<({
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
    addUpdate(user: any, beneficiaryId: string, dto: any): Promise<{
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
    deleteUpdate(updateId: string): Promise<{
        success: boolean;
    }>;
    markDispatchCopied(id: string): Promise<{
        error: string | null;
        id: string;
        createdAt: Date;
        donorId: string;
        channel: import(".prisma/client").$Enums.SponsorDispatchChannel;
        status: import(".prisma/client").$Enums.SponsorDispatchStatus;
        sentAt: Date | null;
        updateId: string;
    }>;
    getTimelineEvents(beneficiaryId: string): any;
    addTimelineEvent(beneficiaryId: string, dto: any): any;
    getMetrics(beneficiaryId: string): Promise<any[]>;
    addMetric(user: any, beneficiaryId: string, dto: any): any;
    getHealthEvents(beneficiaryId: string): Promise<any[]>;
    getProgressCards(beneficiaryId: string): Promise<({
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
    addProgressCard(user: any, beneficiaryId: string, dto: any): Promise<{
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
    getEducationTimeline(beneficiaryId: string): Promise<{
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
    exportEducationSummaryPdf(beneficiaryId: string): Promise<({
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
    getDocuments(user: any, ownerType: string, ownerId?: string): Promise<({
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
    createDocument(user: any, dto: any): Promise<{
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
    exportToExcel(user: any): Promise<{
        code: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
    getReportCampaigns(): Promise<({
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
    createReportCampaign(user: any, dto: any): Promise<{
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
    queueSponsorshipReminderEmail(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    addHealthEvent(user: any, beneficiaryId: string, dto: any): Promise<{
        status: string;
    }>;
    sendHealthEventToSponsors(user: any, eventId: string): Promise<{
        status: string;
    }>;
    getHealthTimeline(beneficiaryId: string): Promise<any[]>;
    exportHealthHistoryPdf(beneficiaryId: string): Promise<any[]>;
    getDocumentById(user: any, docId: string): Promise<{
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
    queueReportCampaignEmails(user: any, campaignId: string): Promise<{
        status: string;
        campaignId: string;
    }>;
    getDueSponsorships(windowDays?: number): any;
    getSponsorshipSummary(): Promise<number>;
    updateSponsorship(user: any, id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    }>;
    deleteSponsorship(id: string): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    }>;
    markSponsorshipPaid(user: any, id: string, body: any): any;
    sendSponsorshipReminderEmail(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    skipSponsorshipMonth(user: any, id: string): any;
    getSponsorshipHistory(id: string): Promise<({
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
    getUpdateWithBeneficiary(id: string): Promise<{
        beneficiary: {
            id: string;
            fullName: string;
        };
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
    getSponsorsForUpdate(beneficiaryId: string): Promise<({
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
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    })[]>;
    sendUpdateToSponsors(user: any, updateId: string): Promise<{
        success: boolean;
        dispatchCount: number;
    }>;
}
