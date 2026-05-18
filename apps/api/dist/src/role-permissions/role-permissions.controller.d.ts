import { Role } from '@prisma/client';
import { RolePermissionsService } from './role-permissions.service';
import { Request } from 'express';
interface UserContext {
    id: string;
    role: Role;
    email: string;
}
export declare class RolePermissionsController {
    private rolePermissionsService;
    constructor(rolePermissionsService: RolePermissionsService);
    private getClientInfo;
    getMyPermissions(user: UserContext): Promise<Record<string, string[]>>;
    getPermissionMatrix(): Promise<import("./role-permissions.service").PermissionMatrix>;
    getAllRoles(): Promise<import(".prisma/client").$Enums.Role[]>;
    getAllModules(): Promise<{
        name: string;
        actions: string[];
    }[]>;
    getRolePermissions(role: Role): Promise<Record<string, Record<string, boolean>>>;
    updateRolePermissions(role: Role, body: {
        permissions: {
            module: string;
            action: string;
            allowed: boolean;
        }[];
    }, user: UserContext, req: Request): Promise<any[]>;
    updateSinglePermission(body: {
        role: Role;
        module: string;
        action: string;
        allowed: boolean;
    }, user: UserContext, req: Request): Promise<{
        role: import(".prisma/client").$Enums.Role;
        id: string;
        action: string;
        createdAt: Date;
        updatedAt: Date;
        module: string;
        allowed: boolean;
    }>;
    getSensitiveFieldConfigs(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        roles: import(".prisma/client").$Enums.Role[];
        module: string;
        fieldName: string;
    }[]>;
    updateSensitiveFieldConfig(body: {
        module: string;
        fieldName: string;
        roles: Role[];
    }, user: UserContext, req: Request): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        roles: import(".prisma/client").$Enums.Role[];
        module: string;
        fieldName: string;
    }>;
}
export {};
