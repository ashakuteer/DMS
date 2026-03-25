import { PrismaService } from "../../prisma/prisma.service";
export declare class BeneficiaryRemindersService {
    private prisma;
    constructor(prisma: PrismaService);
    getDueSponsorships(): Promise<any>;
    queueSponsorshipReminderEmail(sponsorshipId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
