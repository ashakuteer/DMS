import { PrismaService } from "../prisma/prisma.service";
export declare class DashboardStatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        totalDonationsFY: any;
        donationsThisMonth: any;
        activeDonors: any;
        totalBeneficiaries: any;
    }>;
    getMonthlyDonorTarget(): Promise<{
        raised: any;
        count: any;
        totalMonthlyDonors: any;
        target: number;
        remaining: number;
        progressPct: number;
        achieved: boolean;
    }>;
    getDonationModeSplit(): Promise<any>;
    getTopDonors(limit?: number): Promise<any>;
    getRecentDonations(limit?: number): Promise<any>;
}
