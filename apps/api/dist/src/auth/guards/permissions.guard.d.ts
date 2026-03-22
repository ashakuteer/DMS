import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolePermissionsService } from '../../role-permissions/role-permissions.service';
export declare class PermissionsGuard implements CanActivate {
    private reflector;
    private rolePermissionsService;
    constructor(reflector: Reflector, rolePermissionsService: RolePermissionsService);
    canActivate(context: ExecutionContext): boolean;
}
