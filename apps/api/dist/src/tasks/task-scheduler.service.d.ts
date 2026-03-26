import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class TaskSchedulerService implements OnModuleInit {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    runDailyTaskGeneration(): Promise<void>;
    private todayBounds;
    private autoWhatsApp;
    private futureDueDate;
    private nextAnnualDate;
    generateDonorDobBirthdayTasks(): Promise<number>;
    generateBirthdayTasks(): Promise<number>;
    generateFamilyMemberBirthdayTasks(): Promise<number>;
    generateAnniversaryTasks(): Promise<number>;
    generateRemembranceTasks(): Promise<number>;
    generatePledgeFollowUpTasks(): Promise<number>;
    generateDonationFollowUpTasks(): Promise<number>;
    generateSponsorUpdateTasks(): Promise<number>;
    generateSmartDonationReminderTasks(): Promise<number>;
}
