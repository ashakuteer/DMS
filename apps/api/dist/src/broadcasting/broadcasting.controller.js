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
exports.BroadcastingController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const broadcasting_service_1 = require("./broadcasting.service");
let BroadcastingController = class BroadcastingController {
    constructor(broadcastingService) {
        this.broadcastingService = broadcastingService;
    }
    async previewAudience(body) {
        return this.broadcastingService.previewAudience(body.filters, body.channel);
    }
    async sendBroadcast(user, body) {
        return this.broadcastingService.sendBroadcast(body, user.id);
    }
    async getWhatsAppTemplates() {
        return this.broadcastingService.getAvailableWhatsAppTemplates();
    }
    async getEmailTemplates() {
        return this.broadcastingService.getAvailableEmailTemplates();
    }
    async getStaffList() {
        return this.broadcastingService.getStaffList();
    }
    async getProfessionList() {
        return this.broadcastingService.getProfessionList();
    }
};
exports.BroadcastingController = BroadcastingController;
__decorate([
    (0, common_1.Post)('preview'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BroadcastingController.prototype, "previewAudience", null);
__decorate([
    (0, common_1.Post)('send'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BroadcastingController.prototype, "sendBroadcast", null);
__decorate([
    (0, common_1.Get)('whatsapp-templates'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BroadcastingController.prototype, "getWhatsAppTemplates", null);
__decorate([
    (0, common_1.Get)('email-templates'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BroadcastingController.prototype, "getEmailTemplates", null);
__decorate([
    (0, common_1.Get)('staff-list'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BroadcastingController.prototype, "getStaffList", null);
__decorate([
    (0, common_1.Get)('profession-list'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BroadcastingController.prototype, "getProfessionList", null);
exports.BroadcastingController = BroadcastingController = __decorate([
    (0, common_1.Controller)('broadcasting'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [broadcasting_service_1.BroadcastingService])
], BroadcastingController);
//# sourceMappingURL=broadcasting.controller.js.map