import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Single unified endpoint — replaces 13+ individual dashboard fetches.
   * Returns all sections in one parallel server-side batch.
   * Sections are null when the user's role lacks access to them.
   */
  @Get('summary')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getSummary(@CurrentUser() user: any) {
    return this.dashboardService.getSummary(user);
  }

  @Get('stats')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('trends')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getMonthlyTrends() {
    return this.dashboardService.getMonthlyTrends();
  }

  @Get('monthly-target')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getMonthlyDonorTarget() {
    return this.dashboardService.getMonthlyDonorTarget();
  }

  @Get('mode-split')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getDonationModeSplit() {
    return this.dashboardService.getDonationModeSplit();
  }

  @Get('top-donors')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getTopDonors() {
    return this.dashboardService.getTopDonors(5);
  }

  @Get('recent-donations')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getRecentDonations() {
    return this.dashboardService.getRecentDonations(10);
  }

  @Get('insights')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getAIInsights() {
    return this.dashboardService.getAIInsights();
  }

  @Get('donor-insights/:donorId')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getDonorInsights(@Param('donorId') donorId: string) {
    return this.dashboardService.getDonorInsights(donorId);
  }

  @Get('impact')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getImpactDashboard() {
    return this.dashboardService.getImpactDashboard();
  }

  @Get('retention')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getRetentionAnalytics() {
    return this.dashboardService.getRetentionAnalytics();
  }

  @Get('insight-cards')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getInsightCards() {
    return this.dashboardService.getInsightCards();
  }

  @Get('admin-insights')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async getAdminInsights() {
    return this.dashboardService.getAdminInsights();
  }

  @Get('staff-actions')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getStaffActions() {
    return this.dashboardService.getStaffActions();
  }

  @Get('daily-actions')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getDailyActions() {
    return this.dashboardService.getDailyActions();
  }

  @Post('daily-actions/mark-done')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async markActionDone(
    @CurrentUser() user: any,
    @Body() body: { donorId: string; actionType: string; description: string },
  ) {
    return this.dashboardService.markActionDone(user, body);
  }

  @Post('daily-actions/snooze')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async snoozeAction(
    @CurrentUser() user: any,
    @Body() body: { donorId: string; actionType: string; description: string; days: number },
  ) {
    return this.dashboardService.snoozeAction(user, body);
  }
}
