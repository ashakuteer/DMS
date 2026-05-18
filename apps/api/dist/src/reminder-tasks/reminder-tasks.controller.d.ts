import { Role } from '@prisma/client';
import { ReminderTasksService } from './reminder-tasks.service';
interface UserContext {
    id: string;
    email: string;
    role: Role;
}
export declare class ReminderTasksController {
    private reminderTasksService;
    constructor(reminderTasksService: ReminderTasksService);
    getReminders(user: UserContext, filter?: 'today' | 'week' | 'month' | 'overdue'): Promise<({
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            primaryPhoneCode: string;
            whatsappPhone: string;
            whatsappPhoneCode: string;
            personalEmail: string;
            officialEmail: string;
        };
        sourceOccasion: {
            relatedPersonName: string;
        };
        sourceFamilyMember: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        type: import(".prisma/client").$Enums.ReminderTaskType;
        status: import(".prisma/client").$Enums.ReminderTaskStatus;
        title: string;
        dueDate: Date;
        completedAt: Date | null;
        offsetDays: number;
        createdByUserId: string | null;
        snoozedUntil: Date | null;
        sourceOccasionId: string | null;
        sourceFamilyId: string | null;
        sourcePledgeId: string | null;
        autoEmailSent: boolean;
        autoEmailSentAt: Date | null;
    })[]>;
    getStats(): Promise<{
        today: number;
        week: number;
        month: number;
        overdue: number;
    }>;
    markDone(user: UserContext, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        type: import(".prisma/client").$Enums.ReminderTaskType;
        status: import(".prisma/client").$Enums.ReminderTaskStatus;
        title: string;
        dueDate: Date;
        completedAt: Date | null;
        offsetDays: number;
        createdByUserId: string | null;
        snoozedUntil: Date | null;
        sourceOccasionId: string | null;
        sourceFamilyId: string | null;
        sourcePledgeId: string | null;
        autoEmailSent: boolean;
        autoEmailSentAt: Date | null;
    }>;
    snooze(user: UserContext, id: string, body: {
        days: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        donorId: string;
        type: import(".prisma/client").$Enums.ReminderTaskType;
        status: import(".prisma/client").$Enums.ReminderTaskStatus;
        title: string;
        dueDate: Date;
        completedAt: Date | null;
        offsetDays: number;
        createdByUserId: string | null;
        snoozedUntil: Date | null;
        sourceOccasionId: string | null;
        sourceFamilyId: string | null;
        sourcePledgeId: string | null;
        autoEmailSent: boolean;
        autoEmailSentAt: Date | null;
    }>;
    generateReminders(): Promise<{
        message: string;
        count: number;
    }>;
    logWhatsAppClick(user: UserContext, id: string): Promise<{
        phone: string;
        message: string;
        donorName: string;
    }>;
    sendEmail(user: UserContext, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    processAutoEmails(): Promise<{
        sent: number;
        failed: number;
        message: string;
    }>;
}
export {};
