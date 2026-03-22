import { PrismaService } from '../prisma/prisma.service';
export declare class TaskSchedulerService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    runDailyTaskGeneration(): Promise<void>;
    generateBirthdayTasks(): Promise<number>;
    generatePledgeFollowUpTasks(): Promise<number>;
    generateDonationFollowUpTasks(): Promise<number>;
}
