import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { Role, AuditAction } from "@prisma/client";

export interface PermissionEntry {
  module: string;
  action: string;
  allowed: boolean;
}

export interface PermissionMatrix {
  [role: string]: {
    [module: string]: {
      [action: string]: boolean;
    };
  };
}

const DEFAULT_PERMISSIONS: Record<string, Record<string, Role[]>> = {
  donors: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    create: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    edit: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    delete: [Role.FOUNDER, Role.ADMIN],
    export: [Role.FOUNDER, Role.ADMIN],
    addNotes: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    viewSensitive: [Role.FOUNDER, Role.ADMIN],
  },
  donations: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    create: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    edit: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    delete: [Role.FOUNDER, Role.ADMIN],
    export: [Role.FOUNDER, Role.ADMIN],
  },
  beneficiaries: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    create: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    edit: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    delete: [Role.FOUNDER, Role.ADMIN],
    export: [Role.FOUNDER, Role.ADMIN],
    viewSensitive: [Role.FOUNDER, Role.ADMIN],
  },
  pledges: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    create: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    edit: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    delete: [Role.FOUNDER, Role.ADMIN],
  },
  campaigns: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    create: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    edit: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    delete: [Role.FOUNDER, Role.ADMIN],
  },
  reports: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    export: [Role.FOUNDER, Role.ADMIN],
  },
  analytics: {
    view: [Role.FOUNDER, Role.ADMIN],
  },
  management: {
    view: [Role.FOUNDER, Role.ADMIN],
  },
  settings: {
    view: [Role.FOUNDER, Role.ADMIN],
  },
  users: {
    view: [Role.FOUNDER, Role.ADMIN],
  },
  milestones: {
    view: [Role.FOUNDER, Role.ADMIN],
  },
  dailyActions: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
  },
  reminders: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
  },
  followUps: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    create: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    edit: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    delete: [Role.FOUNDER, Role.ADMIN],
  },
  templates: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
  },
  reportCampaigns: {
    view: [Role.FOUNDER, Role.ADMIN],
  },
  emailQueue: {
    view: [Role.FOUNDER, Role.ADMIN],
  },
  auditLog: {
    view: [Role.FOUNDER, Role.ADMIN],
  },
  backup: {
    view: [Role.FOUNDER, Role.ADMIN],
    create: [Role.FOUNDER, Role.ADMIN],
    restore: [Role.FOUNDER, Role.ADMIN],
  },
  birthdayWishes: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    send: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    manageTemplates: [Role.FOUNDER, Role.ADMIN],
  },
  donorUpdates: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    create: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    send: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    delete: [Role.FOUNDER, Role.ADMIN],
  },
  donorReports: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    generate: [Role.FOUNDER, Role.ADMIN],
    share: [Role.FOUNDER, Role.ADMIN],
    delete: [Role.FOUNDER, Role.ADMIN],
    manageTemplates: [Role.FOUNDER, Role.ADMIN],
  },
  progressReports: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    generate: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    share: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    delete: [Role.FOUNDER, Role.ADMIN],
  },
  homeSummary: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    export: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
  },
  impact: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
  },
  retention: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
  },
  ngoDocuments: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    upload: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    edit: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    delete: [Role.FOUNDER, Role.ADMIN],
    accessLog: [Role.FOUNDER, Role.ADMIN],
  },
  timeMachine: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    create: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    edit: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
    delete: [Role.FOUNDER, Role.ADMIN],
    uploadPhoto: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
  },
  permissions: {
    view: [Role.FOUNDER, Role.ADMIN],
    manage: [Role.FOUNDER, Role.ADMIN],
  },
  dashboard: {
    view: [Role.FOUNDER, Role.ADMIN, Role.STAFF],
  },
};

@Injectable()
export class RolePermissionsService implements OnModuleInit {
  private permissionCache: Map<string, boolean> = new Map();
  private cacheInitialized = false;

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async onModuleInit() {
    try {
      await this.seedDefaultPermissions();
    } catch (err) {
      console.error("[RolePermissionsService] seedDefaultPermissions failed (non-fatal):", err);
    }
    try {
      await this.refreshCache();
    } catch (err) {
      console.error("[RolePermissionsService] refreshCache failed (non-fatal):", err);
      // Build cache from DEFAULT_PERMISSIONS so the app still works without DB
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

  private async seedDefaultPermissions() {
    const count = await this.prisma.rolePermission.count();
    if (count > 0) return;

    console.log("Seeding default role permissions...");
    const data: {
      role: Role;
      module: string;
      action: string;
      allowed: boolean;
    }[] = [];

    const allRoles = Object.values(Role);
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
      this.permissionCache.set(
        `${perm.role}:${perm.module}:${perm.action}`,
        true,
      );
    }
    this.cacheInitialized = true;
  }

  hasPermission(role: Role, module: string, action: string): boolean {
    if (role === Role.ADMIN) return true;
    if (!this.cacheInitialized) return false;
    return this.permissionCache.has(`${role}:${module}:${action}`);
  }

  canAccessModule(role: Role, module: string): boolean {
    return this.hasPermission(role, module, "view");
  }

  async getPermissionMatrix(): Promise<PermissionMatrix> {
    const permissions = await this.prisma.rolePermission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }, { role: "asc" }],
    });

    const matrix: PermissionMatrix = {};
    for (const perm of permissions) {
      if (!matrix[perm.role]) matrix[perm.role] = {};
      if (!matrix[perm.role][perm.module]) matrix[perm.role][perm.module] = {};
      matrix[perm.role][perm.module][perm.action] = perm.allowed;
    }
    return matrix;
  }

  async getRolePermissions(
    role: Role,
  ): Promise<Record<string, Record<string, boolean>>> {
    const permissions = await this.prisma.rolePermission.findMany({
      where: { role },
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    const result: Record<string, Record<string, boolean>> = {};
    for (const perm of permissions) {
      if (!result[perm.module]) result[perm.module] = {};
      result[perm.module][perm.action] = perm.allowed;
    }
    return result;
  }

  async getMyPermissions(role: Role): Promise<Record<string, string[]>> {
    // KEY OPTIMIZATION: serve from the in-memory permissionCache (populated on startup
    // and refreshed after every permission change) instead of a DB round-trip.
    // This eliminates the 12-second wait that was causing the 500 error under load.
    if (this.cacheInitialized) {
      return this.getMyPermissionsFromCache(role);
    }

    // Fallback to DB if cache hasn't warmed up yet (first few milliseconds only)
    try {
      const permissions = await this.prisma.rolePermission.findMany({
        where: { role, allowed: true },
        orderBy: [{ module: "asc" }, { action: "asc" }],
      });

      const result: Record<string, string[]> = {};
      for (const perm of permissions) {
        if (!result[perm.module]) result[perm.module] = [];
        result[perm.module].push(perm.action);
      }
      return result;
    } catch {
      // If DB is unavailable, return empty permissions rather than crashing
      return {};
    }
  }

  private getMyPermissionsFromCache(role: Role): Record<string, string[]> {
    if (role === Role.ADMIN) {
      // ADMIN has all permissions — reconstruct from DEFAULT_PERMISSIONS
      const result: Record<string, string[]> = {};
      for (const [module, actions] of Object.entries(DEFAULT_PERMISSIONS)) {
        result[module] = Object.keys(actions);
      }
      return result;
    }

    const result: Record<string, string[]> = {};
    const prefix = `${role}:`;
    for (const key of this.permissionCache.keys()) {
      if (!key.startsWith(prefix)) continue;
      const parts = key.split(":");
      if (parts.length < 3) continue;
      const module = parts[1];
      const action = parts[2];
      if (!result[module]) result[module] = [];
      result[module].push(action);
    }
    return result;
  }

  async updateRolePermission(
    role: Role,
    module: string,
    action: string,
    allowed: boolean,
    updatedByUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
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
      action: AuditAction.PERMISSION_CHANGE,
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

  async bulkUpdateRolePermissions(
    role: Role,
    permissions: { module: string; action: string; allowed: boolean }[],
    updatedByUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const results = [];
    for (const perm of permissions) {
      const result = await this.updateRolePermission(
        role,
        perm.module,
        perm.action,
        perm.allowed,
        updatedByUserId,
        ipAddress,
        userAgent,
      );
      results.push(result);
    }
    return results;
  }

  async getSensitiveFieldConfigs() {
    return this.prisma.sensitiveFieldConfig.findMany({
      orderBy: [{ module: "asc" }, { fieldName: "asc" }],
    });
  }

  async canViewSensitiveField(
    role: Role,
    module: string,
    fieldName: string,
  ): Promise<boolean> {
    if (role === Role.ADMIN) return true;

    const config = await this.prisma.sensitiveFieldConfig.findUnique({
      where: { module_fieldName: { module, fieldName } },
    });

    if (!config) {
      return this.hasPermission(role, module, "viewSensitive");
    }

    return config.roles.includes(role);
  }

  async updateSensitiveFieldConfig(
    module: string,
    fieldName: string,
    roles: Role[],
    updatedByUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
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
      action: AuditAction.PERMISSION_CHANGE,
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

  getAllModules(): string[] {
    return Object.keys(DEFAULT_PERMISSIONS);
  }

  getModuleActions(module: string): string[] {
    return Object.keys(DEFAULT_PERMISSIONS[module] || {});
  }

  getAllRoles(): Role[] {
    return Object.values(Role);
  }
}
