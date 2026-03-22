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
    findAll(status?: string): Promise<{
        id: string;
        name: string;
        description: string;
        startDate: Date;
        endDate: Date;
        goalAmount: number;
        currency: string;
        status: import(".prisma/client").$Enums.CampaignStatus;
        homeTypes: import(".prisma/client").$Enums.HomeType[];
        createdBy: {
            name: string;
            id: string;
        };
        createdAt: Date;
        updatedAt: Date;
        totalRaised: number;
        donorCount: number;
        donationCount: number;
        progressPercent: number;
        beneficiaryCount: number;
        updateCount: number;
    }[]>;
    findOne(id: string): Promise<{
        goalAmount: number;
        totalRaised: number;
        donorCount: number;
        donationCount: number;
        progressPercent: number;
        beneficiaries: ({
            beneficiary: {
                code: string;
                id: string;
                status: import(".prisma/client").$Enums.BeneficiaryStatus;
                fullName: string;
                homeType: import(".prisma/client").$Enums.HomeType;
                protectPrivacy: boolean;
                photoUrl: string;
            };
        } & {
            id: string;
            createdAt: Date;
            campaignId: string;
            notes: string | null;
            beneficiaryId: string;
        })[];
        donations: ({
            donor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            receiptNumber: string | null;
            donationAmount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            donationDate: Date;
            donationMode: import(".prisma/client").$Enums.DonationMode | null;
            donationType: import(".prisma/client").$Enums.DonationType;
            kindDescription: string | null;
            donorId: string;
            createdById: string;
            donationPurpose: import(".prisma/client").$Enums.DonationPurpose | null;
            transactionId: string | null;
            remarks: string | null;
            quantity: import("@prisma/client/runtime/library").Decimal | null;
            unit: string | null;
            itemDescription: string | null;
            kindCategory: import(".prisma/client").$Enums.KindCategory | null;
            donationHomeType: import(".prisma/client").$Enums.DonationHomeType | null;
            homeId: string | null;
            visitedHome: boolean;
            servedFood: boolean;
            financialYear: string | null;
            receiptPdfUrl: string | null;
            attachmentUrl: string | null;
            isDeleted: boolean;
            deletedAt: Date | null;
            campaignId: string | null;
        })[];
        createdBy: {
            name: string;
            id: string;
        };
        updates: ({
            _count: {
                dispatches: number;
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
            campaignId: string;
            title: string;
            photoUrls: string[];
        })[];
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.CampaignStatus;
        description: string | null;
        createdById: string;
        isDeleted: boolean;
        deletedAt: Date | null;
        homeTypes: import(".prisma/client").$Enums.HomeType[];
    }>;
    create(dto: CreateCampaignDto, user: UserContext): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.CampaignStatus;
        description: string | null;
        createdById: string;
        isDeleted: boolean;
        deletedAt: Date | null;
        goalAmount: import("@prisma/client/runtime/library").Decimal | null;
        homeTypes: import(".prisma/client").$Enums.HomeType[];
    }>;
    update(id: string, dto: UpdateCampaignDto): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.CampaignStatus;
        description: string | null;
        createdById: string;
        isDeleted: boolean;
        deletedAt: Date | null;
        goalAmount: import("@prisma/client/runtime/library").Decimal | null;
        homeTypes: import(".prisma/client").$Enums.HomeType[];
    }>;
    remove(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.CampaignStatus;
        description: string | null;
        createdById: string;
        isDeleted: boolean;
        deletedAt: Date | null;
        goalAmount: import("@prisma/client/runtime/library").Decimal | null;
        homeTypes: import(".prisma/client").$Enums.HomeType[];
    }>;
    addBeneficiaries(campaignId: string, beneficiaryIds: string[], notes?: string): Promise<any[]>;
    removeBeneficiary(campaignId: string, beneficiaryId: string): Promise<{
        id: string;
        createdAt: Date;
        campaignId: string;
        notes: string | null;
        beneficiaryId: string;
    }>;
    getBeneficiaries(campaignId: string): Promise<({
        beneficiary: {
            code: string;
            id: string;
            status: import(".prisma/client").$Enums.BeneficiaryStatus;
            fullName: string;
            homeType: import(".prisma/client").$Enums.HomeType;
            protectPrivacy: boolean;
            photoUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        campaignId: string;
        notes: string | null;
        beneficiaryId: string;
    })[]>;
    createUpdate(campaignId: string, dto: {
        title: string;
        content: string;
        photoUrls?: string[];
    }, user: UserContext): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        createdById: string;
        campaignId: string;
        title: string;
        photoUrls: string[];
    }>;
    getUpdates(campaignId: string): Promise<({
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        createdById: string;
        campaignId: string;
        title: string;
        photoUrls: string[];
    })[]>;
    deleteUpdate(campaignId: string, updateId: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        createdById: string;
        campaignId: string;
        title: string;
        photoUrls: string[];
    }>;
    getDonors(campaignId: string): Promise<{
        donor: any;
        totalAmount: number;
        donationCount: number;
        lastDonation: Date;
        firstDonation: Date;
    }[]>;
    getAnalytics(campaignId: string): Promise<{
        summary: {
            totalRaised: number;
            goalAmount: number;
            progressPercent: number;
            totalDonations: number;
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
        total: number;
    }>;
    broadcastUpdate(campaignId: string, updateId: string, donorIds: string[], user: UserContext): Promise<{
        queued: number;
        skipped: number;
        total: number;
    }>;
    logWhatsAppBroadcast(campaignId: string, updateId: string, donorId: string, user: UserContext): Promise<{
        success: boolean;
    }>;
    getUpdateWhatsAppText(campaignId: string, updateId: string): Promise<{
        text: string;
    }>;
    getUpdateDispatches(campaignId: string, updateId: string): Promise<({
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            personalEmail: string;
            officialEmail: string;
        };
    } & {
        error: string | null;
        id: string;
        createdAt: Date;
        channel: import(".prisma/client").$Enums.SponsorDispatchChannel;
        status: import(".prisma/client").$Enums.SponsorDispatchStatus;
        donorId: string;
        sentAt: Date | null;
        campaignUpdateId: string;
    })[]>;
    private getCampaignTotalRaised;
}
export {};
