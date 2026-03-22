import { Controller, Get, Post, Query, Res, Body, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { SmartReportsService } from './smart-reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly smartReportsService: SmartReportsService,
  ) {}

  @Get()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getSmartReport(
    @Query('groupBy') groupBy: string = 'gender',
    @Query('gender') gender?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('country') country?: string,
    @Query('profession') profession?: string,
    @Query('category') category?: string,
    @Query('occasion') occasion?: string,
    @Query('donationType') donationType?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('visited') visited?: string,
  ) {
    const filters: any = {};
    if (gender) filters.gender = gender;
    if (city) filters.city = city;
    if (state) filters.state = state;
    if (country) filters.country = country;
    if (profession) filters.profession = profession;
    if (category) filters.category = category;
    if (occasion) filters.occasion = occasion;
    if (donationType) filters.donationType = donationType;
    if (minAmount) filters.minAmount = parseFloat(minAmount);
    if (maxAmount) filters.maxAmount = parseFloat(maxAmount);
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (visited !== undefined) filters.visited = visited === 'true';

    return this.smartReportsService.getSmartReport(filters, groupBy as any);
  }

  @Get('export')
  @Roles(Role.FOUNDER)
  async exportSmartReport(
    @Query('format') format: string = 'excel',
    @Query('groupBy') groupBy: string = 'gender',
    @Query('gender') gender?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('country') country?: string,
    @Query('profession') profession?: string,
    @Query('category') category?: string,
    @Query('occasion') occasion?: string,
    @Query('donationType') donationType?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('visited') visited?: string,
    @Res() res?: Response,
  ) {
    const filters: any = {};
    if (gender) filters.gender = gender;
    if (city) filters.city = city;
    if (state) filters.state = state;
    if (country) filters.country = country;
    if (profession) filters.profession = profession;
    if (category) filters.category = category;
    if (occasion) filters.occasion = occasion;
    if (donationType) filters.donationType = donationType;
    if (minAmount) filters.minAmount = parseFloat(minAmount);
    if (maxAmount) filters.maxAmount = parseFloat(maxAmount);
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (visited !== undefined) filters.visited = visited === 'true';

    if (format === 'pdf') {
      const buffer = await this.smartReportsService.exportPdf(filters, groupBy as any);
      res!.setHeader('Content-Type', 'application/pdf');
      res!.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.pdf"`);
      res!.send(buffer);
    } else {
      const buffer = await this.smartReportsService.exportExcel(filters, groupBy as any);
      res!.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res!.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.xlsx"`);
      res!.send(buffer);
    }
  }

  @Post('save')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async saveReport(@Body() body: { name: string; filters: any; groupBy: string }) {
    return this.smartReportsService.saveReport(body.name, body.filters, body.groupBy);
  }

  @Get('history')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async getReportHistory() {
    return this.smartReportsService.getReportHistory();
  }

  @Get('analytics')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getAnalytics() {
    return this.smartReportsService.getAnalytics();
  }

  @Get('monthly-donations')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async getMonthlyDonations(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.reportsService.getMonthlyDonations(
      { startDate, endDate },
      { page: parseInt(page || '1'), limit: parseInt(limit || '20'), search },
    );
  }

  // New Donor-wise Summary endpoint (ADMIN ONLY)
  @Get('donors')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async getDonorReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.reportsService.getDonorReport(
      { startDate, endDate },
      { 
        page: parseInt(page || '1'), 
        limit: parseInt(limit || '20'), 
        search,
        sortBy: (sortBy as 'lifetime' | 'fy' | 'lastDonation') || 'lifetime',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
      },
    );
  }

  @Get('donors/export/excel')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async exportDonorReportExcel(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportDonorReportExcel({ startDate, endDate });
    const filename = `donor-summary-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('donors/export/pdf')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async exportDonorReportPdf(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportDonorReportPdf({ startDate, endDate });
    const filename = `donor-summary-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('donor-summary')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async getDonorSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.reportsService.getDonorSummary(
      { startDate, endDate },
      { page: parseInt(page || '1'), limit: parseInt(limit || '20'), search },
    );
  }

  // Board Summary PDF - ADMIN ONLY
  @Get('board-summary')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async getBoardSummaryPdf(@Res() res: Response) {
    const buffer = await this.reportsService.generateBoardSummaryPdf();
    const filename = `board-summary-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  // New Receipt Register (Audit) - ADMIN ONLY
  @Get('receipts')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async getReceiptsAudit(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('paymentMode') paymentMode?: string,
  ) {
    return this.reportsService.getReceiptsAudit(
      { startDate, endDate },
      { 
        page: parseInt(page || '1'), 
        limit: parseInt(limit || '20'), 
        search,
        paymentMode,
      },
    );
  }

  @Get('receipts/export/excel')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async exportReceiptsAuditExcel(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('paymentMode') paymentMode: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportReceiptsAuditExcel(
      { startDate, endDate },
      paymentMode,
    );
    const filename = `receipt-register-audit-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('receipts/export/pdf')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async exportReceiptsAuditPdf(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('paymentMode') paymentMode: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportReceiptsAuditPdf(
      { startDate, endDate },
      paymentMode,
    );
    const filename = `receipt-register-audit-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('receipt-register')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async getReceiptRegister(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.reportsService.getReceiptRegister(
      { startDate, endDate },
      { page: parseInt(page || '1'), limit: parseInt(limit || '20'), search },
    );
  }

  @Get('monthly-donations/export/excel')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async exportMonthlyDonationsExcel(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportMonthlyDonationsExcel({ startDate, endDate });
    const filename = `monthly-donations-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('monthly-donations/export/pdf')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async exportMonthlyDonationsPdf(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportMonthlyDonationsPdf({ startDate, endDate });
    const filename = `monthly-donations-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('donor-summary/export/excel')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async exportDonorSummaryExcel(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportDonorSummaryExcel({ startDate, endDate });
    const filename = `donor-summary-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('donor-summary/export/pdf')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async exportDonorSummaryPdf(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportDonorSummaryPdf({ startDate, endDate });
    const filename = `donor-summary-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('receipt-register/export/excel')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async exportReceiptRegisterExcel(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportReceiptRegisterExcel({ startDate, endDate });
    const filename = `receipt-register-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('receipt-register/export/pdf')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async exportReceiptRegisterPdf(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportReceiptRegisterPdf({ startDate, endDate });
    const filename = `receipt-register-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
