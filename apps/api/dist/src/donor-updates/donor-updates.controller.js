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
exports.DonorUpdatesController = void 0;
const common_1 = require("@nestjs/common");
const donor_updates_service_1 = require("./donor-updates.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let DonorUpdatesController = class DonorUpdatesController {
    constructor(donorUpdatesService) {
        this.donorUpdatesService = donorUpdatesService;
    }
    async create(body, user) {
        return this.donorUpdatesService.create(body, user);
    }
    async update(id, body) {
        return this.donorUpdatesService.update(id, body);
    }
    async findAll(page, limit, draftsOnly) {
        return this.donorUpdatesService.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, draftsOnly === 'true' ? true : draftsOnly === 'false' ? false : undefined);
    }
    async searchDonors(search, limit) {
        return this.donorUpdatesService.searchDonors(search, limit ? parseInt(limit) : 20);
    }
    async getDonorsByHome(homeTypes) {
        const types = homeTypes.split(',').filter(Boolean);
        return this.donorUpdatesService.getDonorsByHome(types);
    }
    async getDonorsByBeneficiaries(ids) {
        const beneficiaryIds = ids.split(',').filter(Boolean);
        return this.donorUpdatesService.getDonorsByBeneficiaries(beneficiaryIds);
    }
    async getHistory(page, limit) {
        return this.donorUpdatesService.getHistory(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    }
    async findOne(id) {
        return this.donorUpdatesService.findOne(id);
    }
    async preview(id) {
        return this.donorUpdatesService.preview(id);
    }
    async send(id, body, user) {
        return this.donorUpdatesService.send(id, body, user);
    }
    async delete(id) {
        return this.donorUpdatesService.delete(id);
    }
};
exports.DonorUpdatesController = DonorUpdatesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DonorUpdatesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DonorUpdatesController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('draftsOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DonorUpdatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search-donors'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DonorUpdatesController.prototype, "searchDonors", null);
__decorate([
    (0, common_1.Get)('donors-by-home'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('homeTypes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonorUpdatesController.prototype, "getDonorsByHome", null);
__decorate([
    (0, common_1.Get)('donors-by-beneficiaries'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonorUpdatesController.prototype, "getDonorsByBeneficiaries", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DonorUpdatesController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonorUpdatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/preview'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonorUpdatesController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DonorUpdatesController.prototype, "send", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonorUpdatesController.prototype, "delete", null);
exports.DonorUpdatesController = DonorUpdatesController = __decorate([
    (0, common_1.Controller)('donor-updates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [donor_updates_service_1.DonorUpdatesService])
], DonorUpdatesController);
//# sourceMappingURL=donor-updates.controller.js.map