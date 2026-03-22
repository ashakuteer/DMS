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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    getClientInfo(req) {
        const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.socket?.remoteAddress ||
            "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";
        return { ipAddress, userAgent };
    }
    listStaff() {
        return this.usersService.listStaffForAssignment();
    }
    listAllStaff() {
        return this.usersService.listAllStaff();
    }
    async createStaff(data) {
        return this.usersService.createStaff(data);
    }
    async findAll(page, limit) {
        return this.usersService.findAll(page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
    }
    async findOne(id) {
        return this.usersService.findOne(id);
    }
    async updateRole(id, role, user, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.usersService.updateRole(id, role, user.id, ipAddress, userAgent);
    }
    async updateUser(id, data) {
        return this.usersService.updateUser(id, data);
    }
    async toggleActive(id) {
        return this.usersService.toggleActive(id);
    }
    async resetPassword(id, newPassword) {
        return this.usersService.resetUserPassword(id, newPassword);
    }
    async reassignPhone(fromUserId, toUserId) {
        return this.usersService.reassignPhone(fromUserId, toUserId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)("staff"),
    (0, permissions_decorator_1.RequirePermission)("donors", "assign"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listStaff", null);
__decorate([
    (0, common_1.Get)("staff-all"),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.FOUNDER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listAllStaff", null);
__decorate([
    (0, common_1.Post)("create-staff"),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.FOUNDER),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createStaff", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.FOUNDER),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.FOUNDER),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id/role"),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.FOUNDER),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)("role")),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.FOUNDER),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Patch)(":id/toggle-active"),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.FOUNDER),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Patch)(":id/reset-password"),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.FOUNDER),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)("newPassword")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Patch)(":id/reassign-phone"),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.FOUNDER),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)("toUserId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "reassignPhone", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)("users"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map