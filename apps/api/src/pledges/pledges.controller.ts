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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PledgesService, UserContext, FulfillPledgeDto } from './pledges.service';
import { Role, PledgeStatus } from '@prisma/client';
import { Request } from 'express';

@Controller('pledges')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PledgesController {
  constructor(private readonly pledgesService: PledgesService) {}

  private getClientInfo(req: Request) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket?.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return { ipAddress, userAgent };
  }

  @Get()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async findAll(
    @CurrentUser() user: UserContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('donorId') donorId?: string,
    @Query('status') status?: PledgeStatus,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.pledgesService.findAll(user, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      donorId,
      status,
      sortBy,
      sortOrder,
    });
  }

  @Get('donor/:donorId/suggestions')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getDonorPledgeSuggestions(@Param('donorId') donorId: string) {
    return this.pledgesService.getDonorPledgeSuggestions(donorId);
  }

  @Get(':id')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async findOne(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.pledgesService.findOne(user, id);
  }

  @Get(':id/whatsapp-text')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getWhatsAppText(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const pledge = await this.pledgesService.findOne(user, id);
    const text = await this.pledgesService.buildWhatsAppReminderText(pledge);
    return { text };
  }

  @Post()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async create(
    @CurrentUser() user: UserContext,
    @Body() data: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.pledgesService.create(user, data, ipAddress, userAgent);
  }

  @Patch(':id')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async update(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() data: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.pledgesService.update(user, id, data, ipAddress, userAgent);
  }

  @Post(':id/mark-fulfilled')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async markFulfilled(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() body: FulfillPledgeDto,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.pledgesService.markFulfilled(user, id, body || {}, ipAddress, userAgent);
  }

  @Post(':id/postpone')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async postpone(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() body: { newDate: string; notes?: string },
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.pledgesService.postpone(user, id, body.newDate, body.notes, ipAddress, userAgent);
  }

  @Post(':id/cancel')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async cancel(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.pledgesService.cancel(user, id, body?.reason, ipAddress, userAgent);
  }

  @Post(':id/send-reminder-email')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async sendReminderEmail(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.pledgesService.sendPledgeReminderEmail(user, id);
  }

  @Post(':id/log-whatsapp')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async logWhatsApp(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.pledgesService.logWhatsAppReminder(user, id);
  }

  @Delete(':id')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async delete(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    return this.pledgesService.delete(user, id, ipAddress, userAgent);
  }
}
