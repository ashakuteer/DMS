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
exports.CommunicationLogController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const communication_log_service_1 = require("./communication-log.service");
const audit_service_1 = require("../audit/audit.service");
let CommunicationLogController = class CommunicationLogController {
    constructor(communicationLogService, auditService) {
        this.communicationLogService = communicationLogService;
        this.auditService = auditService;
    }
    async getByDonorId(donorId) {
        return this.communicationLogService.findByDonorId(donorId);
    }
    async getByDonationId(donationId) {
        return this.communicationLogService.findByDonationId(donationId);
    }
    async logWhatsAppClick(body, req) {
        const commType = body.type || client_1.CommunicationType.GENERAL;
        const result = await this.communicationLogService.logWhatsApp({
            donorId: body.donorId,
            donationId: body.donationId,
            templateId: body.templateId,
            phoneNumber: body.phoneNumber,
            messagePreview: body.messagePreview,
            sentById: req.user.id,
            type: commType,
        });
        await this.auditService.logWhatsAppSend(req.user.id, 'Donor', body.donorId, {
            phoneNumber: body.phoneNumber,
            donationId: body.donationId,
            type: commType,
        });
        return result;
    }
    async logPostDonationAction(body, req) {
        return this.communicationLogService.logPostDonationAction({
            donorId: body.donorId,
            donationId: body.donationId,
            action: body.action,
            sentById: req.user.id,
            userRole: req.user.role,
        });
    }
    async delete(id, req) {
        if (req.user.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only admins can delete communication logs');
        }
        return this.communicationLogService.delete(id);
    }
};
exports.CommunicationLogController = CommunicationLogController;
__decorate([
    (0, common_1.Get)('donor/:donorId'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('donorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunicationLogController.prototype, "getByDonorId", null);
__decorate([
    (0, common_1.Get)('donation/:donationId'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('donationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunicationLogController.prototype, "getByDonationId", null);
__decorate([
    (0, common_1.Post)('whatsapp'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommunicationLogController.prototype, "logWhatsAppClick", null);
__decorate([
    (0, common_1.Post)('post-donation-action'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommunicationLogController.prototype, "logPostDonationAction", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CommunicationLogController.prototype, "delete", null);
exports.CommunicationLogController = CommunicationLogController = __decorate([
    (0, common_1.Controller)('communication-logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [communication_log_service_1.CommunicationLogService,
        audit_service_1.AuditService])
], CommunicationLogController);
//# sourceMappingURL=communication-log.controller.js.map