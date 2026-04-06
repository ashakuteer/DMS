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
            today: {
                id: any;
                type: any;
                donorId: any;
                donorName: string;
                donorCode: any;
                title: any;
                dueDate: any;
                status: any;
                offsetDays: any;
                pledgeId: any;
                pledgeType: any;
                pledgeAmount: any;
                pledgeQuantity: any;
                daysOverdue: number;
                daysUntil: number;
                donor: any;
            }[];
            overdue: {
                id: any;
                type: any;
                donorId: any;
                donorName: string;
                donorCode: any;
                title: any;
                dueDate: any;
                status: any;
                offsetDays: any;
                pledgeId: any;
                pledgeType: any;
                pledgeAmount: any;
                pledgeQuantity: any;
                daysOverdue: number;
                daysUntil: number;
                donor: any;
            }[];
            upcoming7: {
                id: any;
                type: any;
                donorId: any;
                donorName: string;
                donorCode: any;
                title: any;
                dueDate: any;
                status: any;
                offsetDays: any;
                pledgeId: any;
                pledgeType: any;
                pledgeAmount: any;
                pledgeQuantity: any;
                daysOverdue: number;
                daysUntil: number;
                donor: any;
            }[];
            upcoming15: {
                id: any;
                type: any;
                donorId: any;
                donorName: string;
                donorCode: any;
                title: any;
                dueDate: any;
                status: any;
                offsetDays: any;
                pledgeId: any;
                pledgeType: any;
                pledgeAmount: any;
                pledgeQuantity: any;
                daysOverdue: number;
                daysUntil: number;
                donor: any;
            }[];
        };
        pledges: {
            overdue: {
                id: any;
                donorId: any;
                donorName: string;
                donorCode: any;
                pledgeType: any;
                amount: any;
                quantity: any;
                currency: any;
                expectedFulfillmentDate: any;
                notes: any;
                daysOverdue: number;
                daysUntil: number;
                donor: any;
            }[];
            dueToday: {
                id: any;
                donorId: any;
                donorName: string;
                donorCode: any;
                pledgeType: any;
                amount: any;
                quantity: any;
                currency: any;
                expectedFulfillmentDate: any;
                notes: any;
                daysOverdue: number;
                daysUntil: number;
                donor: any;
            }[];
            upcoming7: {
                id: any;
                donorId: any;
                donorName: string;
                donorCode: any;
                pledgeType: any;
                amount: any;
                quantity: any;
                currency: any;
                expectedFulfillmentDate: any;
                notes: any;
                daysOverdue: number;
                daysUntil: number;
                donor: any;
            }[];
        };
        followUps: {
            dueToday: {
                id: any;
                type: any;
                donorId: any;
                donorName: string;
                donorCode: any;
                title: any;
                dueDate: any;
                status: any;
                offsetDays: any;
                pledgeId: any;
                pledgeType: any;
                pledgeAmount: any;
                pledgeQuantity: any;
                daysOverdue: number;
                daysUntil: number;
                donor: any;
            }[];
            overdue: {
                id: any;
                type: any;
                donorId: any;
                donorName: string;
                donorCode: any;
                title: any;
                dueDate: any;
                status: any;
                offsetDays: any;
                pledgeId: any;
                pledgeType: any;
                pledgeAmount: any;
                pledgeQuantity: any;
                daysOverdue: number;
                daysUntil: number;
                donor: any;
            }[];
        };
        atRiskDonors: {
            id: string;
            donorId: string;
            donorName: string;
            donorCode: string;
            healthScore: number;
            healthStatus: import("@prisma/client").$Enums.HealthStatus;
            donor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
                primaryPhone: string;
                whatsappPhone: string;
                personalEmail: string;
                officialEmail: string;
                healthScore: number;
                healthStatus: import("@prisma/client").$Enums.HealthStatus;
            };
        }[];
        beneficiaryBirthdays: {
            today: any[];
            upcoming7: any[];
        };
        sponsorshipsDue: any[];
        stats: {
            todayTotal: number;
            upcoming7Total: number;
            upcoming15Total: number;
            overdueTotal: number;
            pledgesDue: number;
            followUpsDueToday: number;
            overdueFollowUps: number;
            atRiskCount: number;
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
