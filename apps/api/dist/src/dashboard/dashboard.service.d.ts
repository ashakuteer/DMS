import { PrismaService } from "../prisma/prisma.service";
import { DashboardStatsService } from "./dashboard.stats.service";
import { DashboardTrendsService } from "./dashboard.trends.service";
import { DashboardInsightsService } from "./dashboard.insights.service";
import { DashboardActionsService } from "./dashboard.actions.service";
import { DashboardImpactService } from "./dashboard.impact.service";
import { DashboardRetentionService } from "./dashboard.retention.service";
export declare class DashboardService {
    private readonly prisma;
    private readonly statsService;
    private readonly trendsService;
    private readonly insightsService;
    private readonly actionsService;
    private readonly impactService;
    private readonly retentionService;
    private readonly logger;
    constructor(prisma: PrismaService, statsService: DashboardStatsService, trendsService: DashboardTrendsService, insightsService: DashboardInsightsService, actionsService: DashboardActionsService, impactService: DashboardImpactService, retentionService: DashboardRetentionService);
    getSummary(user: {
        id: string;
        role: string;
    }): Promise<{
        stats: {
            totalDonationsFY: number;
            donationsThisMonth: number;
            activeDonors: number;
            totalBeneficiaries: number;
        };
        monthlyTarget: {
            raised: number;
            count: number;
            totalMonthlyDonors: number;
            target: number;
            remaining: number;
            progressPct: number;
            achieved: boolean;
        };
        trends: any[];
        modeSplit: {
            mode: import(".prisma/client").$Enums.DonationMode;
            amount: number;
            count: number;
        }[];
        topDonors: {
            donorId: string;
            donorCode: string;
            name: string;
            category: import(".prisma/client").$Enums.DonorCategory;
            totalAmount: number;
            donationCount: number;
        }[];
        recentDonations: {
            id: string;
            donorId: string;
            donorCode: string;
            donorName: string;
            amount: number;
            date: Date;
            mode: import(".prisma/client").$Enums.DonationMode;
            type: import(".prisma/client").$Enums.DonationType;
            receiptNumber: string;
        }[];
        insights: any[];
        insightCards: any[];
        impact: any;
        retention: any;
        staffActions: {
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
        };
        adminInsights: any[];
        reminders: {
            donor: {
                id: string;
                donorCode: string;
                firstName: string;
                lastName: string;
                primaryPhone: string;
            };
            donation: {
                id: string;
                donationDate: Date;
                donationAmount: import("@prisma/client/runtime/library").Decimal;
                receiptNumber: string;
            };
            id: string;
            createdAt: Date;
            updatedAt: Date;
            donorId: string;
            donationId: string;
            type: string;
            status: import(".prisma/client").$Enums.ReminderStatus;
            description: string;
            createdById: string;
            createdBy: {
                name: string;
                id: string;
            };
            title: string;
            dueDate: Date;
            completedAt: Date;
        }[];
    }>;
    private getDueReminders;
    getStats(): Promise<{
        totalDonationsFY: number;
        donationsThisMonth: number;
        activeDonors: number;
        totalBeneficiaries: number;
    }>;
    getMonthlyTrends(): Promise<any[]>;
    getMonthlyDonorTarget(): Promise<{
        raised: number;
        count: number;
        totalMonthlyDonors: number;
        target: number;
        remaining: number;
        progressPct: number;
        achieved: boolean;
    }>;
    getDonationModeSplit(): Promise<{
        mode: import(".prisma/client").$Enums.DonationMode;
        amount: number;
        count: number;
    }[]>;
    getTopDonors(limit?: number): Promise<{
        donorId: string;
        donorCode: string;
        name: string;
        category: import(".prisma/client").$Enums.DonorCategory;
        totalAmount: number;
        donationCount: number;
    }[]>;
    getRecentDonations(limit?: number): Promise<{
        id: string;
        donorId: string;
        donorCode: string;
        donorName: string;
        amount: number;
        date: Date;
        mode: import(".prisma/client").$Enums.DonationMode;
        type: import(".prisma/client").$Enums.DonationType;
        receiptNumber: string;
    }[]>;
    getAIInsights(): Promise<any[]>;
    getDonorInsights(donorId: string): Promise<{
        avgDonation: number;
        frequency: string;
        lastDonationDaysAgo: number;
        preferredMode: string;
        preferredDonationType: string;
        mostSponsoredHome: string;
        sponsoredBeneficiariesCount: number;
        totalDonations: number;
        donationCount: number;
    }>;
    getAdminInsights(): Promise<any[]>;
    getInsightCards(): Promise<any[]>;
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
            healthStatus: import(".prisma/client").$Enums.HealthStatus;
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
                healthStatus: import(".prisma/client").$Enums.HealthStatus;
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
    getImpactDashboard(): Promise<any>;
    getRetentionAnalytics(): Promise<any>;
}
