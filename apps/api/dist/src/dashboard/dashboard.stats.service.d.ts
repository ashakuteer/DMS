import { PrismaService } from "../prisma/prisma.service";
export declare class DashboardStatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        totalDonationsFY: number;
        donationsThisMonth: number;
        activeDonors: number;
        totalBeneficiaries: number;
    }>;
    getMonthlyDonorTarget(): Promise<{
        raised: number;
        count: number;
        totalMonthlyDonors: number;
        target: number;
        remaining: number;
        progressPct: number;
        achieved: boolean;
    }>;
    getDonationModeSplit(): Promise<{
        mode: import(".prisma/client").$Enums.DonationMode;
        amount: number;
        count: number;
    }[]>;
    getTopDonors(limit?: number): Promise<{
        donorId: string;
        donorCode: string;
        name: string;
        category: import(".prisma/client").$Enums.DonorCategory;
        totalAmount: number;
        donationCount: number;
    }[]>;
    getRecentDonations(limit?: number): Promise<{
        id: string;
        donorId: string;
        donorCode: string;
        donorName: string;
        amount: number;
        date: Date;
        mode: import(".prisma/client").$Enums.DonationMode;
        type: import(".prisma/client").$Enums.DonationType;
        receiptNumber: string;
    }[]>;
}
