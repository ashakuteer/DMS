import { PrismaService } from "../../prisma/prisma.service";
export declare class AnalyticsChartsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getMonthlyDonationSeries(): Promise<{
        monthlyDonations: any[];
        donationsByType: any[];
        donationsByHome: any[];
        sponsorshipsDue: any[];
    }>;
    private fetchMonthlyDonations;
    private fetchDonationsByType;
    private fetchDonationsByHome;
    private fetchSponsorshipsDue;
}
