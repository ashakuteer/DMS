import { PrismaService } from '../prisma/prisma.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { CampaignStatus, HomeType } from '@prisma/client';
interface CreateCampaignDto {
    name: string;
    description?: string;
    goalAmount?: number;
    startDate?: string;
    endDate?: string;
    status?: CampaignStatus;
    homeTypes?: HomeType[];
}
interface UpdateCampaignDto extends Partial<CreateCampaignDto> {
}
interface UserContext {
    id: string;
    role: string;
    email: string;
}
export declare class CampaignsService {
    private prisma;
    private emailJobsService;
    private communicationLogService;
    private orgProfileService;
    private readonly logger;
    constructor(prisma: PrismaService, emailJobsService: EmailJobsService, communicationLogService: CommunicationLogService, orgProfileService: OrganizationProfileService);
    findAll(status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateCampaignDto, user: UserContext): Promise<any>;
    update(id: string, dto: UpdateCampaignDto): Promise<any>;
    remove(id: string): Promise<any>;
    addBeneficiaries(campaignId: string, beneficiaryIds: string[], notes?: string): Promise<any[]>;
    removeBeneficiary(campaignId: string, beneficiaryId: string): Promise<any>;
    getBeneficiaries(campaignId: string): Promise<any>;
    createUpdate(campaignId: string, dto: {
        title: string;
        content: string;
        photoUrls?: string[];
    }, user: UserContext): Promise<any>;
    getUpdates(campaignId: string): Promise<any>;
    deleteUpdate(campaignId: string, updateId: string): Promise<any>;
    getDonors(campaignId: string): Promise<{
        donor: any;
        totalAmount: number;
        donationCount: number;
        lastDonation: Date;
        firstDonation: Date;
    }[]>;
    getAnalytics(campaignId: string): Promise<{
        summary: {
            totalRaised: any;
            goalAmount: number;
            progressPercent: number;
            totalDonations: any;
            uniqueDonors: number;
            avgDonation: number;
            remaining: number;
        };
        monthlyDonations: {
            month: string;
            amount: number;
            count: number;
        }[];
        cumulativeProgress: {
            month: string;
            cumulative: number;
        }[];
        byType: {
            type: string;
            amount: number;
            count: number;
        }[];
        byMode: {
            mode: string;
            amount: number;
            count: number;
        }[];
        byHome: {
            home: string;
            amount: number;
            count: number;
        }[];
    }>;
    getTimeline(id: string): Promise<any[]>;
    generateWhatsAppAppeal(campaign: any): Promise<string>;
    getWhatsAppAppeal(id: string): Promise<{
        text: string;
    }>;
    sendEmailAppeal(id: string, donorIds: string[], user: UserContext): Promise<{
        queued: number;
        skipped: number;
        total: any;
    }>;
    broadcastUpdate(campaignId: string, updateId: string, donorIds: string[], user: UserContext): Promise<{
        queued: number;
        skipped: number;
        total: any;
    }>;
    logWhatsAppBroadcast(campaignId: string, updateId: string, donorId: string, user: UserContext): Promise<{
        success: boolean;
    }>;
    getUpdateWhatsAppText(campaignId: string, updateId: string): Promise<{
        text: string;
    }>;
    getUpdateDispatches(campaignId: string, updateId: string): Promise<any>;
    private getCampaignTotalRaised;
}
export {};
