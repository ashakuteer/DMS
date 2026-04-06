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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissionsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const role_permissions_service_1 = require("./role-permissions.service");
let RolePermissionsController = class RolePermissionsController {
    constructor(rolePermissionsService) {
        this.rolePermissionsService = rolePermissionsService;
    }
    getClientInfo(req) {
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
            req.socket?.remoteAddress ||
            'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        return { ipAddress, userAgent };
    }
    async getMyPermissions(user) {
        return this.rolePermissionsService.getMyPermissions(user.role);
    }
    async getPermissionMatrix() {
        return this.rolePermissionsService.getPermissionMatrix();
    }
    async getAllRoles() {
        return this.rolePermissionsService.getAllRoles();
    }
    async getAllModules() {
        const modules = this.rolePermissionsService.getAllModules();
        return modules.map((m) => ({
            name: m,
            actions: this.rolePermissionsService.getModuleActions(m),
        }));
    }
    async getRolePermissions(role) {
        return this.rolePermissionsService.getRolePermissions(role);
    }
    async updateRolePermissions(role, body, user, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.rolePermissionsService.bulkUpdateRolePermissions(role, body.permissions, user.id, ipAddress, userAgent);
    }
    async updateSinglePermission(body, user, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.rolePermissionsService.updateRolePermission(body.role, body.module, body.action, body.allowed, user.id, ipAddress, userAgent);
    }
    async getSensitiveFieldConfigs() {
        return this.rolePermissionsService.getSensitiveFieldConfigs();
    }
    async updateSensitiveFieldConfig(body, user, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.rolePermissionsService.updateSensitiveFieldConfig(body.module, body.fieldName, body.roles, user.id, ipAddress, userAgent);
    }
};
exports.RolePermissionsController = RolePermissionsController;
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RolePermissionsController.prototype, "getMyPermissions", null);
__decorate([
    (0, common_1.Get)('matrix'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RolePermissionsController.prototype, "getPermissionMatrix", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RolePermissionsController.prototype, "getAllRoles", null);
__decorate([
    (0, common_1.Get)('modules'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RolePermissionsController.prototype, "getAllModules", null);
__decorate([
    (0, common_1.Get)('role/:role'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof client_1.Role !== "undefined" && client_1.Role) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], RolePermissionsController.prototype, "getRolePermissions", null);
__decorate([
    (0, common_1.Patch)('role/:role'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('role')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof client_1.Role !== "undefined" && client_1.Role) === "function" ? _b : Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], RolePermissionsController.prototype, "updateRolePermissions", null);
__decorate([
    (0, common_1.Patch)('single'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], RolePermissionsController.prototype, "updateSinglePermission", null);
__decorate([
    (0, common_1.Get)('sensitive-fields'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RolePermissionsController.prototype, "getSensitiveFieldConfigs", null);
__decorate([
    (0, common_1.Patch)('sensitive-fields'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], RolePermissionsController.prototype, "updateSensitiveFieldConfig", null);
exports.RolePermissionsController = RolePermissionsController = __decorate([
    (0, common_1.Controller)('role-permissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [role_permissions_service_1.RolePermissionsService])
], RolePermissionsController);
//# sourceMappingURL=role-permissions.controller.js.map