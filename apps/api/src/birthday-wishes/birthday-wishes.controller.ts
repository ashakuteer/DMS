import { Controller, Get, Post, Param, Query, UseGuards, Body } from '@nestjs/common';
import { BirthdayWishService } from './birthday-wishes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('birthday-wishes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BirthdayWishController {
  constructor(private readonly birthdayWishService: BirthdayWishService) {}

  @Get('upcoming')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getUpcoming(@Query('range') range?: string) {
    const validRange = range === 'today' ? 'today' : 'next7';
    return this.birthdayWishService.getUpcomingBirthdays(validRange);
  }

  @Get('upcoming-beneficiaries')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getUpcomingBeneficiaries(@Query('range') range?: string) {
    const validRange = range === 'today' ? 'today' : 'next7';
    return this.birthdayWishService.getUpcomingBeneficiaryBirthdays(validRange);
  }

  @Get('preview/:donorId')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getPreview(@Param('donorId') donorId: string) {
    return this.birthdayWishService.getWishPreview(donorId);
  }

  @Post('queue-email/:donorId')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async queueEmail(
    @Param('donorId') donorId: string,
    @CurrentUser() user: any,
  ) {
    return this.birthdayWishService.queueBirthdayEmail(donorId, user);
  }

  @Post('send-beneficiary-wish/:beneficiaryId')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async sendBeneficiaryWish(
    @Param('beneficiaryId') beneficiaryId: string,
    @CurrentUser() user: any,
  ) {
    return this.birthdayWishService.sendBeneficiaryBirthdayWish(beneficiaryId, user);
  }

  @Post('mark-sent/:donorId')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async markSent(
    @Param('donorId') donorId: string,
    @Body('channel') channel: 'EMAIL' | 'WHATSAPP',
    @CurrentUser() user: any,
  ) {
    return this.birthdayWishService.markSent(donorId, channel || 'WHATSAPP', user);
  }

  @Get('sent-log')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getSentLog(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.birthdayWishService.getSentLog(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('templates')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async getTemplates() {
    return this.birthdayWishService.getTemplates();
  }

  @Post('templates/:id')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: { subject?: string; body: string },
    @CurrentUser() user: any,
  ) {
    return this.birthdayWishService.updateTemplate(id, body, user.userId);
  }
}
