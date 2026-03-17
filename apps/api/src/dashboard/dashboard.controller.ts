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

  @Get('stats')
  @Roles(Role.ADMIN, Role.STAFF, Role.ACCOUNTANT)
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('trends')
  @Roles(Role.ADMIN, Role.STAFF, Role.ACCOUNTANT)
  async getMonthlyTrends() {
    return this.dashboardService.getMonthlyTrends();
  }

  @Get('monthly-target')
  @Roles(Role.ADMIN, Role.STAFF, Role.ACCOUNTANT, Role.MANAGER)
  async getMonthlyDonorTarget() {
    return this.dashboardService.getMonthlyDonorTarget();
  }

  @Get('mode-split')
  @Roles(Role.ADMIN, Role.STAFF, Role.ACCOUNTANT)
  async getDonationModeSplit() {
    return this.dashboardService.getDonationModeSplit();
  }

  @Get('top-donors')
  @Roles(Role.ADMIN, Role.STAFF, Role.ACCOUNTANT)
  async getTopDonors() {
    return this.dashboardService.getTopDonors(5);
  }

  @Get('recent-donations')
  @Roles(Role.ADMIN, Role.STAFF, Role.ACCOUNTANT)
  async getRecentDonations() {
    return this.dashboardService.getRecentDonations(10);
  }

  @Get('insights')
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER, Role.ACCOUNTANT)
  async getAIInsights() {
    return this.dashboardService.getAIInsights();
  }

  @Get('donor-insights/:donorId')
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER, Role.ACCOUNTANT)
  async getDonorInsights(@Param('donorId') donorId: string) {
    return this.dashboardService.getDonorInsights(donorId);
  }

  @Get('impact')
  @Roles(Role.ADMIN, Role.STAFF, Role.MANAGER)
  async getImpactDashboard() {
    return this.dashboardService.getImpactDashboard();
  }

  @Get('retention')
  @Roles(Role.ADMIN, Role.STAFF, Role.MANAGER)
  async getRetentionAnalytics() {
    return this.dashboardService.getRetentionAnalytics();
  }

  @Get('insight-cards')
  @Roles(Role.ADMIN, Role.STAFF, Role.MANAGER)
  async getInsightCards() {
    return this.dashboardService.getInsightCards();
  }

  @Get('admin-insights')
  @Roles(Role.ADMIN)
  async getAdminInsights() {
    return this.dashboardService.getAdminInsights();
  }

  @Get('staff-actions')
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async getStaffActions() {
    return this.dashboardService.getStaffActions();
  }

  @Get('daily-actions')
  @Roles(Role.ADMIN, Role.STAFF, Role.TELECALLER)
  async getDailyActions() {
    return this.dashboardService.getDailyActions();
  }

  @Post('daily-actions/mark-done')
  @Roles(Role.ADMIN, Role.STAFF)
  async markActionDone(
    @CurrentUser() user: any,
    @Body() body: { donorId: string; actionType: string; description: string },
  ) {
    return this.dashboardService.markActionDone(user, body);
  }

  @Post('daily-actions/snooze')
  @Roles(Role.ADMIN, Role.STAFF)
  async snoozeAction(
    @CurrentUser() user: any,
    @Body() body: { donorId: string; actionType: string; description: string; days: number },
  ) {
    return this.dashboardService.snoozeAction(user, body);
  }
}
