import { PrismaService } from "../prisma/prisma.service";
import { CommunicationLogService } from "../communication-log/communication-log.service";
export declare class DashboardActionsService {
    private readonly prisma;
    private readonly communicationLogService;
    private readonly logger;
    private readonly cache;
    private readonly CACHE_TTL_MS;
    constructor(prisma: PrismaService, communicationLogService: CommunicationLogService);
    private getCached;
    private setCached;
    getStaffActions(): Promise<{
        followUpDonors: {
            id: string;
            name: string;
            donorCode: string;
            phone: string;
            daysSinceLastDonation: number;
            healthStatus: "AT_RISK" | "DORMANT";
            bestTimeToContact: string;
            followUpReason: string;
        }[];
        atRiskCount: number;
        dormantCount: number;
        bestCallTime: {
            day: string;
            slot: string;
        };
        summary: {
            total: number;
            atRisk: number;
            dormant: number;
        };
    }>;
    private _computeStaffActions;
    getDailyActions(): Promise<{
        todaySpecialDays: {
            birthdays: any[];
            anniversaries: any[];
            memorials: any[];
            other: any[];
        };
        upcomingSpecialDays: {
            next7Days: any[];
            next15Days: any[];
        };
        reminders: {
            today: any;
            overdue: any;
            upcoming7: any;
            upcoming15: any;
        };
        pledges: {
            overdue: any;
            dueToday: any;
            upcoming7: any;
        };
        followUps: {
            dueToday: any;
            overdue: any;
        };
        atRiskDonors: any;
        beneficiaryBirthdays: {
            today: any[];
            upcoming7: any[];
        };
        sponsorshipsDue: any[];
        stats: {
            todayTotal: any;
            upcoming7Total: any;
            upcoming15Total: any;
            overdueTotal: any;
            pledgesDue: any;
            followUpsDueToday: any;
            overdueFollowUps: any;
            atRiskCount: any;
            beneficiaryBirthdaysCount: number;
            sponsorshipsDueCount: number;
        };
    }>;
    markActionDone(user: any, params: {
        donorId: string;
        actionType: string;
        description: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    snoozeAction(user: any, params: {
        donorId: string;
        actionType: string;
        description: string;
        days: number;
    }): Promise<{
        success: boolean;
        message: string;
        snoozeUntil: Date;
    }>;
}
