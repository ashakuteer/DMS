import { ReminderTasksService } from './reminder-tasks.service';
export declare class ReminderTasksScheduler {
    private reminderTasksService;
    private readonly logger;
    constructor(reminderTasksService: ReminderTasksService);
    generateDailyReminders(): Promise<void>;
    processDailyAutoEmails(): Promise<void>;
    cleanupSnoozedReminders(): Promise<void>;
}
