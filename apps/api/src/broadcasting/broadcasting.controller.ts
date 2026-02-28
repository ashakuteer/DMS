import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { BroadcastingService, BroadcastFilters } from './broadcasting.service';

@Controller('broadcasting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BroadcastingController {
  constructor(private readonly broadcastingService: BroadcastingService) {}

  @Post('preview')
  @Roles(Role.ADMIN, Role.MANAGER)
  async previewAudience(
    @Body() body: { filters: BroadcastFilters; channel: 'WHATSAPP' | 'EMAIL' },
  ) {
    return this.broadcastingService.previewAudience(body.filters, body.channel);
  }

  @Post('send')
  @Roles(Role.ADMIN, Role.MANAGER)
  async sendBroadcast(
    @CurrentUser() user: any,
    @Body() body: {
      channel: 'WHATSAPP' | 'EMAIL';
      filters: BroadcastFilters;
      contentSid?: string;
      contentVariables?: Record<string, string>;
      emailSubject?: string;
      emailBody?: string;
    },
  ) {
    return this.broadcastingService.sendBroadcast(body, user.id);
  }

  @Get('whatsapp-templates')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getWhatsAppTemplates() {
    return this.broadcastingService.getAvailableWhatsAppTemplates();
  }

  @Get('email-templates')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getEmailTemplates() {
    return this.broadcastingService.getAvailableEmailTemplates();
  }

  @Get('staff-list')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getStaffList() {
    return this.broadcastingService.getStaffList();
  }
}
