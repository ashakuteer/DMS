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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const STAFF_LIKE_ROLES = [client_1.Role.STAFF, client_1.Role.TELECALLER, client_1.Role.ACCOUNTANT, client_1.Role.OFFICE_ASSISTANT];
const ADMIN_LIKE_ROLES = [client_1.Role.FOUNDER, client_1.Role.ADMIN];
const ALL_ACTIVE_ROLES = [...ADMIN_LIKE_ROLES, ...STAFF_LIKE_ROLES];
const MEAL_ROLES = [...ALL_ACTIVE_ROLES, client_1.Role.OFFICE_INCHARGE, client_1.Role.HOME_INCHARGE];
const MEAL_CREATE_ROLES = [...ALL_ACTIVE_ROLES, client_1.Role.OFFICE_INCHARGE];
const DEFAULT_PERMISSIONS = {
    donors: {
        view: ALL_ACTIVE_ROLES,
        create: ALL_ACTIVE_ROLES,
        edit: ALL_ACTIVE_ROLES,
        delete: ADMIN_LIKE_ROLES,
        export: ADMIN_LIKE_ROLES,
        addNotes: ALL_ACTIVE_ROLES,
        viewSensitive: ADMIN_LIKE_ROLES,
    },
    donations: {
        view: ALL_ACTIVE_ROLES,
        create: ALL_ACTIVE_ROLES,
        edit: ALL_ACTIVE_ROLES,
        delete: ADMIN_LIKE_ROLES,
        export: ADMIN_LIKE_ROLES,
    },
    beneficiaries: {
        view: ALL_ACTIVE_ROLES,
        create: ALL_ACTIVE_ROLES,
        edit: ALL_ACTIVE_ROLES,
        delete: ADMIN_LIKE_ROLES,
        export: ADMIN_LIKE_ROLES,
        viewSensitive: ADMIN_LIKE_ROLES,
    },
    pledges: {
        view: ALL_ACTIVE_ROLES,
        create: ALL_ACTIVE_ROLES,
        edit: ALL_ACTIVE_ROLES,
        delete: ADMIN_LIKE_ROLES,
    },
    campaigns: {
        view: ALL_ACTIVE_ROLES,
        create: ALL_ACTIVE_ROLES,
        edit: ALL_ACTIVE_ROLES,
        delete: ADMIN_LIKE_ROLES,
    },
    reports: {
        view: ALL_ACTIVE_ROLES,
        export: ADMIN_LIKE_ROLES,
    },
    analytics: {
        view: ADMIN_LIKE_ROLES,
    },
    management: {
        view: ADMIN_LIKE_ROLES,
    },
    settings: {
        view: ADMIN_LIKE_ROLES,
    },
    users: {
        view: ADMIN_LIKE_ROLES,
    },
    milestones: {
        view: ADMIN_LIKE_ROLES,
    },
    dailyActions: {
        view: ALL_ACTIVE_ROLES,
    },
    reminders: {
        view: ALL_ACTIVE_ROLES,
    },
    followUps: {
        view: ALL_ACTIVE_ROLES,
        create: ALL_ACTIVE_ROLES,
        edit: ALL_ACTIVE_ROLES,
        delete: ADMIN_LIKE_ROLES,
    },
    templates: {
        view: ALL_ACTIVE_ROLES,
    },
    reportCampaigns: {
        view: ADMIN_LIKE_ROLES,
    },
    emailQueue: {
        view: ADMIN_LIKE_ROLES,
    },
    auditLog: {
        view: ADMIN_LIKE_ROLES,
    },
    backup: {
        view: ADMIN_LIKE_ROLES,
        create: ADMIN_LIKE_ROLES,
        restore: ADMIN_LIKE_ROLES,
    },
    birthdayWishes: {
        view: ALL_ACTIVE_ROLES,
        send: ALL_ACTIVE_ROLES,
        manageTemplates: ADMIN_LIKE_ROLES,
    },
    donorUpdates: {
        view: ALL_ACTIVE_ROLES,
        create: ALL_ACTIVE_ROLES,
        send: ALL_ACTIVE_ROLES,
        delete: ADMIN_LIKE_ROLES,
    },
    donorReports: {
        view: ALL_ACTIVE_ROLES,
        generate: ADMIN_LIKE_ROLES,
        share: ADMIN_LIKE_ROLES,
        delete: ADMIN_LIKE_ROLES,
        manageTemplates: ADMIN_LIKE_ROLES,
    },
    progressReports: {
        view: ALL_ACTIVE_ROLES,
        generate: ALL_ACTIVE_ROLES,
        share: ALL_ACTIVE_ROLES,
        delete: ADMIN_LIKE_ROLES,
    },
    homeSummary: {
        view: ALL_ACTIVE_ROLES,
        export: ALL_ACTIVE_ROLES,
    },
    impact: {
        view: ALL_ACTIVE_ROLES,
    },
    retention: {
        view: ALL_ACTIVE_ROLES,
    },
    ngoDocuments: {
        view: ALL_ACTIVE_ROLES,
        upload: ALL_ACTIVE_ROLES,
        edit: ALL_ACTIVE_ROLES,
        delete: ADMIN_LIKE_ROLES,
        accessLog: ADMIN_LIKE_ROLES,
    },
    timeMachine: {
        view: ALL_ACTIVE_ROLES,
        create: ALL_ACTIVE_ROLES,
        edit: ALL_ACTIVE_ROLES,
        delete: ADMIN_LIKE_ROLES,
        uploadPhoto: ALL_ACTIVE_ROLES,
    },
    permissions: {
        view: ADMIN_LIKE_ROLES,
        manage: ADMIN_LIKE_ROLES,
    },
    dashboard: {
        view: ALL_ACTIVE_ROLES,
    },
    meals: {
        view: MEAL_ROLES,
        create: MEAL_CREATE_ROLES,
        edit: MEAL_ROLES,
        postMeal: MEAL_ROLES,
        delete: ADMIN_LIKE_ROLES,
    },
    staffTasks: {
        view: ALL_ACTIVE_ROLES,
        create: ADMIN_LIKE_ROLES,
        update: ALL_ACTIVE_ROLES,
        delete: ADMIN_LIKE_ROLES,
    },
};
let RolePermissionsService = class RolePermissionsService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.permissionCache = new Map();
        this.cacheInitialized = false;
    }
    async onModuleInit() {
        try {
            await this.seedDefaultPermissions();
        }
        catch (err) {
            console.error("[RolePermissionsService] seedDefaultPermissions failed (non-fatal):", err);
        }
        try {
            await this.ensureNewRolePermissions();
        }
        catch (err) {
            console.error("[RolePermissionsService] ensureNewRolePermissions failed (non-fatal):", err);
        }
        try {
            await this.refreshCache();
        }
        catch (err) {
            console.error("[RolePermissionsService] refreshCache failed (non-fatal):", err);
            this.permissionCache.clear();
            for (const [module, actions] of Object.entries(DEFAULT_PERMISSIONS)) {
                for (const [action, allowedRoles] of Object.entries(actions)) {
                    for (const role of allowedRoles) {
                        this.permissionCache.set(`${role}:${module}:${action}`, true);
                    }
                }
            }
            this.cacheInitialized = true;
            console.log("[RolePermissionsService] Fallback: cache populated from DEFAULT_PERMISSIONS");
        }
    }
    async ensureNewRolePermissions() {
        const allRoles = Object.values(client_1.Role);
        const data = [];
        for (const [module, actions] of Object.entries(DEFAULT_PERMISSIONS)) {
            for (const [action, allowedRoles] of Object.entries(actions)) {
                for (const role of allRoles) {
                    data.push({
                        role,
                        module,
                        action,
                        allowed: allowedRoles.includes(role),
                    });
                }
            }
        }
        await this.prisma.rolePermission.createMany({
            data,
            skipDuplicates: true,
        });
    }
    async seedDefaultPermissions() {
        const count = await this.prisma.rolePermission.count();
        if (count > 0)
            return;
        console.log("Seeding default role permissions...");
        const data = [];
        const allRoles = Object.values(client_1.Role);
        for (const [module, actions] of Object.entries(DEFAULT_PERMISSIONS)) {
            for (const [action, allowedRoles] of Object.entries(actions)) {
                for (const role of allRoles) {
                    data.push({
                        role,
                        module,
                        action,
                        allowed: allowedRoles.includes(role),
                    });
                }
            }
        }
        await this.prisma.rolePermission.createMany({
            data,
            skipDuplicates: true,
        });
        console.log(`Seeded ${data.length} default role permissions`);
    }
    async refreshCache() {
        const permissions = await this.prisma.rolePermission.findMany({
            where: { allowed: true },
        });
        this.permissionCache.clear();
        for (const perm of permissions) {
            this.permissionCache.set(`${perm.role}:${perm.module}:${perm.action}`, true);
        }
        this.cacheInitialized = true;
    }
    hasPermission(role, module, action) {
        if (role === client_1.Role.FOUNDER || role === client_1.Role.ADMIN)
            return true;
        if (!this.cacheInitialized)
            return false;
        return this.permissionCache.has(`${role}:${module}:${action}`);
    }
    canAccessModule(role, module) {
        return this.hasPermission(role, module, "view");
    }
    async getPermissionMatrix() {
        const permissions = await this.prisma.rolePermission.findMany({
            orderBy: [{ module: "asc" }, { action: "asc" }, { role: "asc" }],
        });
        const matrix = {};
        for (const perm of permissions) {
            if (!matrix[perm.role])
                matrix[perm.role] = {};
            if (!matrix[perm.role][perm.module])
                matrix[perm.role][perm.module] = {};
            matrix[perm.role][perm.module][perm.action] = perm.allowed;
        }
        return matrix;
    }
    async getRolePermissions(role) {
        const permissions = await this.prisma.rolePermission.findMany({
            where: { role },
            orderBy: [{ module: "asc" }, { action: "asc" }],
        });
        const result = {};
        for (const perm of permissions) {
            if (!result[perm.module])
                result[perm.module] = {};
            result[perm.module][perm.action] = perm.allowed;
        }
        return result;
    }
    async getMyPermissions(role) {
        if (this.cacheInitialized) {
            return this.getMyPermissionsFromCache(role);
        }
        try {
            const permissions = await this.prisma.rolePermission.findMany({
                where: { role, allowed: true },
                orderBy: [{ module: "asc" }, { action: "asc" }],
            });
            const result = {};
            for (const perm of permissions) {
                if (!result[perm.module])
                    result[perm.module] = [];
                result[perm.module].push(perm.action);
            }
            return result;
        }
        catch {
            return {};
        }
    }
    getMyPermissionsFromCache(role) {
        if (role === client_1.Role.FOUNDER || role === client_1.Role.ADMIN) {
            const result = {};
            for (const [module, actions] of Object.entries(DEFAULT_PERMISSIONS)) {
                result[module] = Object.keys(actions);
            }
            return result;
        }
        const result = {};
        const prefix = `${role}:`;
        for (const key of this.permissionCache.keys()) {
            if (!key.startsWith(prefix))
                continue;
            const parts = key.split(":");
            if (parts.length < 3)
                continue;
            const module = parts[1];
            const action = parts[2];
            if (!result[module])
                result[module] = [];
            result[module].push(action);
        }
        return result;
    }
    async updateRolePermission(role, module, action, allowed, updatedByUserId, ipAddress, userAgent) {
        const existing = await this.prisma.rolePermission.findUnique({
            where: { role_module_action: { role, module, action } },
        });
        const result = await this.prisma.rolePermission.upsert({
            where: { role_module_action: { role, module, action } },
            update: { allowed },
            create: { role, module, action, allowed },
        });
        await this.auditService.log({
            userId: updatedByUserId,
            action: client_1.AuditAction.PERMISSION_CHANGE,
            entityType: "RolePermission",
            entityId: result.id,
            oldValue: existing
                ? { role, module, action, allowed: existing.allowed }
                : undefined,
            newValue: { role, module, action, allowed },
            ipAddress,
            userAgent,
        });
        await this.refreshCache();
        return result;
    }
    async bulkUpdateRolePermissions(role, permissions, updatedByUserId, ipAddress, userAgent) {
        const results = [];
        for (const perm of permissions) {
            const result = await this.updateRolePermission(role, perm.module, perm.action, perm.allowed, updatedByUserId, ipAddress, userAgent);
            results.push(result);
        }
        return results;
    }
    async getSensitiveFieldConfigs() {
        return this.prisma.sensitiveFieldConfig.findMany({
            orderBy: [{ module: "asc" }, { fieldName: "asc" }],
        });
    }
    async canViewSensitiveField(role, module, fieldName) {
        if (role === client_1.Role.ADMIN)
            return true;
        const config = await this.prisma.sensitiveFieldConfig.findUnique({
            where: { module_fieldName: { module, fieldName } },
        });
        if (!config) {
            return this.hasPermission(role, module, "viewSensitive");
        }
        return config.roles.includes(role);
    }
    async updateSensitiveFieldConfig(module, fieldName, roles, updatedByUserId, ipAddress, userAgent) {
        const existing = await this.prisma.sensitiveFieldConfig.findUnique({
            where: { module_fieldName: { module, fieldName } },
        });
        const result = await this.prisma.sensitiveFieldConfig.upsert({
            where: { module_fieldName: { module, fieldName } },
            update: { roles },
            create: { module, fieldName, roles },
        });
        await this.auditService.log({
            userId: updatedByUserId,
            action: client_1.AuditAction.PERMISSION_CHANGE,
            entityType: "SensitiveFieldConfig",
            entityId: result.id,
            oldValue: existing
                ? { module, fieldName, roles: existing.roles }
                : undefined,
            newValue: { module, fieldName, roles },
            ipAddress,
            userAgent,
        });
        return result;
    }
    getAllModules() {
        return Object.keys(DEFAULT_PERMISSIONS);
    }
    getModuleActions(module) {
        return Object.keys(DEFAULT_PERMISSIONS[module] || {});
    }
    getAllRoles() {
        return Object.values(client_1.Role);
    }
};
exports.RolePermissionsService = RolePermissionsService;
exports.RolePermissionsService = RolePermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], RolePermissionsService);
//# sourceMappingURL=role-permissions.service.js.map