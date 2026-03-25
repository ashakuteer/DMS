import { PrismaService } from '../prisma/prisma.service';
export declare class TaskSchedulerService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    runDailyTaskGeneration(): Promise<void>;
    private todayBounds;
    private autoWhatsApp;
    private futureDueDate;
    generateBirthdayTasks(): Promise<number>;
    generateAnniversaryTasks(): Promise<number>;
    generateRemembranceTasks(): Promise<number>;
    generatePledgeFollowUpTasks(): Promise<number>;
    generateDonationFollowUpTasks(): Promise<number>;
    generateSponsorUpdateTasks(): Promise<number>;
    generateSmartDonationReminderTasks(): Promise<number>;
}
