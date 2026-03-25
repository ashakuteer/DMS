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
    getReminders(user: UserContext, filter?: 'today' | 'week' | 'month' | 'overdue'): Promise<any>;
    getStats(): Promise<{
        today: any;
        week: any;
        month: any;
        overdue: any;
    }>;
    markDone(user: UserContext, id: string): Promise<any>;
    snooze(user: UserContext, id: string, body: {
        days: number;
    }): Promise<any>;
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
