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
var DonorReportsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorReportsController = void 0;
const common_1 = require("@nestjs/common");
const donor_reports_service_1 = require("./donor-reports.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const VALID_REPORT_TYPES = new Set(Object.values(client_1.DonorReportType));
const SAFE_LIST_FALLBACK = { data: [], total: 0, page: 1, totalPages: 1 };
let DonorReportsController = DonorReportsController_1 = class DonorReportsController {
    constructor(service) {
        this.service = service;
        this.logger = new common_1.Logger(DonorReportsController_1.name);
    }
    async generate(body, user) {
        return this.service.generate(body, user);
    }
    async findAll(page, limit, type, donorId) {
        try {
            const safePage = Math.max(1, parseInt(page ?? '1') || 1);
            const safeLimit = Math.min(100, Math.max(1, parseInt(limit ?? '20') || 20));
            const safeType = type && VALID_REPORT_TYPES.has(type.toUpperCase())
                ? type.toUpperCase()
                : undefined;
            return await this.service.findAll(safePage, safeLimit, { type: safeType, donorId });
        }
        catch (err) {
            this.logger.error('findAll donor-reports failed', err?.message);
            return SAFE_LIST_FALLBACK;
        }
    }
    async getTemplates() {
        return this.service.getTemplates();
    }
    async getCampaigns() {
        return this.service.getCampaigns();
    }
    async searchDonors(search, limit) {
        return this.service.searchDonors(search, limit ? parseInt(limit) : 20);
    }
    async findOne(id) {
        return this.service.findOne(id);
    }
    async downloadPdf(id, res) {
        const buffer = await this.service.generatePdf(id);
        const filename = `donor-report-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async downloadExcel(id, res) {
        const buffer = await this.service.generateExcel(id);
        const filename = `donor-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async shareReport(id, body, user) {
        return this.service.shareReport(id, body.donorIds, user);
    }
    async deleteReport(id) {
        return this.service.deleteReport(id);
    }
    async createTemplate(body, user) {
        return this.service.createTemplate(body, user);
    }
    async updateTemplate(id, body) {
        return this.service.updateTemplate(id, body);
    }
    async deleteTemplate(id) {
        return this.service.deleteTemplate(id);
    }
};
exports.DonorReportsController = DonorReportsController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DonorReportsController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('donorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], DonorReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DonorReportsController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)('campaigns'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DonorReportsController.prototype, "getCampaigns", null);
__decorate([
    (0, common_1.Get)('search-donors'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DonorReportsController.prototype, "searchDonors", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonorReportsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/download/pdf'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DonorReportsController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Get)(':id/download/excel'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DonorReportsController.prototype, "downloadExcel", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DonorReportsController.prototype, "shareReport", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonorReportsController.prototype, "deleteReport", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DonorReportsController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DonorReportsController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonorReportsController.prototype, "deleteTemplate", null);
exports.DonorReportsController = DonorReportsController = DonorReportsController_1 = __decorate([
    (0, common_1.Controller)('donor-reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [donor_reports_service_1.DonorReportsService])
], DonorReportsController);
//# sourceMappingURL=donor-reports.controller.js.map