import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { DonorReportStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { ReportData } from './donor-reports.types';

@Injectable()
export class DonorReportsExportService {
  private readonly logger = new Logger(DonorReportsExportService.name);

  private readonly fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);

  constructor(private orgProfileService: OrganizationProfileService) {}

  async generatePdf(report: any): Promise<Buffer> {
    if (
      report.status !== DonorReportStatus.READY &&
      report.status !== DonorReportStatus.SHARED
    ) {
      throw new BadRequestException('Report is not ready for download');
    }

    const data = report.reportData as unknown as ReportData;
    const template = report.template;
    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;
    const primaryColor = orgProfile.brandingPrimaryColor || '#2E7D32';

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.rect(0, 0, 595, 60).fill(primaryColor);
      doc.fill('#FFFFFF').fontSize(16).font('Helvetica-Bold');
      doc.text(template?.headerText || orgName, 40, 15, { align: 'center', width: 515 });
      doc.fontSize(11).font('Helvetica');
      doc.text(report.title, 40, 37, { align: 'center', width: 515 });

      doc.fill('#333333');
      doc.moveDown(2);
      const y0 = doc.y;
      doc.fontSize(9).text(
        `Period: ${new Date(report.periodStart).toLocaleDateString('en-IN')} - ${new Date(report.periodEnd).toLocaleDateString('en-IN')}`,
        40,
        y0,
      );
      doc.text(
        `Generated: ${new Date(report.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}`,
        40,
        y0 + 14,
      );
      doc.text(`Type: ${report.type}`, 40, y0 + 28);
      if (data.donorDetail) {
        doc.text(`Donor: ${data.donorDetail.name} (${data.donorDetail.code})`, 40, y0 + 42);
      }
      doc.moveDown(2);

      if (template?.showDonationSummary !== false) {
        this.pdfSection(doc, 'Summary');
        const summaryItems = [
          ['Total Donations', `${data.summary.totalDonations}`],
          ['Total Amount', this.fmt(data.summary.totalAmount)],
          ['Unique Donors', `${data.summary.uniqueDonors}`],
          ['Beneficiaries Supported', `${data.summary.beneficiariesSupported}`],
          ['Active Sponsorships', `${data.summary.activeSponsorships}`],
          ['Campaigns Active', `${data.summary.campaignsActive}`],
        ];

        const colW = 170;
        let sx = 40;
        let sy = doc.y;
        for (let i = 0; i < summaryItems.length; i++) {
          if (i > 0 && i % 3 === 0) {
            sx = 40;
            sy += 40;
          }
          doc.rect(sx, sy, colW - 5, 35).fill('#F5F5F5').stroke();
          doc.fill('#333333').fontSize(8).font('Helvetica').text(summaryItems[i][0], sx + 8, sy + 5);
          doc.fontSize(12).font('Helvetica-Bold').text(summaryItems[i][1], sx + 8, sy + 17);
          sx += colW;
        }
        doc.y = sy + 50;
      }

      if (template?.showDonationBreakdown !== false && data.donationsByType.length > 0) {
        this.pdfSection(doc, 'Donations by Type');
        this.pdfTable(
          doc,
          ['Type', 'Count', 'Amount'],
          data.donationsByType.map((d) => [d.type?.replace(/_/g, ' '), `${d.count}`, this.fmt(d.amount)]),
        );
      }

      if (data.donationsByMonth.length > 0) {
        if (doc.y > 650) doc.addPage();
        this.pdfSection(doc, 'Monthly Breakdown');
        this.pdfTable(
          doc,
          ['Month', 'Count', 'Amount'],
          data.donationsByMonth.map((d) => [d.month, `${d.count}`, this.fmt(d.amount)]),
        );
      }

      if (template?.showBeneficiaries !== false && data.beneficiaries.length > 0) {
        if (doc.y > 600) doc.addPage();
        this.pdfSection(doc, 'Beneficiaries Supported');
        this.pdfTable(
          doc,
          ['Name', 'Home', 'Sponsors'],
          data.beneficiaries.map((b) => [b.name, b.home, `${b.sponsors}`]),
        );
      }

      if (template?.showCampaigns !== false && data.campaigns.length > 0) {
        if (doc.y > 600) doc.addPage();
        this.pdfSection(doc, 'Campaigns');
        this.pdfTable(
          doc,
          ['Campaign', 'Goal', 'Raised', 'Status'],
          data.campaigns.map((c) => [c.name, this.fmt(c.goal), this.fmt(c.raised), c.status]),
        );
      }

      if (template?.showUsageSummary !== false && data.usageSummary.length > 0) {
        if (doc.y > 600) doc.addPage();
        this.pdfSection(doc, 'Usage Summary');
        this.pdfTable(
          doc,
          ['Category', 'Amount', 'Percentage'],
          data.usageSummary.map((u) => [u.category, this.fmt(u.amount), `${u.percentage}%`]),
        );
      }

      if (data.donorDetail) {
        if (doc.y > 500) doc.addPage();
        this.pdfSection(doc, 'Donor Details');
        doc.fontSize(9).font('Helvetica');
        doc.text(`Name: ${data.donorDetail.name}`, 40);
        doc.text(`Code: ${data.donorDetail.code}`);
        doc.text(`Email: ${data.donorDetail.email}`);
        doc.text(`Total Donated: ${this.fmt(data.donorDetail.totalDonated)}`);
        doc.text(`Donation Count: ${data.donorDetail.donationCount}`);
        doc.moveDown(0.5);

        if (data.donorDetail.sponsoredBeneficiaries.length > 0) {
          doc.font('Helvetica-Bold').text('Sponsored Beneficiaries:');
          doc.font('Helvetica');
          for (const b of data.donorDetail.sponsoredBeneficiaries) {
            doc.text(`  - ${b.name} (${b.home})`);
          }
          doc.moveDown(0.5);
        }

        if (data.donorDetail.donations.length > 0) {
          this.pdfTable(
            doc,
            ['Date', 'Amount', 'Type', 'Receipt', 'Purpose'],
            data.donorDetail.donations.map((d) => [d.date, this.fmt(d.amount), d.type, d.receipt, d.purpose]),
          );
        }
      }

      if (template?.footerText) {
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica').fillColor('#666666').text(template.footerText, { align: 'center' });
      }

      doc.moveDown(1);
      doc.fontSize(7).fillColor('#999999').text('This report was auto-generated by NGO DMS.', { align: 'center' });
      doc.end();
    });
  }

  async generateExcel(report: any): Promise<Buffer> {
    if (
      report.status !== DonorReportStatus.READY &&
      report.status !== DonorReportStatus.SHARED
    ) {
      throw new BadRequestException('Report is not ready for download');
    }

    const data = report.reportData as unknown as ReportData;
    const template = report.template;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NGO DMS';
    workbook.created = new Date();

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4D3A' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };

    if (template?.showDonationSummary !== false) {
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 25 },
      ];
      summarySheet.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));

      summarySheet.addRow({ metric: 'Report Title', value: report.title });
      summarySheet.addRow({
        metric: 'Period',
        value: `${new Date(report.periodStart).toLocaleDateString('en-IN')} - ${new Date(report.periodEnd).toLocaleDateString('en-IN')}`,
      });
      summarySheet.addRow({ metric: 'Total Donations', value: data.summary.totalDonations });
      summarySheet.addRow({ metric: 'Total Amount', value: data.summary.totalAmount });
      summarySheet.addRow({ metric: 'Unique Donors', value: data.summary.uniqueDonors });
      summarySheet.addRow({
        metric: 'Beneficiaries Supported',
        value: data.summary.beneficiariesSupported,
      });
      summarySheet.addRow({ metric: 'Active Sponsorships', value: data.summary.activeSponsorships });
      summarySheet.addRow({ metric: 'Active Campaigns', value: data.summary.campaignsActive });
    }

    if (template?.showDonationBreakdown !== false) {
      const typeSheet = workbook.addWorksheet('By Type');
      typeSheet.columns = [
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Amount', key: 'amount', width: 20 },
      ];
      typeSheet.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));
      for (const d of data.donationsByType) {
        typeSheet.addRow({ type: d.type?.replace(/_/g, ' '), count: d.count, amount: d.amount });
      }

      const purposeSheet = workbook.addWorksheet('By Purpose');
      purposeSheet.columns = [
        { header: 'Purpose', key: 'purpose', width: 25 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Amount', key: 'amount', width: 20 },
      ];
      purposeSheet.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));
      for (const d of data.donationsByPurpose) {
        purposeSheet.addRow({ purpose: d.type?.replace(/_/g, ' '), count: d.count, amount: d.amount });
      }

      const monthSheet = workbook.addWorksheet('Monthly');
      monthSheet.columns = [
        { header: 'Month', key: 'month', width: 20 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Amount', key: 'amount', width: 20 },
      ];
      monthSheet.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));
      for (const d of data.donationsByMonth) {
        monthSheet.addRow(d);
      }
    }

    if (data.topDonors.length > 0) {
      const donorSheet = workbook.addWorksheet('Top Donors');
      donorSheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Code', key: 'code', width: 15 },
        { header: 'Amount', key: 'amount', width: 20 },
        { header: 'Donations', key: 'count', width: 15 },
      ];
      donorSheet.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));
      for (const d of data.topDonors) {
        donorSheet.addRow(d);
      }
    }

    if (template?.showBeneficiaries !== false && data.beneficiaries.length > 0) {
      const benSheet = workbook.addWorksheet('Beneficiaries');
      benSheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Home', key: 'home', width: 20 },
        { header: 'Sponsors', key: 'sponsors', width: 15 },
      ];
      benSheet.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));
      for (const b of data.beneficiaries) {
        benSheet.addRow(b);
      }
    }

    if (template?.showUsageSummary !== false && data.usageSummary.length > 0) {
      const usageSheet = workbook.addWorksheet('Usage Summary');
      usageSheet.columns = [
        { header: 'Category', key: 'category', width: 25 },
        { header: 'Amount', key: 'amount', width: 20 },
        { header: 'Percentage', key: 'percentage', width: 15 },
      ];
      usageSheet.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));
      for (const u of data.usageSummary) {
        usageSheet.addRow({ ...u, percentage: `${u.percentage}%` });
      }
    }

    if (data.donorDetail && data.donorDetail.donations.length > 0) {
      const detailSheet = workbook.addWorksheet('Donor Donations');
      detailSheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Amount', key: 'amount', width: 20 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Receipt', key: 'receipt', width: 20 },
        { header: 'Purpose', key: 'purpose', width: 20 },
      ];
      detailSheet.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));
      for (const d of data.donorDetail.donations) {
        detailSheet.addRow(d);
      }
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private pdfSection(doc: PDFKit.PDFDocument, title: string, sectionColor = '#1E4D3A') {
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').fill(sectionColor).text(title, 40);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor(sectionColor).lineWidth(1).stroke();
    doc.moveDown(0.3);
    doc.fill('#333333');
  }

  private pdfTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][]) {
    const colCount = headers.length;
    const tableWidth = 515;
    const colW = tableWidth / colCount;
    const startX = 40;
    let y = doc.y;

    doc.fontSize(8).font('Helvetica-Bold');
    doc.rect(startX, y, tableWidth, 16).fill('#E8E8E8');
    doc.fill('#333333');
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], startX + i * colW + 4, y + 4, { width: colW - 8, lineBreak: false });
    }
    y += 16;

    doc.font('Helvetica').fontSize(8);
    for (const row of rows) {
      if (y > 740) {
        doc.addPage();
        y = 40;
      }
      for (let i = 0; i < row.length; i++) {
        doc.text(row[i] || '', startX + i * colW + 4, y + 3, {
          width: colW - 8,
          lineBreak: false,
        });
      }
      y += 15;
    }
    doc.y = y + 5;
  }
}
