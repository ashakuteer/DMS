import { PrismaService } from '../prisma/prisma.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
export declare class RemindersService {
    private prisma;
    private communicationLogService;
    private readonly logger;
    constructor(prisma: PrismaService, communicationLogService: CommunicationLogService);
    getDueReminders(): Promise<any>;
    markComplete(id: string, userId: string, userRole: string): Promise<any>;
    snooze(id: string, userId: string, userRole: string): Promise<any>;
    logReminderAction(params: {
        reminderId: string;
        donorId: string;
        donationId?: string;
        action: 'send_email' | 'send_whatsapp';
        userId: string;
        userRole: string;
    }): Promise<any>;
}
