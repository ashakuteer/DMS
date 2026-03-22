"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dashboard_stats_service_1 = require("./dashboard.stats.service");
const dashboard_trends_service_1 = require("./dashboard.trends.service");
const dashboard_insights_service_1 = require("./dashboard.insights.service");
const dashboard_actions_service_1 = require("./dashboard.actions.service");
const dashboard_impact_service_1 = require("./dashboard.impact.service");
const dashboard_retention_service_1 = require("./dashboard.retention.service");
async function safeRun(fn, label) {
    try {
        return await fn();
    }
    catch (err) {
        console.error(`[DashboardService] safeRun failed${label ? ` [${label}]` : ""}:`, err);
        return null;
    }
}
let DashboardService = DashboardService_1 = class DashboardService {
    constructor(prisma, statsService, trendsService, insightsService, actionsService, impactService, retentionService) {
        this.prisma = prisma;
        this.statsService = statsService;
        this.trendsService = trendsService;
        this.insightsService = insightsService;
        this.actionsService = actionsService;
        this.impactService = impactService;
        this.retentionService = retentionService;
        this.logger = new common_1.Logger(DashboardService_1.name);
    }
    async getSummary(user) {
        const t0 = Date.now();
        const role = user.role;
        const canSeeCore = ["FOUNDER", "ADMIN", "STAFF"].includes(role);
        const canSeeTarget = ["FOUNDER", "ADMIN", "STAFF"].includes(role);
        const canSeeInsights = ["FOUNDER", "ADMIN", "STAFF"].includes(role);
        const canSeeCards = ["FOUNDER", "ADMIN", "STAFF"].includes(role);
        const canSeeImpact = ["FOUNDER", "ADMIN", "STAFF"].includes(role);
        const canSeeRetention = ["FOUNDER", "ADMIN", "STAFF"].includes(role);
        const canSeeActions = ["FOUNDER", "ADMIN", "STAFF"].includes(role);
        const canSeeReminders = ["FOUNDER", "ADMIN", "STAFF"].includes(role);
        const isAdmin = role === "ADMIN" || role === "FOUNDER";
        const [stats, monthlyTarget, trends, modeSplit, topDonors, recentDonations, insights, insightCards, impact, retention, staffActions, adminInsights, reminders,] = await Promise.all([
            canSeeCore ? safeRun(() => this.statsService.getStats(), "getStats") : null,
            canSeeTarget ? safeRun(() => this.statsService.getMonthlyDonorTarget(), "getMonthlyDonorTarget") : null,
            canSeeCore ? safeRun(() => this.trendsService.getMonthlyTrends(), "getMonthlyTrends") : null,
            canSeeCore ? safeRun(() => this.statsService.getDonationModeSplit(), "getDonationModeSplit") : null,
            canSeeCore ? safeRun(() => this.statsService.getTopDonors(5), "getTopDonors") : null,
            canSeeCore ? safeRun(() => this.statsService.getRecentDonations(10), "getRecentDonations") : null,
            canSeeInsights ? safeRun(() => this.insightsService.getAIInsights(), "getAIInsights") : null,
            canSeeCards ? safeRun(() => this.insightsService.getInsightCards(), "getInsightCards") : null,
            canSeeImpact ? safeRun(() => this.impactService.getImpactDashboard(), "getImpactDashboard") : null,
            canSeeRetention ? safeRun(() => this.retentionService.getRetentionAnalytics(), "getRetentionAnalytics") : null,
            canSeeActions ? safeRun(() => this.actionsService.getStaffActions(), "getStaffActions") : null,
            isAdmin ? safeRun(() => this.insightsService.getAdminInsights(), "getAdminInsights") : null,
            canSeeReminders ? safeRun(() => this.getDueReminders(), "getDueReminders") : null,
        ]);
        this.logger.log(`getSummary() [role=${role}] completed in ${Date.now() - t0}ms`);
        return {
            stats,
            monthlyTarget,
            trends,
            modeSplit,
            topDonors,
            recentDonations,
            insights,
            insightCards,
            impact,
            retention,
            staffActions,
            adminInsights,
            reminders,
        };
    }
    async getDueReminders() {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return this.prisma.reminder.findMany({
            where: { status: "PENDING", dueDate: { lte: today } },
            select: {
                id: true,
                donorId: true,
                donationId: true,
                type: true,
                title: true,
                description: true,
                dueDate: true,
                status: true,
                createdById: true,
                completedAt: true,
                createdAt: true,
                updatedAt: true,
                donor: {
                    select: {
                        id: true,
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        primaryPhone: true,
                    },
                },
                donation: {
                    select: {
                        id: true,
                        donationAmount: true,
                        receiptNumber: true,
                        donationDate: true,
                    },
                },
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { dueDate: "asc" },
        });
    }
    getStats() { return this.statsService.getStats(); }
    getMonthlyTrends() { return this.trendsService.getMonthlyTrends(); }
    getMonthlyDonorTarget() { return this.statsService.getMonthlyDonorTarget(); }
    getDonationModeSplit() { return this.statsService.getDonationModeSplit(); }
    getTopDonors(limit = 5) { return this.statsService.getTopDonors(limit); }
    getRecentDonations(limit = 10) { return this.statsService.getRecentDonations(limit); }
    getAIInsights() { return this.insightsService.getAIInsights(); }
    getDonorInsights(donorId) { return this.insightsService.getDonorInsights(donorId); }
    getAdminInsights() { return this.insightsService.getAdminInsights(); }
    getInsightCards() { return this.insightsService.getInsightCards(); }
    getStaffActions() { return this.actionsService.getStaffActions(); }
    getDailyActions() { return this.actionsService.getDailyActions(); }
    markActionDone(user, params) {
        return this.actionsService.markActionDone(user, params);
    }
    snoozeAction(user, params) {
        return this.actionsService.snoozeAction(user, params);
    }
    getImpactDashboard() { return this.impactService.getImpactDashboard(); }
    getRetentionAnalytics() { return this.retentionService.getRetentionAnalytics(); }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dashboard_stats_service_1.DashboardStatsService,
        dashboard_trends_service_1.DashboardTrendsService,
        dashboard_insights_service_1.DashboardInsightsService,
        dashboard_actions_service_1.DashboardActionsService,
        dashboard_impact_service_1.DashboardImpactService,
        dashboard_retention_service_1.DashboardRetentionService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map