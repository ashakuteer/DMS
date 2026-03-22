import { PrismaService } from "../prisma/prisma.service";
export declare class DashboardInsightsService {
    private readonly prisma;
    private readonly logger;
    private readonly cache;
    private readonly CACHE_TTL_MS;
    constructor(prisma: PrismaService);
    private getCached;
    private setCached;
    getAIInsights(): Promise<any[]>;
    getDonorInsights(donorId: string): Promise<{
        avgDonation: number;
        frequency: string;
        lastDonationDaysAgo: number;
        preferredMode: string;
        preferredDonationType: string;
        mostSponsoredHome: string;
        sponsoredBeneficiariesCount: number;
        totalDonations: number;
        donationCount: number;
    }>;
    getAdminInsights(): Promise<any[]>;
    getInsightCards(): Promise<any[]>;
}
