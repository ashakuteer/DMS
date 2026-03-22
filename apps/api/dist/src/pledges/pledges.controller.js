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
exports.PledgesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const pledges_service_1 = require("./pledges.service");
const client_1 = require("@prisma/client");
let PledgesController = class PledgesController {
    constructor(pledgesService) {
        this.pledgesService = pledgesService;
    }
    getClientInfo(req) {
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
            req.socket?.remoteAddress ||
            'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        return { ipAddress, userAgent };
    }
    async findAll(user, page, limit, donorId, status, sortBy, sortOrder) {
        return this.pledgesService.findAll(user, {
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            donorId,
            status,
            sortBy,
            sortOrder,
        });
    }
    async getDonorPledgeSuggestions(donorId) {
        return this.pledgesService.getDonorPledgeSuggestions(donorId);
    }
    async findOne(user, id) {
        return this.pledgesService.findOne(user, id);
    }
    async getWhatsAppText(user, id) {
        const pledge = await this.pledgesService.findOne(user, id);
        const text = await this.pledgesService.buildWhatsAppReminderText(pledge);
        return { text };
    }
    async create(user, data, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.pledgesService.create(user, data, ipAddress, userAgent);
    }
    async update(user, id, data, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.pledgesService.update(user, id, data, ipAddress, userAgent);
    }
    async markFulfilled(user, id, body, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.pledgesService.markFulfilled(user, id, body || {}, ipAddress, userAgent);
    }
    async postpone(user, id, body, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.pledgesService.postpone(user, id, body.newDate, body.notes, ipAddress, userAgent);
    }
    async cancel(user, id, body, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.pledgesService.cancel(user, id, body?.reason, ipAddress, userAgent);
    }
    async sendReminderEmail(user, id) {
        return this.pledgesService.sendPledgeReminderEmail(user, id);
    }
    async logWhatsApp(user, id) {
        return this.pledgesService.logWhatsAppReminder(user, id);
    }
    async delete(user, id, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.pledgesService.delete(user, id, ipAddress, userAgent);
    }
};
exports.PledgesController = PledgesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('donorId')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('sortBy')),
    __param(6, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PledgesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('donor/:donorId/suggestions'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('donorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PledgesController.prototype, "getDonorPledgeSuggestions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PledgesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/whatsapp-text'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PledgesController.prototype, "getWhatsAppText", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], PledgesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PledgesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/mark-fulfilled'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PledgesController.prototype, "markFulfilled", null);
__decorate([
    (0, common_1.Post)(':id/postpone'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PledgesController.prototype, "postpone", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PledgesController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/send-reminder-email'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PledgesController.prototype, "sendReminderEmail", null);
__decorate([
    (0, common_1.Post)(':id/log-whatsapp'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PledgesController.prototype, "logWhatsApp", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PledgesController.prototype, "delete", null);
exports.PledgesController = PledgesController = __decorate([
    (0, common_1.Controller)('pledges'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [pledges_service_1.PledgesService])
], PledgesController);
//# sourceMappingURL=pledges.controller.js.map