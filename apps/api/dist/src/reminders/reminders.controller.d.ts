import { RemindersService } from './reminders.service';
export declare class RemindersController {
    private remindersService;
    constructor(remindersService: RemindersService);
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
    markComplete(id: string, req: any): Promise<{
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
    snooze(id: string, req: any): Promise<{
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
    logAction(id: string, body: {
        donorId: string;
        donationId?: string;
        action: 'send_email' | 'send_whatsapp';
    }, req: any): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        subject: string | null;
        donorId: string;
        donationId: string | null;
        templateId: string | null;
        taskId: string | null;
        channel: import(".prisma/client").$Enums.CommunicationChannel;
        type: import(".prisma/client").$Enums.CommunicationType;
        status: import(".prisma/client").$Enums.CommunicationStatus;
        contactMethod: string | null;
        outcome: string | null;
        recipient: string | null;
        messagePreview: string | null;
        errorMessage: string | null;
        sentById: string | null;
    }>;
}
