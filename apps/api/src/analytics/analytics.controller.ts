import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary() {
    return this.analyticsService.getSummary();
  }

  @Get('charts')
  async getCharts() {
    return this.analyticsService.getCharts();
  }

  @Get('segments')
  async getSegment(@Query('segment') segment: string) {
    return this.analyticsService.getSegment(segment || 'top');
  }

  @Get('donations/export')
  async exportDonationsDetail(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('home') home: string,
    @Query('type') type: string,
    @Res() res: Response,
  ) {
    const buffer = await this.analyticsService.exportDonationsDetailXlsx({ from, to, home, type });
    const filename = `donations-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('export/pdf')
  async exportPdf(@Res() res: Response) {
    const summary = await this.analyticsService.getSummary();
const buffer = await this.analyticsService.exportSummaryPdf(summary);
    const filename = `analytics-summary-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('export/xlsx')
  async exportXlsx(
    @Query('type') type: string,
    @Res() res: Response,
  ) {
    let buffer: Buffer;
    let filename: string;

    if (type === 'risk') {
      buffer = await this.analyticsService.exportRiskXlsx();
      filename = `donors-at-risk-${new Date().toISOString().split('T')[0]}.xlsx`;
    } else {
      buffer = await this.analyticsService.exportDonationsXlsx();
      filename = `donations-analytics-${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('donor-segmentation')
  async getDonorSegmentation() {
    return this.analyticsService.getDonorSegmentation();
  }

  @Get('management')
  async getManagementDashboard() {
    return this.analyticsService.getManagementDashboard();
  }

  @Get('management/export/pdf')
  async exportBoardPdf(@Res() res: Response) {
    const buffer = await this.analyticsService.exportBoardSummaryPdf();
    const filename = `board-summary-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('management/export/xlsx')
  async exportManagementXlsx(@Res() res: Response) {
    const buffer = await this.analyticsService.exportHomeTotalsXlsx();
    const filename = `home-totals-risk-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
