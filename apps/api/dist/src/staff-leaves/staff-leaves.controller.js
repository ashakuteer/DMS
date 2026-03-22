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
exports.StaffLeavesController = void 0;
const common_1 = require("@nestjs/common");
const staff_leaves_service_1 = require("./staff-leaves.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let StaffLeavesController = class StaffLeavesController {
    constructor(service) {
        this.service = service;
    }
    findAll(staffId, status, type, year, homeId) {
        return this.service.findAll({
            staffId,
            status,
            type,
            year: year ? parseInt(year) : undefined,
            homeId,
        });
    }
    findByStaff(staffId, year) {
        return this.service.findByStaff(staffId, year ? parseInt(year) : undefined);
    }
    getSummary(staffId, year) {
        const y = year ? parseInt(year) : new Date().getFullYear();
        return this.service.getSummary(staffId, y);
    }
    create(body) {
        return this.service.create(body);
    }
    updateStatus(id, body) {
        return this.service.updateStatus(id, body.status, body.notes);
    }
    delete(id) {
        return this.service.delete(id);
    }
};
exports.StaffLeavesController = StaffLeavesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('staffId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('year')),
    __param(4, (0, common_1.Query)('homeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], StaffLeavesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('staff/:staffId'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StaffLeavesController.prototype, "findByStaff", null);
__decorate([
    (0, common_1.Get)('staff/:staffId/summary'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StaffLeavesController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaffLeavesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StaffLeavesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaffLeavesController.prototype, "delete", null);
exports.StaffLeavesController = StaffLeavesController = __decorate([
    (0, common_1.Controller)('staff-leaves'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [staff_leaves_service_1.StaffLeavesService])
], StaffLeavesController);
//# sourceMappingURL=staff-leaves.controller.js.map