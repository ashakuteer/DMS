import { PrismaService } from '../prisma/prisma.service';
export declare class EmailLogService {
    private prisma;
    private logger;
    constructor(prisma: PrismaService);
    logEmail(donorId: string, toEmail: string, subject: string, success: boolean, messageId?: string, errorMessage?: string, metadata?: {
        subType?: string;
        relatedId?: string;
        offsetDays?: number | null;
    }): Promise<void>;
}
