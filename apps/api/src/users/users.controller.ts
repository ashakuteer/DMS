import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Request } from "express";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

interface UserContext {
  id: string;
  role: Role;
  email: string;
}

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  private getClientInfo(req: Request) {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";
    const userAgent = (req.headers["user-agent"] as string) || "unknown";
    return { ipAddress, userAgent };
  }

  @Get("staff")
  @RequirePermission("donors", "assign")
  listStaff() {
    return this.usersService.listStaffForAssignment();
  }

  @Get("staff-all")
  @Roles(Role.ADMIN, Role.FOUNDER)
  listAllStaff() {
    return this.usersService.listAllStaff();
  }

  @Post("create-staff")
  @Roles(Role.ADMIN, Role.FOUNDER)
  async createStaff(@Body() data: Record<string, any>) {
    return this.usersService.createStaff(data as any);
  }

  @Get()
  @Roles(Role.ADMIN, Role.FOUNDER)
  async findAll(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.usersService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get(":id")
  @Roles(Role.ADMIN, Role.FOUNDER)
  async findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id/role")
  @Roles(Role.ADMIN, Role.FOUNDER)
  async updateRole(
    @Param("id") id: string,
    @Body("role") role: Role,
    @CurrentUser() user: UserContext,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.usersService.updateRole(id, role, user.id, ipAddress, userAgent);
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.FOUNDER)
  async updateUser(
    @Param("id") id: string,
    @Body() data: { name?: string; phone?: string; role?: Role },
  ) {
    return this.usersService.updateUser(id, data);
  }

  @Patch(":id/toggle-active")
  @Roles(Role.ADMIN, Role.FOUNDER)
  async toggleActive(@Param("id") id: string) {
    return this.usersService.toggleActive(id);
  }

  @Patch(":id/reset-password")
  @Roles(Role.ADMIN, Role.FOUNDER)
  async resetPassword(
    @Param("id") id: string,
    @Body("newPassword") newPassword: string,
  ) {
    return this.usersService.resetUserPassword(id, newPassword);
  }

  @Patch(":id/reassign-phone")
  @Roles(Role.ADMIN, Role.FOUNDER)
  async reassignPhone(
    @Param("id") fromUserId: string,
    @Body("toUserId") toUserId: string,
  ) {
    return this.usersService.reassignPhone(fromUserId, toUserId);
  }

  @Delete(":id")
  @Roles(Role.ADMIN, Role.FOUNDER)
  async deleteUser(@Param("id") id: string) {
    return this.usersService.deleteUser(id);
  }
}
