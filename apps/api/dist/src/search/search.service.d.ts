import { PrismaService } from "../prisma/prisma.service";
export interface SearchFilters {
    donorCategory?: string;
    donorCity?: string;
    beneficiaryHomeType?: string;
    beneficiaryStatus?: string;
    beneficiaryAgeGroup?: string;
    beneficiarySponsored?: string;
    campaignStatus?: string;
    campaignStartFrom?: string;
    campaignStartTo?: string;
    entityType?: string;
}
export interface SearchResult {
    donors: Array<{
        id: string;
        donorCode: string;
        name: string;
        phone: string | null;
        email: string | null;
        city: string | null;
        category: string | null;
    }>;
    beneficiaries: Array<{
        id: string;
        code: string;
        fullName: string;
        homeType: string | null;
        status: string;
        age: number | null;
        sponsored: boolean;
    }>;
    donations: Array<{
        id: string;
        receiptNumber: string | null;
        amount: number;
        donorName: string;
        donorId: string;
        date: Date;
        type: string;
    }>;
    campaigns: Array<{
        id: string;
        name: string;
        status: string;
        goalAmount: number | null;
        startDate: Date | null;
    }>;
}
export declare class SearchService {
    private readonly prisma;
    private readonly DEFAULT_LIMIT;
    private readonly MAX_LIMIT;
    constructor(prisma: PrismaService);
    globalSearch(query: string, limit?: number, filters?: SearchFilters): Promise<SearchResult>;
    private getSafeLimit;
    private normalizeFilters;
    private clean;
    private toValidDate;
    private searchDonors;
    private searchBeneficiaries;
    private getAgeRange;
    private searchDonations;
    private searchCampaigns;
}
