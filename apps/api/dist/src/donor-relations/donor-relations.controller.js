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
exports.DonorRelationsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const donor_relations_service_1 = require("./donor-relations.service");
const client_1 = require("@prisma/client");
let DonorRelationsController = class DonorRelationsController {
    constructor(donorRelationsService) {
        this.donorRelationsService = donorRelationsService;
    }
    getClientInfo(req) {
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
            req.socket?.remoteAddress ||
            'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        return { ipAddress, userAgent };
    }
    async getFamilyMembers(user, donorId) {
        return this.donorRelationsService.getFamilyMembers(user, donorId);
    }
    async createFamilyMember(user, donorId, data, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donorRelationsService.createFamilyMember(user, donorId, data, ipAddress, userAgent);
    }
    async updateFamilyMember(user, id, data, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donorRelationsService.updateFamilyMember(user, id, data, ipAddress, userAgent);
    }
    async deleteFamilyMember(user, id, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donorRelationsService.deleteFamilyMember(user, id, ipAddress, userAgent);
    }
    async getSpecialOccasions(user, donorId) {
        return this.donorRelationsService.getSpecialOccasions(user, donorId);
    }
    async getUpcomingSpecialOccasions(user, donorId, days) {
        return this.donorRelationsService.getUpcomingSpecialOccasions(user, donorId, days ? parseInt(days, 10) : 30);
    }
    async createSpecialOccasion(user, donorId, data, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donorRelationsService.createSpecialOccasion(user, donorId, data, ipAddress, userAgent);
    }
    async updateSpecialOccasion(user, id, data, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donorRelationsService.updateSpecialOccasion(user, id, data, ipAddress, userAgent);
    }
    async deleteSpecialOccasion(user, id, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donorRelationsService.deleteSpecialOccasion(user, id, ipAddress, userAgent);
    }
};
exports.DonorRelationsController = DonorRelationsController;
__decorate([
    (0, common_1.Get)('donors/:donorId/family-members'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('donorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DonorRelationsController.prototype, "getFamilyMembers", null);
__decorate([
    (0, common_1.Post)('donors/:donorId/family-members'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('donorId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], DonorRelationsController.prototype, "createFamilyMember", null);
__decorate([
    (0, common_1.Patch)('family-members/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], DonorRelationsController.prototype, "updateFamilyMember", null);
__decorate([
    (0, common_1.Delete)('family-members/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DonorRelationsController.prototype, "deleteFamilyMember", null);
__decorate([
    (0, common_1.Get)('donors/:donorId/special-occasions'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('donorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DonorRelationsController.prototype, "getSpecialOccasions", null);
__decorate([
    (0, common_1.Get)('donors/:donorId/special-occasions/upcoming'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('donorId')),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DonorRelationsController.prototype, "getUpcomingSpecialOccasions", null);
__decorate([
    (0, common_1.Post)('donors/:donorId/special-occasions'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('donorId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], DonorRelationsController.prototype, "createSpecialOccasion", null);
__decorate([
    (0, common_1.Patch)('special-occasions/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], DonorRelationsController.prototype, "updateSpecialOccasion", null);
__decorate([
    (0, common_1.Delete)('special-occasions/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DonorRelationsController.prototype, "deleteSpecialOccasion", null);
exports.DonorRelationsController = DonorRelationsController = __decorate([
    (0, common_1.Controller)('donor-relations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [donor_relations_service_1.DonorRelationsService])
], DonorRelationsController);
//# sourceMappingURL=donor-relations.controller.js.map