import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../../email/email.service";
export declare class BeneficiaryBirthdayProcessor {
    private prisma;
    private emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
    process(): Promise<{
        queued: number;
        sent: number;
        failed: number;
        errors: any[];
    }>;
}
