import { CampaignsService } from './campaigns.service';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    findAll(status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    getTimeline(id: string): Promise<any[]>;
    getWhatsAppAppeal(id: string): Promise<{
        text: string;
    }>;
    getBeneficiaries(id: string): Promise<any>;
    getUpdates(id: string): Promise<any>;
    getDonors(id: string): Promise<{
        donor: any;
        totalAmount: number;
        donationCount: number;
        lastDonation: Date;
        firstDonation: Date;
    }[]>;
    getAnalytics(id: string): Promise<{
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
    create(body: {
        name: string;
        description?: string;
        goalAmount?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
        homeTypes?: string[];
    }, user: any): Promise<any>;
    update(id: string, body: {
        name?: string;
        description?: string;
        goalAmount?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
        homeTypes?: string[];
    }): Promise<any>;
    remove(id: string): Promise<any>;
    addBeneficiaries(id: string, body: {
        beneficiaryIds: string[];
        notes?: string;
    }): Promise<any[]>;
    removeBeneficiary(id: string, beneficiaryId: string): Promise<any>;
    createUpdate(id: string, body: {
        title: string;
        content: string;
        photoUrls?: string[];
    }, user: any): Promise<any>;
    deleteUpdate(id: string, updateId: string): Promise<any>;
    sendEmailAppeal(id: string, body: {
        donorIds: string[];
    }, user: any): Promise<{
        queued: number;
        skipped: number;
        total: any;
    }>;
    broadcastUpdate(id: string, updateId: string, body: {
        donorIds: string[];
    }, user: any): Promise<{
        queued: number;
        skipped: number;
        total: any;
    }>;
    getUpdateWhatsAppText(id: string, updateId: string): Promise<{
        text: string;
    }>;
    logWhatsAppBroadcast(id: string, updateId: string, body: {
        donorId: string;
    }, user: any): Promise<{
        success: boolean;
    }>;
    getUpdateDispatches(id: string, updateId: string): Promise<any>;
}
