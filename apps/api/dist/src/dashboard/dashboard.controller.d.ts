import { DashboardService } from './dashboard.service';
import { DashboardTodayService } from './dashboard.today.service';
export declare class DashboardController {
    private readonly dashboardService;
    private readonly dashboardTodayService;
    constructor(dashboardService: DashboardService, dashboardTodayService: DashboardTodayService);
    getToday(): Promise<{
        todayStats: {
            totalDonationsToday: any;
            totalDonorsToday: number;
            totalAmountToday: any;
        };
        todayEvents: {
            birthdays: any;
            anniversaries: any[];
            memorials: any[];
            specialDays: any[];
        };
        todayTasks: {
            followUps: any;
            pledgeReminders: any;
            monthlyDonorReminders: any;
        };
    }>;
    getSummary(user: any): Promise<any>;
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
    getTopDonors(): Promise<any>;
    getRecentDonations(): Promise<any>;
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
