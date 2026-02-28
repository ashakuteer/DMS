import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { DonorReportsService } from './donor-reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, DonorReportType } from '@prisma/client';

@Controller('donor-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonorReportsController {
  constructor(private readonly service: DonorReportsService) {}

  @Post('generate')
  @Roles(Role.ADMIN)
  async generate(
    @Body() body: {
      type: DonorReportType;
      periodStart: string;
      periodEnd: string;
      donorId?: string;
      campaignId?: string;
      templateId?: string;
      title?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.service.generate(body, user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('donorId') donorId?: string,
  ) {
    return this.service.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      { type, donorId },
    );
  }

  @Get('templates')
  @Roles(Role.ADMIN)
  async getTemplates() {
    return this.service.getTemplates();
  }

  @Get('campaigns')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  async getCampaigns() {
    return this.service.getCampaigns();
  }

  @Get('search-donors')
  @Roles(Role.ADMIN)
  async searchDonors(@Query('search') search: string, @Query('limit') limit?: string) {
    return this.service.searchDonors(search, limit ? parseInt(limit) : 20);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/download/pdf')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.generatePdf(id);
    const filename = `donor-report-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(':id/download/excel')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  async downloadExcel(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.generateExcel(id);
    const filename = `donor-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post(':id/share')
  @Roles(Role.ADMIN)
  async shareReport(
    @Param('id') id: string,
    @Body() body: { donorIds: string[] },
    @CurrentUser() user: any,
  ) {
    return this.service.shareReport(id, body.donorIds, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteReport(@Param('id') id: string) {
    return this.service.deleteReport(id);
  }

  @Post('templates')
  @Roles(Role.ADMIN)
  async createTemplate(
    @Body() body: {
      name: string;
      headerText?: string;
      footerText?: string;
      showDonationSummary?: boolean;
      showDonationBreakdown?: boolean;
      showBeneficiaries?: boolean;
      showCampaigns?: boolean;
      showUsageSummary?: boolean;
      isDefault?: boolean;
    },
    @CurrentUser() user: any,
  ) {
    return this.service.createTemplate(body, user);
  }

  @Patch('templates/:id')
  @Roles(Role.ADMIN)
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      headerText?: string;
      footerText?: string;
      showDonationSummary?: boolean;
      showDonationBreakdown?: boolean;
      showBeneficiaries?: boolean;
      showCampaigns?: boolean;
      showUsageSummary?: boolean;
      isDefault?: boolean;
    },
  ) {
    return this.service.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  @Roles(Role.ADMIN)
  async deleteTemplate(@Param('id') id: string) {
    return this.service.deleteTemplate(id);
  }
}
