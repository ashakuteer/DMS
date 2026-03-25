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
            totalDonationsFY: any;
            donationsThisMonth: any;
            activeDonors: any;
            totalBeneficiaries: any;
        };
        monthlyTarget: {
            raised: any;
            count: any;
            totalMonthlyDonors: any;
            target: number;
            remaining: number;
            progressPct: number;
            achieved: boolean;
        };
        trends: any[];
        modeSplit: any;
        topDonors: any;
        recentDonations: any;
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
        reminders: any;
    }>;
    private getDueReminders;
    getStats(): Promise<{
        totalDonationsFY: any;
        donationsThisMonth: any;
        activeDonors: any;
        totalBeneficiaries: any;
    }>;
    getMonthlyTrends(): Promise<any[]>;
    getMonthlyDonorTarget(): Promise<{
        raised: any;
        count: any;
        totalMonthlyDonors: any;
        target: number;
        remaining: number;
        progressPct: number;
        achieved: boolean;
    }>;
    getDonationModeSplit(): Promise<any>;
    getTopDonors(limit?: number): Promise<any>;
    getRecentDonations(limit?: number): Promise<any>;
    getAIInsights(): Promise<any[]>;
    getDonorInsights(donorId: string): Promise<{
        avgDonation: number;
        frequency: string;
        lastDonationDaysAgo: number;
        preferredMode: string;
        preferredDonationType: string;
        mostSponsoredHome: string;
        sponsoredBeneficiariesCount: number;
        totalDonations: any;
        donationCount: any;
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
    getImpactDashboard(): Promise<any>;
    getRetentionAnalytics(): Promise<any>;
}
