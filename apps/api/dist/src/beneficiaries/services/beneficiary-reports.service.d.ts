import { PrismaService } from "../../prisma/prisma.service";
export declare class BeneficiaryReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getReportCampaigns(): Promise<({
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ReportCampaignType;
        status: import(".prisma/client").$Enums.ReportCampaignStatus;
        createdById: string;
        notes: string | null;
        sentAt: Date | null;
        documentId: string | null;
        periodStart: Date;
        periodEnd: Date;
        target: import(".prisma/client").$Enums.ReportTarget;
        customDonorIds: string[];
        emailsSent: number;
    })[]>;
    createReportCampaign(user: any, dto: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ReportCampaignType;
        status: import(".prisma/client").$Enums.ReportCampaignStatus;
        createdById: string;
        notes: string | null;
        sentAt: Date | null;
        documentId: string | null;
        periodStart: Date;
        periodEnd: Date;
        target: import(".prisma/client").$Enums.ReportTarget;
        customDonorIds: string[];
        emailsSent: number;
    }>;
    exportToExcel(user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        status: import(".prisma/client").$Enums.BeneficiaryStatus;
        createdById: string;
        isDeleted: boolean;
        deletedAt: Date;
        gender: import(".prisma/client").$Enums.Gender;
        category: import(".prisma/client").$Enums.BeneficiaryCategory;
        dobDay: number;
        dobMonth: number;
        fullName: string;
        homeType: import(".prisma/client").$Enums.HomeType;
        dobYear: number;
        approxAge: number;
        joinDate: Date;
        heightCmAtJoin: number;
        weightKgAtJoin: import("@prisma/client/runtime/library").Decimal;
        educationClassOrRole: string;
        schoolOrCollege: string;
        healthNotes: string;
        currentHealthStatus: string;
        background: string;
        hobbies: string;
        dreamCareer: string;
        favouriteSubject: string;
        favouriteGame: string;
        favouriteActivityAtHome: string;
        bestFriend: string;
        sourceOfPrideOrHappiness: string;
        funFact: string;
        additionalNotes: string;
        protectPrivacy: boolean;
        photoUrl: string;
        photoPath: string;
    }[]>;
    queueReportCampaignEmails(user: any, campaignId: string): Promise<{
        status: string;
        campaignId: string;
    }>;
}
