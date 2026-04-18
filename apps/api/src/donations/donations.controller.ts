import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { Request, Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { DonationsService, UserContext } from "./donations.service";
import { Role } from "@prisma/client";

@Controller("donations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  private getClientInfo(req: Request) {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";
    const userAgent = (req.headers["user-agent"] as string) || "unknown";
    return { ipAddress, userAgent };
  }

  @Get()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async findAll(
    @CurrentUser() user: UserContext,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("donorId") donorId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
    @Query("search") search?: string,
    @Query("donationType") donationType?: string,
    @Query("donationHomeType") donationHomeType?: string,
  ) {
    return this.donationsService.findAll(user, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      donorId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      search,
      donationType,
      donationHomeType,
    });
  }

  @Get("stats/by-home")
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getStatsByHome(@CurrentUser() user: UserContext) {
    return this.donationsService.getStatsByHome(user);
  }

  @Get("export")
  @Roles(Role.FOUNDER, Role.ADMIN)
  async exportDonations(
    @CurrentUser() user: UserContext,
    @Req() req: Request,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("donorId") donorId?: string,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donationsService.exportDonations(
      user,
      { startDate, endDate, donorId },
      ipAddress,
      userAgent,
    );
  }

  @Get("export/excel")
  @Roles(Role.FOUNDER, Role.ADMIN)
  async exportToExcel(
    @CurrentUser() user: UserContext,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("donationType") donationType?: string,
    @Query("donationHomeType") donationHomeType?: string,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);

    const buffer = await this.donationsService.exportToExcel(
      user,
      { startDate, endDate, donationType, donationHomeType },
      ipAddress,
      userAgent,
    );

    const filename = `donations_${new Date().toISOString().split("T")[0]}.xlsx`;
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get(":id/receipt")
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async downloadReceipt(
    @CurrentUser() user: UserContext,
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.donationsService.getReceiptPdf(user, id);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    });

    return new StreamableFile(result.buffer);
  }

  @Get(":id")
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async findOne(@CurrentUser() user: UserContext, @Param("id") id: string) {
    return this.donationsService.findOne(user, id);
  }

  @Post()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async create(
    @CurrentUser() user: UserContext,
    @Body() data: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donationsService.create(user, data, ipAddress, userAgent);
  }

  @Patch(":id")
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async update(
    @CurrentUser() user: UserContext,
    @Param("id") id: string,
    @Body() data: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donationsService.update(user, id, data, ipAddress, userAgent);
  }

  @Delete(":id")
  @Roles(Role.FOUNDER, Role.ADMIN)
  async remove(
    @CurrentUser() user: UserContext,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donationsService.softDelete(user, id, ipAddress, userAgent);
  }

  @Post(":id/regenerate-receipt")
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async regenerateReceipt(
    @CurrentUser() user: UserContext,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.donationsService.regenerateReceipt(
      user,
      id,
      ipAddress,
      userAgent,
    );
  }

  @Post(":id/resend-receipt")
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async resendReceipt(
    @CurrentUser() user: UserContext,
    @Param("id") id: string,
    @Body() body?: { emailType?: 'GENERAL' | 'TAX' | 'KIND' },
  ) {
    return this.donationsService.resendReceipt(user, id, body?.emailType);
  }

  @Post(":id/resend-whatsapp")
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async resendWhatsApp(
    @CurrentUser() user: UserContext,
    @Param("id") id: string,
  ) {
    return this.donationsService.resendWhatsApp(user, id);
  }
}
