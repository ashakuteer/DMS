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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getMonthlyDonations(startDate, endDate, page, limit, search) {
        return this.reportsService.getMonthlyDonations({ startDate, endDate }, { page: parseInt(page || '1'), limit: parseInt(limit || '20'), search });
    }
    async getDonorReport(startDate, endDate, page, limit, search, sortBy, sortOrder) {
        return this.reportsService.getDonorReport({ startDate, endDate }, {
            page: parseInt(page || '1'),
            limit: parseInt(limit || '20'),
            search,
            sortBy: sortBy || 'lifetime',
            sortOrder: sortOrder || 'desc',
        });
    }
    async exportDonorReportExcel(startDate, endDate, res) {
        const buffer = await this.reportsService.exportDonorReportExcel({ startDate, endDate });
        const filename = `donor-summary-${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async exportDonorReportPdf(startDate, endDate, res) {
        const buffer = await this.reportsService.exportDonorReportPdf({ startDate, endDate });
        const filename = `donor-summary-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async getDonorSummary(startDate, endDate, page, limit, search) {
        return this.reportsService.getDonorSummary({ startDate, endDate }, { page: parseInt(page || '1'), limit: parseInt(limit || '20'), search });
    }
    async getBoardSummaryPdf(res) {
        const buffer = await this.reportsService.generateBoardSummaryPdf();
        const filename = `board-summary-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async getReceiptsAudit(startDate, endDate, page, limit, search, paymentMode) {
        return this.reportsService.getReceiptsAudit({ startDate, endDate }, {
            page: parseInt(page || '1'),
            limit: parseInt(limit || '20'),
            search,
            paymentMode,
        });
    }
    async exportReceiptsAuditExcel(startDate, endDate, paymentMode, res) {
        const buffer = await this.reportsService.exportReceiptsAuditExcel({ startDate, endDate }, paymentMode);
        const filename = `receipt-register-audit-${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async exportReceiptsAuditPdf(startDate, endDate, paymentMode, res) {
        const buffer = await this.reportsService.exportReceiptsAuditPdf({ startDate, endDate }, paymentMode);
        const filename = `receipt-register-audit-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async getReceiptRegister(startDate, endDate, page, limit, search) {
        return this.reportsService.getReceiptRegister({ startDate, endDate }, { page: parseInt(page || '1'), limit: parseInt(limit || '20'), search });
    }
    async exportMonthlyDonationsExcel(startDate, endDate, res) {
        const buffer = await this.reportsService.exportMonthlyDonationsExcel({ startDate, endDate });
        const filename = `monthly-donations-${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async exportMonthlyDonationsPdf(startDate, endDate, res) {
        const buffer = await this.reportsService.exportMonthlyDonationsPdf({ startDate, endDate });
        const filename = `monthly-donations-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async exportDonorSummaryExcel(startDate, endDate, res) {
        const buffer = await this.reportsService.exportDonorSummaryExcel({ startDate, endDate });
        const filename = `donor-summary-${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async exportDonorSummaryPdf(startDate, endDate, res) {
        const buffer = await this.reportsService.exportDonorSummaryPdf({ startDate, endDate });
        const filename = `donor-summary-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async exportReceiptRegisterExcel(startDate, endDate, res) {
        const buffer = await this.reportsService.exportReceiptRegisterExcel({ startDate, endDate });
        const filename = `receipt-register-${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async exportReceiptRegisterPdf(startDate, endDate, res) {
        const buffer = await this.reportsService.exportReceiptRegisterPdf({ startDate, endDate });
        const filename = `receipt-register-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('monthly-donations'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getMonthlyDonations", null);
__decorate([
    (0, common_1.Get)('donors'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('sortBy')),
    __param(6, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getDonorReport", null);
__decorate([
    (0, common_1.Get)('donors/export/excel'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportDonorReportExcel", null);
__decorate([
    (0, common_1.Get)('donors/export/pdf'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportDonorReportPdf", null);
__decorate([
    (0, common_1.Get)('donor-summary'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getDonorSummary", null);
__decorate([
    (0, common_1.Get)('board-summary'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getBoardSummaryPdf", null);
__decorate([
    (0, common_1.Get)('receipts'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('paymentMode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getReceiptsAudit", null);
__decorate([
    (0, common_1.Get)('receipts/export/excel'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('paymentMode')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportReceiptsAuditExcel", null);
__decorate([
    (0, common_1.Get)('receipts/export/pdf'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('paymentMode')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportReceiptsAuditPdf", null);
__decorate([
    (0, common_1.Get)('receipt-register'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getReceiptRegister", null);
__decorate([
    (0, common_1.Get)('monthly-donations/export/excel'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportMonthlyDonationsExcel", null);
__decorate([
    (0, common_1.Get)('monthly-donations/export/pdf'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportMonthlyDonationsPdf", null);
__decorate([
    (0, common_1.Get)('donor-summary/export/excel'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportDonorSummaryExcel", null);
__decorate([
    (0, common_1.Get)('donor-summary/export/pdf'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportDonorSummaryPdf", null);
__decorate([
    (0, common_1.Get)('receipt-register/export/excel'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportReceiptRegisterExcel", null);
__decorate([
    (0, common_1.Get)('receipt-register/export/pdf'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportReceiptRegisterPdf", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map