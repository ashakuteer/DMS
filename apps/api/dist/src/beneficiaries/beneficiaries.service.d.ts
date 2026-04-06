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
    quickSearch(q: string): Promise<any>;
    findAll(user: any, options: any): Promise<{
        data: any;
        pagination: {
            total: any;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<any>;
    create(user: any, dto: any): Promise<any>;
    update(user: any, id: string, dto: any): any;
    delete(user: any, id: string, deleteReason?: string): Promise<{
        success: boolean;
    }>;
    restore(user: any, id: string): Promise<{
        success: boolean;
    }>;
    findArchived(user: any, search?: string, page?: number, limit?: number): Promise<{
        data: any;
        pagination: {
            total: any;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    updatePhoto(id: string, url: string | null, path?: string | null): any;
    getSponsors(beneficiaryId: string): Promise<any>;
    addSponsor(user: any, beneficiaryId: string, dto: any): any;
    getDonorSponsorships(donorId: string): Promise<any>;
    getSponsorshipsByBeneficiary(beneficiaryId: string): Promise<any>;
    sendUpdateToSponsor(userId: string, sponsorshipId: string): Promise<{
        success: boolean;
        donorName: string;
        beneficiaryName: any;
        results: {
            whatsapp?: string;
            email?: string;
        };
        latestUpdateTitle: any;
    }>;
    createSponsorshipForDonor(user: any, dto: any): Promise<any>;
    getUpdates(beneficiaryId: string): Promise<any>;
    addUpdate(user: any, beneficiaryId: string, dto: any): Promise<any>;
    deleteUpdate(updateId: string): Promise<{
        success: boolean;
    }>;
    markDispatchCopied(id: string): Promise<any>;
    getTimelineEvents(beneficiaryId: string): any;
    addTimelineEvent(beneficiaryId: string, dto: any): any;
    getMetrics(beneficiaryId: string): Promise<any[]>;
    addMetric(user: any, beneficiaryId: string, dto: any): any;
    getHealthEvents(beneficiaryId: string): Promise<any[]>;
    getProgressCards(beneficiaryId: string): Promise<any>;
    addProgressCard(user: any, beneficiaryId: string, dto: any): Promise<any>;
    getEducationTimeline(beneficiaryId: string): Promise<any>;
    exportEducationSummaryPdf(beneficiaryId: string): Promise<any>;
    getDocuments(user: any, ownerType: string, ownerId?: string): Promise<any>;
    createDocument(user: any, dto: any): Promise<any>;
    exportToExcel(user: any): Promise<any>;
    getReportCampaigns(): Promise<any>;
    createReportCampaign(user: any, dto: any): Promise<any>;
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
    getDocumentById(user: any, docId: string): Promise<any>;
    queueReportCampaignEmails(user: any, campaignId: string): Promise<{
        status: string;
        campaignId: string;
    }>;
    getDueSponsorships(windowDays?: number): any;
    getSponsorshipSummary(): Promise<any>;
    updateSponsorship(user: any, id: string, dto: any): Promise<any>;
    deleteSponsorship(id: string): Promise<any>;
    markSponsorshipPaid(user: any, id: string, body: any): any;
    sendSponsorshipReminderEmail(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    skipSponsorshipMonth(user: any, id: string): any;
    getSponsorshipHistory(id: string): Promise<any>;
    getUpdateWithBeneficiary(id: string): Promise<any>;
    getSponsorsForUpdate(beneficiaryId: string): Promise<any>;
    sendUpdateToSponsors(user: any, updateId: string): Promise<{
        success: boolean;
        dispatchCount: any;
    }>;
}
