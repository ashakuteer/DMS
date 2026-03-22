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
const smart_reports_service_1 = require("./smart-reports.service");
let ReportsController = class ReportsController {
    constructor(reportsService, smartReportsService) {
        this.reportsService = reportsService;
        this.smartReportsService = smartReportsService;
    }
    async getSmartReport(groupBy = 'gender', gender, city, state, country, profession, category, occasion, donationType, minAmount, maxAmount, dateFrom, dateTo, visited) {
        const filters = {};
        if (gender)
            filters.gender = gender;
        if (city)
            filters.city = city;
        if (state)
            filters.state = state;
        if (country)
            filters.country = country;
        if (profession)
            filters.profession = profession;
        if (category)
            filters.category = category;
        if (occasion)
            filters.occasion = occasion;
        if (donationType)
            filters.donationType = donationType;
        if (minAmount)
            filters.minAmount = parseFloat(minAmount);
        if (maxAmount)
            filters.maxAmount = parseFloat(maxAmount);
        if (dateFrom)
            filters.dateFrom = dateFrom;
        if (dateTo)
            filters.dateTo = dateTo;
        if (visited !== undefined)
            filters.visited = visited === 'true';
        return this.smartReportsService.getSmartReport(filters, groupBy);
    }
    async exportSmartReport(format = 'excel', groupBy = 'gender', gender, city, state, country, profession, category, occasion, donationType, minAmount, maxAmount, dateFrom, dateTo, visited, res) {
        const filters = {};
        if (gender)
            filters.gender = gender;
        if (city)
            filters.city = city;
        if (state)
            filters.state = state;
        if (country)
            filters.country = country;
        if (profession)
            filters.profession = profession;
        if (category)
            filters.category = category;
        if (occasion)
            filters.occasion = occasion;
        if (donationType)
            filters.donationType = donationType;
        if (minAmount)
            filters.minAmount = parseFloat(minAmount);
        if (maxAmount)
            filters.maxAmount = parseFloat(maxAmount);
        if (dateFrom)
            filters.dateFrom = dateFrom;
        if (dateTo)
            filters.dateTo = dateTo;
        if (visited !== undefined)
            filters.visited = visited === 'true';
        if (format === 'pdf') {
            const buffer = await this.smartReportsService.exportPdf(filters, groupBy);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.pdf"`);
            res.send(buffer);
        }
        else {
            const buffer = await this.smartReportsService.exportExcel(filters, groupBy);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.xlsx"`);
            res.send(buffer);
        }
    }
    async saveReport(body) {
        return this.smartReportsService.saveReport(body.name, body.filters, body.groupBy);
    }
    async getReportHistory() {
        return this.smartReportsService.getReportHistory();
    }
    async getAnalytics() {
        return this.smartReportsService.getAnalytics();
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
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('groupBy')),
    __param(1, (0, common_1.Query)('gender')),
    __param(2, (0, common_1.Query)('city')),
    __param(3, (0, common_1.Query)('state')),
    __param(4, (0, common_1.Query)('country')),
    __param(5, (0, common_1.Query)('profession')),
    __param(6, (0, common_1.Query)('category')),
    __param(7, (0, common_1.Query)('occasion')),
    __param(8, (0, common_1.Query)('donationType')),
    __param(9, (0, common_1.Query)('minAmount')),
    __param(10, (0, common_1.Query)('maxAmount')),
    __param(11, (0, common_1.Query)('dateFrom')),
    __param(12, (0, common_1.Query)('dateTo')),
    __param(13, (0, common_1.Query)('visited')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSmartReport", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER),
    __param(0, (0, common_1.Query)('format')),
    __param(1, (0, common_1.Query)('groupBy')),
    __param(2, (0, common_1.Query)('gender')),
    __param(3, (0, common_1.Query)('city')),
    __param(4, (0, common_1.Query)('state')),
    __param(5, (0, common_1.Query)('country')),
    __param(6, (0, common_1.Query)('profession')),
    __param(7, (0, common_1.Query)('category')),
    __param(8, (0, common_1.Query)('occasion')),
    __param(9, (0, common_1.Query)('donationType')),
    __param(10, (0, common_1.Query)('minAmount')),
    __param(11, (0, common_1.Query)('maxAmount')),
    __param(12, (0, common_1.Query)('dateFrom')),
    __param(13, (0, common_1.Query)('dateTo')),
    __param(14, (0, common_1.Query)('visited')),
    __param(15, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportSmartReport", null);
__decorate([
    (0, common_1.Post)('save'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "saveReport", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getReportHistory", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getAnalytics", null);
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
    __metadata("design:paramtypes", [reports_service_1.ReportsService,
        smart_reports_service_1.SmartReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map