import { Injectable } from '@nestjs/common';
import { DateFilter, PaginationParams, DonorReportParams, ReceiptAuditParams } from './reports.types';
import { ReportsQueryService } from './reports.query.service';
import { ReportsExportService } from './reports.export.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsQueryService: ReportsQueryService,
    private readonly reportsExportService: ReportsExportService,
  ) {}

  async getMonthlyDonations(filter: DateFilter, pagination: PaginationParams) {
    return this.reportsQueryService.getMonthlyDonations(filter, pagination);
  }

  async getDonorSummary(filter: DateFilter, pagination: PaginationParams) {
    return this.reportsQueryService.getDonorSummary(filter, pagination);
  }

  async getDonorReport(filter: DateFilter, params: DonorReportParams) {
    return this.reportsQueryService.getDonorReport(filter, params);
  }

  async exportDonorReportExcel(filter: DateFilter): Promise<Buffer> {
    return this.reportsExportService.exportDonorReportExcel(filter);
  }

  async exportDonorReportPdf(filter: DateFilter): Promise<Buffer> {
    return this.reportsExportService.exportDonorReportPdf(filter);
  }

  async getReceiptsAudit(filter: DateFilter, params: ReceiptAuditParams) {
    return this.reportsQueryService.getReceiptsAudit(filter, params);
  }

  async exportReceiptsAuditExcel(filter: DateFilter, paymentMode?: string): Promise<Buffer> {
    return this.reportsExportService.exportReceiptsAuditExcel(filter, paymentMode);
  }

  async exportReceiptsAuditPdf(filter: DateFilter, paymentMode?: string): Promise<Buffer> {
    return this.reportsExportService.exportReceiptsAuditPdf(filter, paymentMode);
  }

  async getReceiptRegister(filter: DateFilter, pagination: PaginationParams) {
    return this.reportsQueryService.getReceiptRegister(filter, pagination);
  }

  async exportMonthlyDonationsExcel(filter: DateFilter): Promise<Buffer> {
    return this.reportsExportService.exportMonthlyDonationsExcel(filter);
  }

  async exportMonthlyDonationsPdf(filter: DateFilter): Promise<Buffer> {
    return this.reportsExportService.exportMonthlyDonationsPdf(filter);
  }

  async exportDonorSummaryExcel(filter: DateFilter): Promise<Buffer> {
    return this.reportsExportService.exportDonorSummaryExcel(filter);
  }

  async exportDonorSummaryPdf(filter: DateFilter): Promise<Buffer> {
    return this.reportsExportService.exportDonorSummaryPdf(filter);
  }

  async exportReceiptRegisterExcel(filter: DateFilter): Promise<Buffer> {
    return this.reportsExportService.exportReceiptRegisterExcel(filter);
  }

  async exportReceiptRegisterPdf(filter: DateFilter): Promise<Buffer> {
    return this.reportsExportService.exportReceiptRegisterPdf(filter);
  }

  async generateBoardSummaryPdf(): Promise<Buffer> {
    return this.reportsExportService.generateBoardSummaryPdf();
  }
}
