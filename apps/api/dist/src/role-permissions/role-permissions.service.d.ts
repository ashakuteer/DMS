import { OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { Role } from "@prisma/client";
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
export declare class RolePermissionsService implements OnModuleInit {
    private prisma;
    private auditService;
    private permissionCache;
    private cacheInitialized;
    constructor(prisma: PrismaService, auditService: AuditService);
    onModuleInit(): Promise<void>;
    private seedDefaultPermissions;
    refreshCache(): Promise<void>;
    hasPermission(role: Role, module: string, action: string): boolean;
    canAccessModule(role: Role, module: string): boolean;
    getPermissionMatrix(): Promise<PermissionMatrix>;
    getRolePermissions(role: Role): Promise<Record<string, Record<string, boolean>>>;
    getMyPermissions(role: Role): Promise<Record<string, string[]>>;
    private getMyPermissionsFromCache;
    updateRolePermission(role: Role, module: string, action: string, allowed: boolean, updatedByUserId: string, ipAddress?: string, userAgent?: string): Promise<{
        role: import(".prisma/client").$Enums.Role;
        id: string;
        action: string;
        createdAt: Date;
        updatedAt: Date;
        module: string;
        allowed: boolean;
    }>;
    bulkUpdateRolePermissions(role: Role, permissions: {
        module: string;
        action: string;
        allowed: boolean;
    }[], updatedByUserId: string, ipAddress?: string, userAgent?: string): Promise<any[]>;
    getSensitiveFieldConfigs(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        roles: import(".prisma/client").$Enums.Role[];
        module: string;
        fieldName: string;
    }[]>;
    canViewSensitiveField(role: Role, module: string, fieldName: string): Promise<boolean>;
    updateSensitiveFieldConfig(module: string, fieldName: string, roles: Role[], updatedByUserId: string, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        roles: import(".prisma/client").$Enums.Role[];
        module: string;
        fieldName: string;
    }>;
    getAllModules(): string[];
    getModuleActions(module: string): string[];
    getAllRoles(): Role[];
}
