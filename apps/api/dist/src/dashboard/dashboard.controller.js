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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const dashboard_service_1 = require("./dashboard.service");
const dashboard_today_service_1 = require("./dashboard.today.service");
let DashboardController = class DashboardController {
    constructor(dashboardService, dashboardTodayService) {
        this.dashboardService = dashboardService;
        this.dashboardTodayService = dashboardTodayService;
    }
    async getToday() {
        return this.dashboardTodayService.getToday();
    }
    async getSummary(user) {
        return this.dashboardService.getSummary(user);
    }
    async getStats() {
        return this.dashboardService.getStats();
    }
    async getMonthlyTrends() {
        return this.dashboardService.getMonthlyTrends();
    }
    async getMonthlyDonorTarget() {
        return this.dashboardService.getMonthlyDonorTarget();
    }
    async getDonationModeSplit() {
        return this.dashboardService.getDonationModeSplit();
    }
    async getTopDonors() {
        return this.dashboardService.getTopDonors(5);
    }
    async getRecentDonations() {
        return this.dashboardService.getRecentDonations(10);
    }
    async getAIInsights() {
        return this.dashboardService.getAIInsights();
    }
    async getDonorInsights(donorId) {
        return this.dashboardService.getDonorInsights(donorId);
    }
    async getImpactDashboard() {
        return this.dashboardService.getImpactDashboard();
    }
    async getRetentionAnalytics() {
        return this.dashboardService.getRetentionAnalytics();
    }
    async getInsightCards() {
        return this.dashboardService.getInsightCards();
    }
    async getAdminInsights() {
        return this.dashboardService.getAdminInsights();
    }
    async getStaffActions() {
        return this.dashboardService.getStaffActions();
    }
    async getDailyActions() {
        return this.dashboardService.getDailyActions();
    }
    async markActionDone(user, body) {
        return this.dashboardService.markActionDone(user, body);
    }
    async snoozeAction(user, body) {
        return this.dashboardService.snoozeAction(user, body);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('today'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getToday", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('trends'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMonthlyTrends", null);
__decorate([
    (0, common_1.Get)('monthly-target'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMonthlyDonorTarget", null);
__decorate([
    (0, common_1.Get)('mode-split'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getDonationModeSplit", null);
__decorate([
    (0, common_1.Get)('top-donors'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getTopDonors", null);
__decorate([
    (0, common_1.Get)('recent-donations'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getRecentDonations", null);
__decorate([
    (0, common_1.Get)('insights'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getAIInsights", null);
__decorate([
    (0, common_1.Get)('donor-insights/:donorId'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('donorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getDonorInsights", null);
__decorate([
    (0, common_1.Get)('impact'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getImpactDashboard", null);
__decorate([
    (0, common_1.Get)('retention'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getRetentionAnalytics", null);
__decorate([
    (0, common_1.Get)('insight-cards'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getInsightCards", null);
__decorate([
    (0, common_1.Get)('admin-insights'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getAdminInsights", null);
__decorate([
    (0, common_1.Get)('staff-actions'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getStaffActions", null);
__decorate([
    (0, common_1.Get)('daily-actions'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getDailyActions", null);
__decorate([
    (0, common_1.Post)('daily-actions/mark-done'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "markActionDone", null);
__decorate([
    (0, common_1.Post)('daily-actions/snooze'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "snoozeAction", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        dashboard_today_service_1.DashboardTodayService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map