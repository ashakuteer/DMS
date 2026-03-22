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
exports.DonationsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const donations_service_1 = require("./donations.service");
const client_1 = require("@prisma/client");
let DonationsController = class DonationsController {
    constructor(donationsService) {
        this.donationsService = donationsService;
    }
    getClientInfo(req) {
        const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.socket?.remoteAddress ||
            "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";
        return { ipAddress, userAgent };
    }
    async findAll(user, page, limit, donorId, startDate, endDate, sortBy, sortOrder, search, donationType, donationHomeType) {
        return this.donationsService.findAll(user, {
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            donorId,
            startDate,
            endDate,
            sortBy,
            sortOrder,
            search,
            donationType,
            donationHomeType,
        });
    }
    async getStatsByHome(user) {
        return this.donationsService.getStatsByHome(user);
    }
    async exportDonations(user, req, startDate, endDate, donorId) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donationsService.exportDonations(user, { startDate, endDate, donorId }, ipAddress, userAgent);
    }
    async exportToExcel(user, req, res, startDate, endDate, donationType, donationHomeType) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        const buffer = await this.donationsService.exportToExcel(user, { startDate, endDate, donationType, donationHomeType }, ipAddress, userAgent);
        const filename = `donations_${new Date().toISOString().split("T")[0]}.xlsx`;
        res.set({
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filename}"`,
        });
        return new common_1.StreamableFile(buffer);
    }
    async downloadReceipt(user, id, res) {
        const result = await this.donationsService.getReceiptPdf(user, id);
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${result.filename}"`,
        });
        return new common_1.StreamableFile(result.buffer);
    }
    async findOne(user, id) {
        return this.donationsService.findOne(user, id);
    }
    async create(user, data, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donationsService.create(user, data, ipAddress, userAgent);
    }
    async update(user, id, data, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donationsService.update(user, id, data, ipAddress, userAgent);
    }
    async remove(user, id, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donationsService.softDelete(user, id, ipAddress, userAgent);
    }
    async regenerateReceipt(user, id, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donationsService.regenerateReceipt(user, id, ipAddress, userAgent);
    }
    async resendReceipt(user, id, body) {
        return this.donationsService.resendReceipt(user, id, body?.emailType);
    }
};
exports.DonationsController = DonationsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __param(3, (0, common_1.Query)("donorId")),
    __param(4, (0, common_1.Query)("startDate")),
    __param(5, (0, common_1.Query)("endDate")),
    __param(6, (0, common_1.Query)("sortBy")),
    __param(7, (0, common_1.Query)("sortOrder")),
    __param(8, (0, common_1.Query)("search")),
    __param(9, (0, common_1.Query)("donationType")),
    __param(10, (0, common_1.Query)("donationHomeType")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DonationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("stats/by-home"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DonationsController.prototype, "getStatsByHome", null);
__decorate([
    (0, common_1.Get)("export"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)("startDate")),
    __param(3, (0, common_1.Query)("endDate")),
    __param(4, (0, common_1.Query)("donorId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], DonationsController.prototype, "exportDonations", null);
__decorate([
    (0, common_1.Get)("export/excel"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __param(3, (0, common_1.Query)("startDate")),
    __param(4, (0, common_1.Query)("endDate")),
    __param(5, (0, common_1.Query)("donationType")),
    __param(6, (0, common_1.Query)("donationHomeType")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DonationsController.prototype, "exportToExcel", null);
__decorate([
    (0, common_1.Get)(":id/receipt"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DonationsController.prototype, "downloadReceipt", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DonationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], DonationsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], DonationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DonationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(":id/regenerate-receipt"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DonationsController.prototype, "regenerateReceipt", null);
__decorate([
    (0, common_1.Post)(":id/resend-receipt"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DonationsController.prototype, "resendReceipt", null);
exports.DonationsController = DonationsController = __decorate([
    (0, common_1.Controller)("donations"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [donations_service_1.DonationsService])
], DonationsController);
//# sourceMappingURL=donations.controller.js.map