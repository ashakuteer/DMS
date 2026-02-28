import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
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

  // ✅ IMPORTANT: put /users/staff BEFORE /users/:id
  @Get("staff")
  @RequirePermission("donors", "assign")
  listStaff() {
    return this.usersService.listStaffForAssignment();
  }

  @Get("staff-all")
  @Roles(Role.ADMIN)
  listAllStaff() {
    return this.usersService.listAllStaff();
  }

  @Post("create-staff")
  @Roles(Role.ADMIN)
  async createStaff(@Body() data: Record<string, any>) {
    return this.usersService.createStaff(data as any);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.usersService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(":id")
  @Roles(Role.ADMIN)
  async findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id/role")
  @Roles(Role.ADMIN)
  async updateRole(
    @Param("id") id: string,
    @Body("role") role: Role,
    @CurrentUser() user: UserContext,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.usersService.updateRole(
      id,
      role,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(":id/toggle-active")
  @Roles(Role.ADMIN)
  async toggleActive(@Param("id") id: string) {
    return this.usersService.toggleActive(id);
  }

  @Patch(":id/reassign-phone")
  @Roles(Role.ADMIN)
  async reassignPhone(
    @Param("id") fromUserId: string,
    @Body("toUserId") toUserId: string,
  ) {
    return this.usersService.reassignPhone(fromUserId, toUserId);
  }
}
