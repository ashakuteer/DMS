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
exports.BeneficiaryProgressReportsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const beneficiary_progress_reports_service_1 = require("./beneficiary-progress-reports.service");
let BeneficiaryProgressReportsController = class BeneficiaryProgressReportsController {
    constructor(service) {
        this.service = service;
    }
    async generate(body, req) {
        if (!body.beneficiaryId || !body.periodStart || !body.periodEnd) {
            throw new common_1.BadRequestException('beneficiaryId, periodStart, periodEnd are required');
        }
        return this.service.generate(body, req.user);
    }
    async findAll(page, limit, beneficiaryId) {
        return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, { beneficiaryId });
    }
    async searchBeneficiaries(q) {
        return this.service.searchBeneficiaries(q || '');
    }
    async findOne(id) {
        return this.service.findOne(id);
    }
    async downloadPdf(id, res) {
        const report = await this.service.findOne(id);
        const pdf = await this.service.generatePdf(id);
        const fileName = `progress-report-${report.beneficiary.code}-${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', pdf.length);
        res.status(common_1.HttpStatus.OK).end(pdf);
    }
    async shareWithSponsors(id, req) {
        return this.service.shareWithSponsors(id, req.user);
    }
    async shareToDonors(id, body, req) {
        if (!body.donorIds?.length) {
            throw new common_1.BadRequestException('donorIds array is required');
        }
        return this.service.shareToDonors(id, body.donorIds, req.user);
    }
    async delete(id) {
        return this.service.delete(id);
    }
};
exports.BeneficiaryProgressReportsController = BeneficiaryProgressReportsController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BeneficiaryProgressReportsController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('beneficiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BeneficiaryProgressReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search-beneficiaries'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiaryProgressReportsController.prototype, "searchBeneficiaries", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiaryProgressReportsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/download/pdf'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiaryProgressReportsController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Post)(':id/share-sponsors'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiaryProgressReportsController.prototype, "shareWithSponsors", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BeneficiaryProgressReportsController.prototype, "shareToDonors", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiaryProgressReportsController.prototype, "delete", null);
exports.BeneficiaryProgressReportsController = BeneficiaryProgressReportsController = __decorate([
    (0, common_1.Controller)('beneficiary-progress-reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [beneficiary_progress_reports_service_1.BeneficiaryProgressReportsService])
], BeneficiaryProgressReportsController);
//# sourceMappingURL=beneficiary-progress-reports.controller.js.map