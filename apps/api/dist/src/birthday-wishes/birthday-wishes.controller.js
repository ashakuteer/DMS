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
exports.BirthdayWishController = void 0;
const common_1 = require("@nestjs/common");
const birthday_wishes_service_1 = require("./birthday-wishes.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let BirthdayWishController = class BirthdayWishController {
    constructor(birthdayWishService) {
        this.birthdayWishService = birthdayWishService;
    }
    async getUpcoming(range) {
        const validRange = range === 'today' ? 'today' : 'next7';
        return this.birthdayWishService.getUpcomingBirthdays(validRange);
    }
    async getUpcomingBeneficiaries(range) {
        const validRange = range === 'today' ? 'today' : 'next7';
        return this.birthdayWishService.getUpcomingBeneficiaryBirthdays(validRange);
    }
    async getPreview(donorId) {
        return this.birthdayWishService.getWishPreview(donorId);
    }
    async queueEmail(donorId, user) {
        return this.birthdayWishService.queueBirthdayEmail(donorId, user);
    }
    async sendBeneficiaryWish(beneficiaryId, user) {
        return this.birthdayWishService.sendBeneficiaryBirthdayWish(beneficiaryId, user);
    }
    async markSent(donorId, channel, user) {
        return this.birthdayWishService.markSent(donorId, channel || 'WHATSAPP', user);
    }
    async getSentLog(page, limit) {
        return this.birthdayWishService.getSentLog(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    }
    async getTemplates() {
        return this.birthdayWishService.getTemplates();
    }
    async updateTemplate(id, body, user) {
        return this.birthdayWishService.updateTemplate(id, body, user.userId);
    }
};
exports.BirthdayWishController = BirthdayWishController;
__decorate([
    (0, common_1.Get)('upcoming'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('range')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BirthdayWishController.prototype, "getUpcoming", null);
__decorate([
    (0, common_1.Get)('upcoming-beneficiaries'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('range')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BirthdayWishController.prototype, "getUpcomingBeneficiaries", null);
__decorate([
    (0, common_1.Get)('preview/:donorId'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('donorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BirthdayWishController.prototype, "getPreview", null);
__decorate([
    (0, common_1.Post)('queue-email/:donorId'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('donorId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BirthdayWishController.prototype, "queueEmail", null);
__decorate([
    (0, common_1.Post)('send-beneficiary-wish/:beneficiaryId'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('beneficiaryId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BirthdayWishController.prototype, "sendBeneficiaryWish", null);
__decorate([
    (0, common_1.Post)('mark-sent/:donorId'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('donorId')),
    __param(1, (0, common_1.Body)('channel')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BirthdayWishController.prototype, "markSent", null);
__decorate([
    (0, common_1.Get)('sent-log'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BirthdayWishController.prototype, "getSentLog", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BirthdayWishController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Post)('templates/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BirthdayWishController.prototype, "updateTemplate", null);
exports.BirthdayWishController = BirthdayWishController = __decorate([
    (0, common_1.Controller)('birthday-wishes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [birthday_wishes_service_1.BirthdayWishService])
], BirthdayWishController);
//# sourceMappingURL=birthday-wishes.controller.js.map