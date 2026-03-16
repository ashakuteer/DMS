import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { DateFilter } from './reports.types';
import { getFYDates, formatLakh } from './reports.helpers';
import { ReportsQueryService } from './reports.query.service';

@Injectable()
export class ReportsExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orgProfileService: OrganizationProfileService,
    private readonly reportsQueryService: ReportsQueryService,
  ) {}

  async exportDonorReportExcel(filter: DateFilter): Promise<Buffer> {
    const allDonors = await this.reportsQueryService.getDonorReport(filter, {
      page: 1,
      limit: 10000,
      sortBy: 'lifetime',
      sortOrder: 'desc',
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Donor-wise Summary');

    sheet.columns = [
      { header: 'Donor ID', key: 'donorCode', width: 18 },
      { header: 'Donor Name', key: 'donorName', width: 28 },
      { header: 'City', key: 'city', width: 18 },
      { header: 'Country', key: 'country', width: 15 },
      { header: 'Lifetime Total (₹)', key: 'lifetimeTotal', width: 18 },
      { header: 'FY Total (₹)', key: 'fyTotal', width: 15 },
      { header: 'Donation Count', key: 'donationCount', width: 15 },
      { header: 'Last Donation', key: 'lastDonation', width: 15 },
      { header: 'Health Status', key: 'healthStatus', width: 15 },
    ];

    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A7C59' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    allDonors.data.forEach((d: any) => {
      sheet.addRow({
        donorCode: d.donorCode,
        donorName: d.donorName,
        city: d.city || '-',
        country: d.country,
        lifetimeTotal: d.lifetimeTotal,
        fyTotal: d.fyTotal,
        donationCount: d.donationCount,
        lastDonation: d.lastDonation
          ? new Date(d.lastDonation).toLocaleDateString('en-IN')
          : '-',
        healthStatus: d.healthStatus,
      });
    });

    sheet.addRow({});
    const totalLifetime = allDonors.data.reduce(
      (sum: number, d: any) => sum + d.lifetimeTotal,
      0,
    );
    const totalFY = allDonors.data.reduce((sum: number, d: any) => sum + d.fyTotal, 0);
    const summaryRow = sheet.addRow({
      donorCode: 'TOTAL',
      donorName: `${allDonors.data.length} Donors`,
      lifetimeTotal: totalLifetime,
      fyTotal: totalFY,
      donationCount: allDonors.data.reduce(
        (sum: number, d: any) => sum + d.donationCount,
        0,
      ),
    });
    summaryRow.font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportDonorReportPdf(filter: DateFilter): Promise<Buffer> {
    const [allDonors, orgProfile] = await Promise.all([
      this.reportsQueryService.getDonorReport(filter, {
        page: 1,
        limit: 10000,
        sortBy: 'lifetime',
        sortOrder: 'desc',
      }),
      this.orgProfileService.getProfile(),
    ]);
    const orgName = orgProfile.name;

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(16).font('Helvetica-Bold').text(orgName, { align: 'center' });
      doc.fontSize(14).text('Donor-wise Summary Report', { align: 'center' });
      doc.moveDown(0.3);

      const dateRange =
        filter.startDate && filter.endDate
          ? `FY Period: ${new Date(filter.startDate).toLocaleDateString('en-IN')} to ${new Date(filter.endDate).toLocaleDateString('en-IN')}`
          : 'Current Financial Year';
      doc.fontSize(10).font('Helvetica').text(dateRange, { align: 'center' });
      doc
        .fontSize(9)
        .text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
      doc.moveDown();

      const tableTop = doc.y;
      const colWidths = [75, 110, 70, 60, 80, 70, 55, 70, 60];
      const headers = [
        'Donor ID',
        'Name',
        'City',
        'Country',
        'Lifetime (₹)',
        'FY (₹)',
        'Count',
        'Last Donation',
        'Health',
      ];

      let x = 30;
      doc.font('Helvetica-Bold').fontSize(8);
      doc.rect(30, tableTop - 3, 760, 16).fill('#4A7C59');
      doc.fill('#FFFFFF');
      headers.forEach((header, i) => {
        doc.text(header, x + 2, tableTop, { width: colWidths[i] - 4, align: 'left' });
        x += colWidths[i];
      });

      let y = tableTop + 18;
      doc.fill('#000000').font('Helvetica').fontSize(7);

      allDonors.data.slice(0, 35).forEach((d: any, index: number) => {
        if (y > 520) {
          doc.addPage();
          y = 40;
        }

        if (index % 2 === 0) {
          doc.rect(30, y - 2, 760, 14).fill('#F5F5F5');
          doc.fill('#000000');
        }

        x = 30;
        const rowData = [
          d.donorCode,
          d.donorName.substring(0, 22),
          (d.city || '-').substring(0, 12),
          (d.country || 'India').substring(0, 10),
          `₹${d.lifetimeTotal.toLocaleString('en-IN')}`,
          `₹${d.fyTotal.toLocaleString('en-IN')}`,
          d.donationCount.toString(),
          d.lastDonation ? new Date(d.lastDonation).toLocaleDateString('en-IN') : '-',
          d.healthStatus,
        ];
        rowData.forEach((cell, i) => {
          doc.text(cell, x + 2, y, { width: colWidths[i] - 4, align: 'left' });
          x += colWidths[i];
        });
        y += 14;
      });

      doc.moveDown(2);
      const totalLifetime = allDonors.data.reduce(
        (sum: number, d: any) => sum + d.lifetimeTotal,
        0,
      );
      const totalFY = allDonors.data.reduce((sum: number, d: any) => sum + d.fyTotal, 0);
      const healthyCt = allDonors.data.filter(
        (d: any) => d.healthStatus === 'HEALTHY',
      ).length;
      const atRiskCt = allDonors.data.filter(
        (d: any) => d.healthStatus === 'AT_RISK',
      ).length;
      const dormantCt = allDonors.data.filter(
        (d: any) => d.healthStatus === 'DORMANT',
      ).length;

      doc.font('Helvetica-Bold').fontSize(9);
      doc.text(
        `Total Donors: ${allDonors.data.length} | Lifetime Total: ₹${totalLifetime.toLocaleString('en-IN')} | FY Total: ₹${totalFY.toLocaleString('en-IN')}`,
        30,
        y + 10,
      );
      doc.text(
        `Health: Healthy ${healthyCt} | At-Risk ${atRiskCt} | Dormant ${dormantCt}`,
        30,
        y + 25,
      );

      doc
        .fontSize(8)
        .font('Helvetica')
        .text('This is a computer-generated report. For internal use only.', 30, 560, {
          align: 'center',
          width: 760,
        });

      doc.end();
    });
  }

  async exportReceiptsAuditExcel(
    filter: DateFilter,
    paymentMode?: string,
  ): Promise<Buffer> {
    const allReceipts = await this.reportsQueryService.getReceiptsAudit(filter, {
      page: 1,
      limit: 10000,
      paymentMode,
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Receipt Register (Audit)');

    sheet.columns = [
      { header: 'Receipt Number', key: 'receiptNumber', width: 22 },
      { header: 'Receipt Date', key: 'receiptDate', width: 15 },
      { header: 'Donor Name', key: 'donorName', width: 28 },
      { header: 'Amount (₹)', key: 'amount', width: 15 },
      { header: 'Payment Mode', key: 'paymentMode', width: 15 },
      { header: 'Financial Year', key: 'financialYear', width: 15 },
      { header: 'Donation Category', key: 'donationCategory', width: 18 },
      { header: 'Generated By', key: 'generatedBy', width: 15 },
    ];

    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E5A4C' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    allReceipts.data.forEach((d: any) => {
      sheet.addRow({
        receiptNumber: d.receiptNumber,
        receiptDate: new Date(d.receiptDate).toLocaleDateString('en-IN'),
        donorName: d.donorName,
        amount: d.amount?.toNumber?.() || d.amount || 0,
        paymentMode: d.paymentMode,
        financialYear: d.financialYear,
        donationCategory: d.donationCategory,
        generatedBy: d.generatedBy,
      });
    });

    sheet.addRow({});
    const totalAmount = allReceipts.data.reduce(
      (sum: number, d: any) => sum + (d.amount?.toNumber?.() || d.amount || 0),
      0,
    );
    const summaryRow = sheet.addRow({
      receiptNumber: 'TOTAL',
      donorName: `${allReceipts.data.length} Receipts`,
      amount: totalAmount,
    });
    summaryRow.font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportReceiptsAuditPdf(
    filter: DateFilter,
    paymentMode?: string,
  ): Promise<Buffer> {
    const [allReceipts, orgProfile] = await Promise.all([
      this.reportsQueryService.getReceiptsAudit(filter, {
        page: 1,
        limit: 10000,
        paymentMode,
      }),
      this.orgProfileService.getProfile(),
    ]);
    const orgName = orgProfile.name;

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(16).font('Helvetica-Bold').text(orgName, { align: 'center' });
      doc.fontSize(14).text('Receipt Register (Audit Report)', { align: 'center' });
      doc.moveDown(0.3);

      const dateRange =
        filter.startDate && filter.endDate
          ? `Period: ${new Date(filter.startDate).toLocaleDateString('en-IN')} to ${new Date(filter.endDate).toLocaleDateString('en-IN')}`
          : 'All Time';
      doc.fontSize(10).font('Helvetica').text(dateRange, { align: 'center' });
      if (paymentMode && paymentMode !== 'ALL') {
        doc.text(`Payment Mode: ${paymentMode}`, { align: 'center' });
      }
      doc
        .fontSize(9)
        .text(
          `Generated: ${new Date().toLocaleDateString('en-IN')} | Admin Audit Copy`,
          { align: 'center' },
        );
      doc.moveDown();

      const tableTop = doc.y;
      const colWidths = [100, 70, 120, 75, 80, 75, 85, 70];
      const headers = [
        'Receipt #',
        'Date',
        'Donor Name',
        'Amount',
        'Mode',
        'FY',
        'Category',
        'Gen. By',
      ];

      let x = 30;
      doc.font('Helvetica-Bold').fontSize(8);
      doc.rect(30, tableTop - 3, 760, 16).fill('#2E5A4C');
      doc.fill('#FFFFFF');
      headers.forEach((header, i) => {
        doc.text(header, x + 2, tableTop, { width: colWidths[i] - 4, align: 'left' });
        x += colWidths[i];
      });

      let y = tableTop + 18;
      doc.fill('#000000').font('Helvetica').fontSize(7);

      allReceipts.data.slice(0, 45).forEach((d: any, index: number) => {
        if (y > 520) {
          doc.addPage();
          y = 40;
        }

        if (index % 2 === 0) {
          doc.rect(30, y - 2, 760, 13).fill('#F5F5F5');
          doc.fill('#000000');
        }

        const amountNum = d.amount?.toNumber?.() || d.amount || 0;

        x = 30;
        const rowData = [
          d.receiptNumber,
          new Date(d.receiptDate).toLocaleDateString('en-IN'),
          d.donorName.substring(0, 22),
          `₹${amountNum.toLocaleString('en-IN')}`,
          d.paymentMode,
          d.financialYear,
          d.donationCategory,
          d.generatedBy,
        ];
        rowData.forEach((cell, i) => {
          doc.text(cell, x + 2, y, { width: colWidths[i] - 4, align: 'left' });
          x += colWidths[i];
        });
        y += 13;
      });

      doc.moveDown(2);
      const totalAmount = allReceipts.data.reduce(
        (sum: number, d: any) => sum + (d.amount?.toNumber?.() || d.amount || 0),
        0,
      );
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text(
        `Total Receipts: ${allReceipts.data.length} | Total Amount: ₹${totalAmount.toLocaleString('en-IN')}`,
        30,
        y + 15,
      );

      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          'This is a computer-generated audit report. For internal use only.',
          30,
          560,
          { align: 'center', width: 760 },
        );

      doc.end();
    });
  }

  async exportMonthlyDonationsExcel(filter: DateFilter): Promise<Buffer> {
    const allDonations = await this.reportsQueryService.getMonthlyDonations(filter, {
      page: 1,
      limit: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Monthly Donations');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Receipt #', key: 'receipt', width: 20 },
      { header: 'Donor Code', key: 'donorCode', width: 18 },
      { header: 'Donor Name', key: 'donorName', width: 25 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Mode', key: 'mode', width: 15 },
      { header: 'Amount (₹)', key: 'amount', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 },
    ];

    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    sheet.getRow(1).font = { bold: true };

    allDonations.data.forEach((d: any) => {
      sheet.addRow({
        date: new Date(d.donationDate).toLocaleDateString('en-IN'),
        receipt: d.receiptNumber || '-',
        donorCode: d.donorCode,
        donorName: d.donorName,
        type: d.donationType,
        mode: d.donationMode,
        amount: d.amount?.toNumber?.() || d.amount || 0,
        remarks: d.remarks || '-',
      });
    });

    sheet.addRow({});
    const totalRow = sheet.addRow({
      date: 'TOTAL',
      amount:
        typeof allDonations.summary.totalAmount === 'object'
          ? (allDonations.summary.totalAmount as any).toNumber()
          : allDonations.summary.totalAmount,
    });
    totalRow.font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportMonthlyDonationsPdf(filter: DateFilter): Promise<Buffer> {
    const allDonations = await this.reportsQueryService.getMonthlyDonations(filter, {
      page: 1,
      limit: 10000,
    });

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('Monthly Donations Report', { align: 'center' });
      doc.moveDown(0.5);

      const dateRange =
        filter.startDate && filter.endDate
          ? `${new Date(filter.startDate).toLocaleDateString('en-IN')} to ${new Date(filter.endDate).toLocaleDateString('en-IN')}`
          : 'All Time';
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Date Range: ${dateRange}`, { align: 'center' });
      doc.moveDown();

      const tableTop = doc.y;
      const colWidths = [70, 90, 80, 120, 70, 70, 80, 120];
      const headers = [
        'Date',
        'Receipt #',
        'Donor Code',
        'Donor Name',
        'Type',
        'Mode',
        'Amount',
        'Remarks',
      ];

      let x = 40;
      doc.font('Helvetica-Bold').fontSize(9);
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });

      doc.moveTo(40, tableTop + 15).lineTo(760, tableTop + 15).stroke();

      let y = tableTop + 20;
      doc.font('Helvetica').fontSize(8);

      allDonations.data.slice(0, 50).forEach((d: any) => {
        if (y > 500) {
          doc.addPage();
          y = 40;
        }
        x = 40;
        const amountNum = d.amount?.toNumber?.() || d.amount || 0;
        const rowData = [
          new Date(d.donationDate).toLocaleDateString('en-IN'),
          d.receiptNumber || '-',
          d.donorCode,
          d.donorName.substring(0, 20),
          d.donationType,
          d.donationMode,
          `₹${amountNum.toLocaleString('en-IN')}`,
          (d.remarks || '-').substring(0, 20),
        ];
        rowData.forEach((cell, i) => {
          doc.text(cell, x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });
        y += 15;
      });

      doc.moveDown(2);
      doc.font('Helvetica-Bold').fontSize(10);
      const totalAmt =
        typeof allDonations.summary.totalAmount === 'object'
          ? (allDonations.summary.totalAmount as any).toNumber()
          : allDonations.summary.totalAmount;
      doc.text(
        `Total: ₹${totalAmt.toLocaleString('en-IN')} | Count: ${allDonations.summary.totalCount}`,
        40,
        y + 10,
      );

      doc.end();
    });
  }

  async exportDonorSummaryExcel(filter: DateFilter): Promise<Buffer> {
    const allDonors = await this.reportsQueryService.getDonorSummary(filter, {
      page: 1,
      limit: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Donor Summary');

    sheet.columns = [
      { header: 'Donor Code', key: 'donorCode', width: 18 },
      { header: 'Donor Name', key: 'donorName', width: 25 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'FY Total (₹)', key: 'fyTotal', width: 15 },
      { header: 'FY Count', key: 'fyCount', width: 12 },
      { header: 'Lifetime Total (₹)', key: 'lifetimeTotal', width: 18 },
      { header: 'Lifetime Count', key: 'lifetimeCount', width: 15 },
      { header: 'Last Donation', key: 'lastDonation', width: 15 },
    ];

    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    sheet.getRow(1).font = { bold: true };

    allDonors.data.forEach((d: any) => {
      sheet.addRow({
        donorCode: d.donorCode,
        donorName: d.donorName,
        category: d.category,
        fyTotal: d.fyTotal,
        fyCount: d.fyCount,
        lifetimeTotal: d.lifetimeTotal,
        lifetimeCount: d.lifetimeCount,
        lastDonation: d.lastDonation
          ? new Date(d.lastDonation).toLocaleDateString('en-IN')
          : '-',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportDonorSummaryPdf(filter: DateFilter): Promise<Buffer> {
    const allDonors = await this.reportsQueryService.getDonorSummary(filter, {
      page: 1,
      limit: 10000,
    });

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('Donor-wise Summary Report', { align: 'center' });
      doc.moveDown();

      const tableTop = doc.y;
      const colWidths = [80, 130, 100, 80, 60, 90, 70, 80];
      const headers = [
        'Donor Code',
        'Donor Name',
        'Category',
        'FY Total',
        'FY #',
        'Lifetime',
        'Life #',
        'Last Donation',
      ];

      let x = 40;
      doc.font('Helvetica-Bold').fontSize(9);
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });

      doc.moveTo(40, tableTop + 15).lineTo(760, tableTop + 15).stroke();

      let y = tableTop + 20;
      doc.font('Helvetica').fontSize(8);

      allDonors.data.slice(0, 50).forEach((d: any) => {
        if (y > 500) {
          doc.addPage();
          y = 40;
        }
        x = 40;
        const rowData = [
          d.donorCode,
          d.donorName.substring(0, 22),
          d.category,
          `₹${d.fyTotal.toLocaleString('en-IN')}`,
          d.fyCount.toString(),
          `₹${d.lifetimeTotal.toLocaleString('en-IN')}`,
          d.lifetimeCount.toString(),
          d.lastDonation ? new Date(d.lastDonation).toLocaleDateString('en-IN') : '-',
        ];
        rowData.forEach((cell, i) => {
          doc.text(cell, x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });
        y += 15;
      });

      doc.end();
    });
  }

  async exportReceiptRegisterExcel(filter: DateFilter): Promise<Buffer> {
    const allReceipts = await this.reportsQueryService.getReceiptRegister(filter, {
      page: 1,
      limit: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Receipt Register');

    sheet.columns = [
      { header: 'Receipt #', key: 'receipt', width: 22 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Donor Code', key: 'donorCode', width: 18 },
      { header: 'Donor Name', key: 'donorName', width: 25 },
      { header: 'Amount (₹)', key: 'amount', width: 15 },
      { header: 'Mode', key: 'mode', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
    ];

    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    sheet.getRow(1).font = { bold: true };

    allReceipts.data.forEach((d: any) => {
      sheet.addRow({
        receipt: d.receiptNumber,
        date: new Date(d.donationDate).toLocaleDateString('en-IN'),
        donorCode: d.donorCode,
        donorName: d.donorName,
        amount: d.amount?.toNumber?.() || d.amount || 0,
        mode: d.donationMode,
        type: d.donationType,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportReceiptRegisterPdf(filter: DateFilter): Promise<Buffer> {
    const allReceipts = await this.reportsQueryService.getReceiptRegister(filter, {
      page: 1,
      limit: 10000,
    });

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('Receipt Register (Audit)', { align: 'center' });
      doc.moveDown(0.5);

      const dateRange =
        filter.startDate && filter.endDate
          ? `${new Date(filter.startDate).toLocaleDateString('en-IN')} to ${new Date(filter.endDate).toLocaleDateString('en-IN')}`
          : 'All Time';
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Date Range: ${dateRange}`, { align: 'center' });
      doc.moveDown();

      const tableTop = doc.y;
      const colWidths = [120, 80, 90, 150, 90, 80, 80];
      const headers = [
        'Receipt #',
        'Date',
        'Donor Code',
        'Donor Name',
        'Amount',
        'Mode',
        'Type',
      ];

      let x = 40;
      doc.font('Helvetica-Bold').fontSize(9);
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });

      doc.moveTo(40, tableTop + 15).lineTo(760, tableTop + 15).stroke();

      let y = tableTop + 20;
      doc.font('Helvetica').fontSize(8);

      allReceipts.data.slice(0, 50).forEach((d: any) => {
        if (y > 500) {
          doc.addPage();
          y = 40;
        }
        x = 40;
        const amountNum = d.amount?.toNumber?.() || d.amount || 0;
        const rowData = [
          d.receiptNumber || '-',
          new Date(d.donationDate).toLocaleDateString('en-IN'),
          d.donorCode,
          d.donorName.substring(0, 25),
          `₹${amountNum.toLocaleString('en-IN')}`,
          d.donationMode,
          d.donationType,
        ];
        rowData.forEach((cell, i) => {
          doc.text(cell, x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });
        y += 15;
      });

      doc.end();
    });
  }

  async generateBoardSummaryPdf(): Promise<Buffer> {
    const currentFY = getFYDates('current');
    const lastFY = getFYDates('last');

    const fyYear = currentFY.start.getFullYear();
    const fyLabel = `FY ${fyYear}-${(fyYear + 1).toString().slice(-2)}`;

    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;
    const primaryColor = orgProfile.brandingPrimaryColor || '#2E7D32';

    const [
      currentFYTotal,
      lastFYTotal,
      totalDonors,
      activeDonors,
      totalBeneficiaries,
      monthlyTrends,
      modeSplit,
      topDonorsShare,
    ] = await Promise.all([
      this.prisma.donation.aggregate({
        where: {
          deletedAt: null,
          donationDate: { gte: currentFY.start, lte: currentFY.end },
        },
        _sum: { donationAmount: true },
        _count: true,
      }),
      this.prisma.donation.aggregate({
        where: {
          deletedAt: null,
          donationDate: { gte: lastFY.start, lte: lastFY.end },
        },
        _sum: { donationAmount: true },
      }),
      this.prisma.donor.count({ where: { deletedAt: null } }),
      this.prisma.donor.count({
        where: {
          deletedAt: null,
          donations: {
            some: {
              donationDate: {
                gte: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      }),
      this.prisma.beneficiary.count({ where: { deletedAt: null } }),
      this.prisma.$queryRaw<{ month: string; total: any }[]>`
        SELECT TO_CHAR("donationDate", 'Mon YY') as month,
               SUM("donationAmount") as total
        FROM donations
        WHERE "deletedAt" IS NULL
          AND "donationDate" >= ${currentFY.start}
          AND "donationDate" <= ${currentFY.end}
        GROUP BY TO_CHAR("donationDate", 'Mon YY'), DATE_TRUNC('month', "donationDate")
        ORDER BY DATE_TRUNC('month', "donationDate")
        LIMIT 12
      `,
      this.prisma.donation.groupBy({
        by: ['donationMode'],
        where: {
          deletedAt: null,
          donationDate: { gte: currentFY.start, lte: currentFY.end },
        },
        _sum: { donationAmount: true },
        _count: true,
      }),
      this.prisma.$queryRaw<{ share: any }[]>`
        WITH top_donors AS (
          SELECT "donorId", SUM("donationAmount") as donor_total
          FROM donations
          WHERE "deletedAt" IS NULL
            AND "donationDate" >= ${currentFY.start}
            AND "donationDate" <= ${currentFY.end}
          GROUP BY "donorId"
          ORDER BY donor_total DESC
          LIMIT 5
        ),
        fy_total AS (
          SELECT SUM("donationAmount") as total
          FROM donations
          WHERE "deletedAt" IS NULL
            AND "donationDate" >= ${currentFY.start}
            AND "donationDate" <= ${currentFY.end}
        )
        SELECT COALESCE(
          ROUND(SUM(td.donor_total) * 100.0 / NULLIF((SELECT total FROM fy_total), 0), 1),
          0
        ) as share
        FROM top_donors td
      `,
    ]);

    const fyTotal = Number(currentFYTotal._sum.donationAmount || 0);
    const prevFyTotal = Number(lastFYTotal._sum.donationAmount || 0);
    const growthPct = prevFyTotal > 0 ? ((fyTotal - prevFyTotal) / prevFyTotal) * 100 : 0;
    const topShare = Number(topDonorsShare[0]?.share || 0);

    let peakMonth = '';
    let peakAmount = 0;
    monthlyTrends.forEach((m) => {
      const amt = Number(m.total || 0);
      if (amt > peakAmount) {
        peakAmount = amt;
        peakMonth = m.month;
      }
    });

    const cashModes = ['CASH'];
    const onlineModes = [
      'UPI',
      'GPAY',
      'PHONEPE',
      'BANK_TRANSFER',
      'NEFT',
      'RTGS',
      'IMPS',
      'CHEQUE',
    ];
    const kindModes = [
      'KIND',
      'GROCERY',
      'MEDICINES',
      'PREPARED_FOOD',
      'CLOTHING',
      'HOUSEHOLD',
      'VEHICLE',
      'OTHER',
    ];

    let cashTotal = 0,
      onlineTotal = 0,
      kindTotal = 0;
    modeSplit.forEach((ms) => {
      const amt = Number(ms._sum.donationAmount || 0);
      const mode = ms.donationMode || 'OTHER';
      if (cashModes.includes(mode)) cashTotal += amt;
      else if (onlineModes.includes(mode)) onlineTotal += amt;
      else kindTotal += amt;
    });
    const modeTotal = cashTotal + onlineTotal + kindTotal;
    const cashPct = modeTotal > 0 ? Math.round((cashTotal / modeTotal) * 100) : 0;
    const onlinePct = modeTotal > 0 ? Math.round((onlineTotal / modeTotal) * 100) : 0;
    const kindPct = modeTotal > 0 ? Math.round((kindTotal / modeTotal) * 100) : 0;

    return new Promise((resolve) => {
      const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        autoFirstPage: true,
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.rect(0, 0, 595, 55).fill(primaryColor);
      doc.fill('#FFFFFF').fontSize(16).font('Helvetica-Bold');
      doc.text(orgName, 30, 14, { align: 'center', width: 535 });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Board Summary Report (${fyLabel})`, 30, 34, {
        align: 'center',
        width: 535,
      });

      let y = 65;

      doc.fill(primaryColor).fontSize(9).font('Helvetica-Bold');
      doc.text('KEY METRICS', 30, y);
      y += 12;

      const metricsBoxWidth = 125;
      const metricsGap = 10;
      const metricsStartX = 30;
      const metrics = [
        { label: 'Total Donations (FY)', value: formatLakh(fyTotal) },
        { label: 'Total Donors', value: totalDonors.toString() },
        { label: 'Active Donors', value: activeDonors.toString() },
        { label: 'Beneficiaries', value: totalBeneficiaries.toString() },
      ];

      metrics.forEach((m, i) => {
        const x = metricsStartX + i * (metricsBoxWidth + metricsGap);
        doc.rect(x, y, metricsBoxWidth, 38).fillAndStroke('#F5F5F5', '#E0E0E0');
        doc.fill('#1E4D3A').fontSize(12).font('Helvetica-Bold');
        doc.text(m.value, x + 3, y + 6, { width: metricsBoxWidth - 6, align: 'center' });
        doc.fill('#666666').fontSize(7).font('Helvetica');
        doc.text(m.label, x + 3, y + 24, { width: metricsBoxWidth - 6, align: 'center' });
      });

      y += 48;

      doc.fill(primaryColor).fontSize(9).font('Helvetica-Bold');
      doc.text('DONATION TRENDS', 30, y);
      y += 12;

      doc.fontSize(8).font('Helvetica-Bold').fill('#333333');
      doc.text('Monthly Donations:', 30, y);
      y += 10;

      const barMaxWidth = 150;
      const maxMonthlyAmt = Math.max(
        ...monthlyTrends.map((m) => Number(m.total || 0)),
        1,
      );

      const trendsToShow = monthlyTrends.slice(0, 6);
      trendsToShow.forEach((m) => {
        const amt = Number(m.total || 0);
        const barWidth = Math.max(5, (amt / maxMonthlyAmt) * barMaxWidth);
        doc.fill('#666666').fontSize(7).font('Helvetica');
        doc.text(m.month, 30, y, { width: 42 });
        doc.rect(75, y, barWidth, 8).fill('#2E7D5A');
        doc.fill('#333333').fontSize(6);
        doc.text(formatLakh(amt), 80 + barWidth + 2, y);
        y += 10;
      });

      const modeX = 290;
      let modeY = y - trendsToShow.length * 10 - 10;
      doc.fontSize(8).font('Helvetica-Bold').fill('#333333');
      doc.text('Payment Mode Split:', modeX, modeY);
      modeY += 12;

      const modeData = [
        { label: 'Cash', pct: cashPct, color: '#2E7D5A' },
        { label: 'Online', pct: onlinePct, color: '#4A90D9' },
        { label: 'Kind', pct: kindPct, color: '#D4A574' },
      ];

      modeData.forEach((md) => {
        const barWidth = Math.max(3, (md.pct / 100) * 110);
        doc.fill('#666666').fontSize(7).font('Helvetica');
        doc.text(md.label, modeX, modeY, { width: 38 });
        doc.rect(modeX + 42, modeY, barWidth, 8).fill(md.color);
        doc.fill('#333333').fontSize(7);
        doc.text(`${md.pct}%`, modeX + 47 + barWidth + 2, modeY);
        modeY += 11;
      });

      y = Math.max(y, modeY) + 8;

      doc.fill(primaryColor).fontSize(9).font('Helvetica-Bold');
      doc.text('KEY HIGHLIGHTS', 30, y);
      y += 12;

      const highlights: string[] = [];

      if (growthPct > 0) {
        highlights.push(
          `Donation growth: +${growthPct.toFixed(1)}% compared to previous FY`,
        );
      } else if (growthPct < 0) {
        highlights.push(
          `Donation decline: ${growthPct.toFixed(1)}% compared to previous FY`,
        );
      } else {
        highlights.push(`Donations maintained at similar levels as previous FY`);
      }

      highlights.push(
        `Top 5 donors contribute ${topShare.toFixed(1)}% of total FY donations`,
      );

      if (peakMonth) {
        highlights.push(
          `Peak donation period: ${peakMonth} with ${formatLakh(peakAmount)} collected`,
        );
      }

      highlights.push(
        `${activeDonors} of ${totalDonors} donors (${totalDonors > 0 ? Math.round((activeDonors / totalDonors) * 100) : 0}%) active in last 120 days`,
      );

      doc.fontSize(8).font('Helvetica').fill('#333333');
      highlights.forEach((h) => {
        doc.circle(36, y + 3, 2).fill('#2E7D5A');
        doc.fill('#333333').text(h, 44, y, { width: 500 });
        y += 12;
      });

      y += 10;
      doc.rect(0, y, 595, 30).fill('#F5F5F5');
      doc.fill('#666666').fontSize(7).font('Helvetica');
      doc.text(
        `Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        35,
        y + 8,
      );
      doc.text('For internal board use only', 35, y + 18);
      doc.text(orgName, 400, y + 12, { align: 'right', width: 155 });

      doc.end();
    });
  }
}
