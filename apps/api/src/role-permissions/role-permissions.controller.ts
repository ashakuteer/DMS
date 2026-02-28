import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { RolePermissionsService } from './role-permissions.service';
import { Request } from 'express';

interface UserContext {
  id: string;
  role: Role;
  email: string;
}

@Controller('role-permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolePermissionsController {
  constructor(private rolePermissionsService: RolePermissionsService) {}

  private getClientInfo(req: Request) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket?.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return { ipAddress, userAgent };
  }

  @Get('my')
  async getMyPermissions(@CurrentUser() user: UserContext) {
    return this.rolePermissionsService.getMyPermissions(user.role);
  }

  @Get('matrix')
  @Roles(Role.ADMIN)
  async getPermissionMatrix() {
    return this.rolePermissionsService.getPermissionMatrix();
  }

  @Get('roles')
  @Roles(Role.ADMIN)
  async getAllRoles() {
    return this.rolePermissionsService.getAllRoles();
  }

  @Get('modules')
  @Roles(Role.ADMIN)
  async getAllModules() {
    const modules = this.rolePermissionsService.getAllModules();
    return modules.map((m) => ({
      name: m,
      actions: this.rolePermissionsService.getModuleActions(m),
    }));
  }

  @Get('role/:role')
  @Roles(Role.ADMIN)
  async getRolePermissions(@Param('role') role: Role) {
    return this.rolePermissionsService.getRolePermissions(role);
  }

  @Patch('role/:role')
  @Roles(Role.ADMIN)
  async updateRolePermissions(
    @Param('role') role: Role,
    @Body() body: { permissions: { module: string; action: string; allowed: boolean }[] },
    @CurrentUser() user: UserContext,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.rolePermissionsService.bulkUpdateRolePermissions(
      role,
      body.permissions,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch('single')
  @Roles(Role.ADMIN)
  async updateSinglePermission(
    @Body() body: { role: Role; module: string; action: string; allowed: boolean },
    @CurrentUser() user: UserContext,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.rolePermissionsService.updateRolePermission(
      body.role,
      body.module,
      body.action,
      body.allowed,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Get('sensitive-fields')
  @Roles(Role.ADMIN)
  async getSensitiveFieldConfigs() {
    return this.rolePermissionsService.getSensitiveFieldConfigs();
  }

  @Patch('sensitive-fields')
  @Roles(Role.ADMIN)
  async updateSensitiveFieldConfig(
    @Body() body: { module: string; fieldName: string; roles: Role[] },
    @CurrentUser() user: UserContext,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.rolePermissionsService.updateSensitiveFieldConfig(
      body.module,
      body.fieldName,
      body.roles,
      user.id,
      ipAddress,
      userAgent,
    );
  }
}
