import { CampaignsService } from './campaigns.service';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
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
                id: string;
                code: string;
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
            donorId: string;
            createdById: string;
            donationDate: Date;
            donationAmount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            donationType: import(".prisma/client").$Enums.DonationType;
            donationMode: import(".prisma/client").$Enums.DonationMode | null;
            donationPurpose: import(".prisma/client").$Enums.DonationPurpose | null;
            donationCategory: string | null;
            donationOccasion: string | null;
            scheduleType: string | null;
            transactionId: string | null;
            remarks: string | null;
            quantity: import("@prisma/client/runtime/library").Decimal | null;
            unit: string | null;
            itemDescription: string | null;
            kindCategory: import(".prisma/client").$Enums.KindCategory | null;
            kindDescription: string | null;
            donationHomeType: import(".prisma/client").$Enums.DonationHomeType | null;
            homeId: string | null;
            visitedHome: boolean;
            servedFood: boolean;
            receiptNumber: string | null;
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
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.CampaignStatus;
        description: string | null;
        createdById: string;
        currency: string;
        isDeleted: boolean;
        deletedAt: Date | null;
        homeTypes: import(".prisma/client").$Enums.HomeType[];
    }>;
    getTimeline(id: string): Promise<any[]>;
    getWhatsAppAppeal(id: string): Promise<{
        text: string;
    }>;
    getBeneficiaries(id: string): Promise<({
        beneficiary: {
            id: string;
            code: string;
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
    getUpdates(id: string): Promise<({
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
    getDonors(id: string): Promise<{
        donor: any;
        totalAmount: number;
        donationCount: number;
        lastDonation: Date;
        firstDonation: Date;
    }[]>;
    getAnalytics(id: string): Promise<{
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
    create(body: {
        name: string;
        description?: string;
        goalAmount?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
        homeTypes?: string[];
    }, user: any): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.CampaignStatus;
        description: string | null;
        createdById: string;
        currency: string;
        isDeleted: boolean;
        deletedAt: Date | null;
        goalAmount: import("@prisma/client/runtime/library").Decimal | null;
        homeTypes: import(".prisma/client").$Enums.HomeType[];
    }>;
    update(id: string, body: {
        name?: string;
        description?: string;
        goalAmount?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
        homeTypes?: string[];
    }): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.CampaignStatus;
        description: string | null;
        createdById: string;
        currency: string;
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
        startDate: Date | null;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.CampaignStatus;
        description: string | null;
        createdById: string;
        currency: string;
        isDeleted: boolean;
        deletedAt: Date | null;
        goalAmount: import("@prisma/client/runtime/library").Decimal | null;
        homeTypes: import(".prisma/client").$Enums.HomeType[];
    }>;
    addBeneficiaries(id: string, body: {
        beneficiaryIds: string[];
        notes?: string;
    }): Promise<any[]>;
    removeBeneficiary(id: string, beneficiaryId: string): Promise<{
        id: string;
        createdAt: Date;
        campaignId: string;
        notes: string | null;
        beneficiaryId: string;
    }>;
    createUpdate(id: string, body: {
        title: string;
        content: string;
        photoUrls?: string[];
    }, user: any): Promise<{
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
    deleteUpdate(id: string, updateId: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        createdById: string;
        campaignId: string;
        title: string;
        photoUrls: string[];
    }>;
    sendEmailAppeal(id: string, body: {
        donorIds: string[];
    }, user: any): Promise<{
        queued: number;
        skipped: number;
        total: number;
    }>;
    broadcastUpdate(id: string, updateId: string, body: {
        donorIds: string[];
    }, user: any): Promise<{
        queued: number;
        skipped: number;
        total: number;
    }>;
    getUpdateWhatsAppText(id: string, updateId: string): Promise<{
        text: string;
    }>;
    logWhatsAppBroadcast(id: string, updateId: string, body: {
        donorId: string;
    }, user: any): Promise<{
        success: boolean;
    }>;
    getUpdateDispatches(id: string, updateId: string): Promise<({
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
        donorId: string;
        channel: import(".prisma/client").$Enums.SponsorDispatchChannel;
        status: import(".prisma/client").$Enums.SponsorDispatchStatus;
        sentAt: Date | null;
        campaignUpdateId: string;
    })[]>;
}
