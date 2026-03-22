import { DashboardService } from './dashboard.service';
import { DashboardTodayService } from './dashboard.today.service';
export declare class DashboardController {
    private readonly dashboardService;
    private readonly dashboardTodayService;
    constructor(dashboardService: DashboardService, dashboardTodayService: DashboardTodayService);
    getToday(): Promise<{
        todayStats: {
            totalDonationsToday: number;
            totalDonorsToday: number;
            totalAmountToday: any;
        };
        todayEvents: {
            birthdays: {
                id: string;
                name: string;
                phone: string;
                city: string;
            }[];
            anniversaries: any[];
            memorials: any[];
            specialDays: any[];
        };
        todayTasks: {
            followUps: {
                id: string;
                title: string;
                priority: import(".prisma/client").$Enums.TaskPriority;
                dueDate: Date;
                status: import(".prisma/client").$Enums.TaskStatus;
                donorName: string;
            }[];
            pledgeReminders: {
                id: string;
                title: string;
                priority: import(".prisma/client").$Enums.TaskPriority;
                dueDate: Date;
                status: import(".prisma/client").$Enums.TaskStatus;
                donorName: string;
            }[];
            monthlyDonorReminders: {
                id: string;
                title: string;
                dueDate: Date;
                donorName: string;
                donorPhone: string;
            }[];
        };
    }>;
    getSummary(user: any): Promise<{
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
                receiptNumber: string;
                donationAmount: import("@prisma/client/runtime/library").Decimal;
                donationDate: Date;
            };
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            status: import(".prisma/client").$Enums.ReminderStatus;
            donorId: string;
            donationId: string;
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
    getTopDonors(): Promise<{
        donorId: string;
        donorCode: string;
        name: string;
        category: import(".prisma/client").$Enums.DonorCategory;
        totalAmount: number;
        donationCount: number;
    }[]>;
    getRecentDonations(): Promise<{
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
    getImpactDashboard(): Promise<any>;
    getRetentionAnalytics(): Promise<any>;
    getInsightCards(): Promise<any[]>;
    getAdminInsights(): Promise<any[]>;
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
    markActionDone(user: any, body: {
        donorId: string;
        actionType: string;
        description: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    snoozeAction(user: any, body: {
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
