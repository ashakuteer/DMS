import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, CommunicationType } from '@prisma/client';
import { CommunicationLogService } from './communication-log.service';
import { AuditService } from '../audit/audit.service';

@Controller('communication-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommunicationLogController {
  constructor(
    private communicationLogService: CommunicationLogService,
    private auditService: AuditService,
  ) {}

  @Get('donor/:donorId')
  @Roles(Role.ADMIN, Role.STAFF)
  async getByDonorId(@Param('donorId') donorId: string) {
    return this.communicationLogService.findByDonorId(donorId);
  }

  @Get('donation/:donationId')
  @Roles(Role.ADMIN, Role.STAFF)
  async getByDonationId(@Param('donationId') donationId: string) {
    return this.communicationLogService.findByDonationId(donationId);
  }

  @Post('whatsapp')
  @Roles(Role.ADMIN, Role.STAFF)
  async logWhatsAppClick(
    @Body()
    body: {
      donorId: string;
      donationId?: string;
      templateId?: string;
      phoneNumber: string;
      messagePreview?: string;
      type?: string;
    },
    @Req() req: any,
  ) {
    const commType = body.type as CommunicationType || CommunicationType.GENERAL;
    
    const result = await this.communicationLogService.logWhatsApp({
      donorId: body.donorId,
      donationId: body.donationId,
      templateId: body.templateId,
      phoneNumber: body.phoneNumber,
      messagePreview: body.messagePreview,
      sentById: req.user.id,
      type: commType,
    });

    await this.auditService.logWhatsAppSend(req.user.id, 'Donor', body.donorId, {
      phoneNumber: body.phoneNumber,
      donationId: body.donationId,
      type: commType,
    });

    return result;
  }

  @Post('post-donation-action')
  @Roles(Role.ADMIN)
  async logPostDonationAction(
    @Body()
    body: {
      donorId: string;
      donationId?: string;
      action: 'send_email' | 'send_whatsapp' | 'remind_later' | 'skip';
    },
    @Req() req: any,
  ) {
    return this.communicationLogService.logPostDonationAction({
      donorId: body.donorId,
      donationId: body.donationId,
      action: body.action,
      sentById: req.user.id,
      userRole: req.user.role,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can delete communication logs');
    }
    return this.communicationLogService.delete(id);
  }
}
