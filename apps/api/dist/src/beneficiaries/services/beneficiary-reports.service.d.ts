import { PrismaService } from "../../prisma/prisma.service";
export declare class BeneficiaryReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getReportCampaigns(): Promise<any>;
    createReportCampaign(user: any, dto: any): Promise<any>;
    exportToExcel(user: any): Promise<any>;
    queueReportCampaignEmails(user: any, campaignId: string): Promise<{
        status: string;
        campaignId: string;
    }>;
}
