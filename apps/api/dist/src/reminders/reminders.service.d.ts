import { PrismaService } from '../prisma/prisma.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
export declare class RemindersService {
    private prisma;
    private communicationLogService;
    private readonly logger;
    constructor(prisma: PrismaService, communicationLogService: CommunicationLogService);
    getDueReminders(): Promise<({
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
        };
        donation: {
            id: string;
            receiptNumber: string;
            donationAmount: import("@prisma/client/runtime/library").Decimal;
            donationDate: Date;
        };
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        donationId: string | null;
        type: string;
        status: import(".prisma/client").$Enums.ReminderStatus;
        description: string | null;
        createdById: string;
        title: string;
        dueDate: Date;
        completedAt: Date | null;
    })[]>;
    markComplete(id: string, userId: string, userRole: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        donationId: string | null;
        type: string;
        status: import(".prisma/client").$Enums.ReminderStatus;
        description: string | null;
        createdById: string;
        title: string;
        dueDate: Date;
        completedAt: Date | null;
    }>;
    snooze(id: string, userId: string, userRole: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        donationId: string | null;
        type: string;
        status: import(".prisma/client").$Enums.ReminderStatus;
        description: string | null;
        createdById: string;
        title: string;
        dueDate: Date;
        completedAt: Date | null;
    }>;
    logReminderAction(params: {
        reminderId: string;
        donorId: string;
        donationId?: string;
        action: 'send_email' | 'send_whatsapp';
        userId: string;
        userRole: string;
    }): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        subject: string | null;
        donorId: string;
        donationId: string | null;
        templateId: string | null;
        channel: import(".prisma/client").$Enums.CommunicationChannel;
        type: import(".prisma/client").$Enums.CommunicationType;
        status: import(".prisma/client").$Enums.CommunicationStatus;
        recipient: string | null;
        messagePreview: string | null;
        errorMessage: string | null;
        sentById: string | null;
    }>;
}
