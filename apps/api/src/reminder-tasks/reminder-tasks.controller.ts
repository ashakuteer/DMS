import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ReminderTasksService } from './reminder-tasks.service';

interface UserContext {
  id: string;
  email: string;
  role: Role;
}

@Controller('reminder-tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReminderTasksController {
  constructor(private reminderTasksService: ReminderTasksService) {}

  @Get()
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async getReminders(
    @CurrentUser() user: UserContext,
    @Query('filter') filter: 'today' | 'week' | 'month' | 'overdue' = 'today',
  ) {
    return this.reminderTasksService.getReminders(user, { filter });
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async getStats() {
    return this.reminderTasksService.getStats();
  }

  @Patch(':id/done')
  @Roles(Role.ADMIN, Role.STAFF)
  async markDone(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.reminderTasksService.markDone(user, id);
  }

  @Patch(':id/snooze')
  @Roles(Role.ADMIN, Role.STAFF)
  async snooze(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() body: { days: number },
  ) {
    return this.reminderTasksService.snooze(user, id, body.days);
  }

  @Post('generate')
  @Roles(Role.ADMIN)
  async generateReminders() {
    const count = await this.reminderTasksService.generateSpecialDayReminders();
    return { message: `Generated ${count} reminder tasks`, count };
  }

  @Post(':id/whatsapp-log')
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async logWhatsAppClick(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.reminderTasksService.logWhatsAppClick(user, id);
  }

  @Post(':id/send-email')
  @Roles(Role.ADMIN, Role.STAFF)
  async sendEmail(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.reminderTasksService.sendManualEmail(user, id);
  }

  @Post('process-auto-emails')
  @Roles(Role.ADMIN)
  async processAutoEmails() {
    const result = await this.reminderTasksService.processAutoEmails();
    return { message: `Processed auto emails: ${result.sent} sent, ${result.failed} failed`, ...result };
  }
}
