import { PrismaService } from "../../prisma/prisma.service";
export declare class AnalyticsRiskService {
    private prisma;
    constructor(prisma: PrismaService);
    computeAtRiskDonors(): Promise<{
        donorId: string;
        donorCode: string;
        donorName: string;
        lastDonationDate: Date;
        lastDonationAmount: number;
        daysSinceLastDonation: number;
        hasEmail: boolean;
        hasPhone: boolean;
    }[]>;
}
