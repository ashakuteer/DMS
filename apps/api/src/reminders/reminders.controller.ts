import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RemindersService } from './reminders.service';

@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RemindersController {
  constructor(private remindersService: RemindersService) {}

  @Get('due')
  @Roles(Role.ADMIN, Role.STAFF)
  async getDueReminders() {
    return this.remindersService.getDueReminders();
  }

  @Patch(':id/complete')
  @Roles(Role.ADMIN, Role.STAFF)
  async markComplete(@Param('id') id: string, @Req() req: any) {
    return this.remindersService.markComplete(id, req.user.id, req.user.role);
  }

  @Patch(':id/snooze')
  @Roles(Role.ADMIN, Role.STAFF)
  async snooze(@Param('id') id: string, @Req() req: any) {
    return this.remindersService.snooze(id, req.user.id, req.user.role);
  }

  @Post(':id/log-action')
  @Roles(Role.ADMIN, Role.STAFF)
  async logAction(
    @Param('id') id: string,
    @Body() body: { donorId: string; donationId?: string; action: 'send_email' | 'send_whatsapp' },
    @Req() req: any,
  ) {
    return this.remindersService.logReminderAction({
      reminderId: id,
      donorId: body.donorId,
      donationId: body.donationId,
      action: body.action,
      userId: req.user.id,
      userRole: req.user.role,
    });
  }
}
