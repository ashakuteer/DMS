import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { DonorReportType, DonorReportStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

interface GenerateReportDto {
  type: DonorReportType;
  periodStart: string;
  periodEnd: string;
  donorId?: string;
  campaignId?: string;
  templateId?: string;
  title?: string;
}

interface UserContext {
  id: string;
  email: string;
  role: string;
  name?: string;
}

interface ReportData {
  period: { start: string; end: string; label: string };
  summary: {
    totalDonations: number;
    totalAmount: number;
    uniqueDonors: number;
    beneficiariesSupported: number;
    activeSponsorships: number;
    campaignsActive: number;
  };
  donationsByType: { type: string; count: number; amount: number }[];
  donationsByPurpose: { type: string; count: number; amount: number }[];
  donationsByHome: { type: string; count: number; amount: number }[];
  donationsByMonth: { month: string; count: number; amount: number }[];
  topDonors: { name: string; code: string; amount: number; count: number }[];
  beneficiaries: { name: string; home: string; sponsors: number }[];
  campaigns: { name: string; goal: number; raised: number; status: string }[];
  usageSummary: { category: string; amount: number; percentage: number }[];
  donorDetail?: {
    name: string;
    code: string;
    email: string;
    totalDonated: number;
    donationCount: number;
    sponsoredBeneficiaries: { name: string; home: string }[];
    donations: { date: string; amount: number; type: string; receipt: string; purpose: string }[];
  };
}

@Injectable()
export class DonorReportsService {
  private readonly logger = new Logger(DonorReportsService.name);
  private readonly fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  constructor(
    private prisma: PrismaService,
    private emailJobsService: EmailJobsService,
    private orgProfileService: OrganizationProfileService,
  ) {}

  async generate(dto: GenerateReportDto, user: UserContext) {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      throw new BadRequestException('Invalid date range');
    }

    const periodLabel = this.getPeriodLabel(dto.type, periodStart, periodEnd);
    const title = dto.title || `${periodLabel} Report`;

    const report = await this.prisma.donorReport.create({
      data: {
        title,
        type: dto.type,
        periodStart,
        periodEnd,
        donorId: dto.donorId || null,
        campaignId: dto.campaignId || null,
        templateId: dto.templateId || null,
        status: DonorReportStatus.GENERATING,
        generatedById: user.id,
      },
    });

    try {
      const reportData = await this.aggregateReportData(periodStart, periodEnd, dto.donorId, dto.campaignId);

      await this.prisma.donorReport.update({
        where: { id: report.id },
        data: {
          reportData: reportData as any,
          status: DonorReportStatus.READY,
        },
      });

      return this.findOne(report.id);
    } catch (error) {
      this.logger.error(`Report generation failed: ${error.message}`, error.stack);
      await this.prisma.donorReport.update({
        where: { id: report.id },
        data: { status: DonorReportStatus.FAILED },
      });
      throw error;
    }
  }

  private getPeriodLabel(type: DonorReportType, start: Date, end: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (type === DonorReportType.QUARTERLY) {
      const startMonth = start.getMonth();
      const quarter = Math.floor(startMonth / 3) + 1;
      const year = start.getFullYear();
      return `Q${quarter} ${year}`;
    }
    if (type === DonorReportType.ANNUAL) {
      const startMonth = start.getMonth();
      if (startMonth === 3) {
        return `FY ${start.getFullYear()}-${(start.getFullYear() + 1).toString().slice(-2)}`;
      }
      return `${start.getFullYear()}`;
    }
    return `${months[start.getMonth()]} ${start.getFullYear()} - ${months[end.getMonth()]} ${end.getFullYear()}`;
  }

  private async aggregateReportData(
    periodStart: Date,
    periodEnd: Date,
    donorId?: string,
    campaignId?: string,
  ): Promise<ReportData> {
    const dateFilter: any = {
      donationDate: { gte: periodStart, lte: periodEnd },
      isDeleted: false,
    };
    if (donorId) dateFilter.donorId = donorId;
    if (campaignId) dateFilter.campaignId = campaignId;

    const [donations, sponsorships, campaigns, beneficiaries] = await Promise.all([
      this.prisma.donation.findMany({
        where: dateFilter,
        include: {
          donor: { select: { id: true, firstName: true, lastName: true, donorCode: true, personalEmail: true } },
          campaign: { select: { id: true, name: true } },
        },
        orderBy: { donationDate: 'desc' },
      }),
      this.prisma.sponsorship.findMany({
        where: {
          status: 'ACTIVE',
          ...(donorId ? { donorId } : {}),
        },
        include: {
          beneficiary: { select: { id: true, fullName: true, homeType: true } },
          donor: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.campaign.findMany({
        where: {
          isDeleted: false,
          ...(campaignId ? { id: campaignId } : {}),
        },
        include: {
          donations: {
            where: { donationDate: { gte: periodStart, lte: periodEnd }, isDeleted: false },
          },
        },
      }),
      this.prisma.beneficiary.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          fullName: true,
          homeType: true,
          sponsorships: {
            where: { status: 'ACTIVE' },
            select: { id: true },
          },
        },
      }),
    ]);

    const totalAmount = donations.reduce((sum, d) => sum + Number(d.donationAmount), 0);
    const uniqueDonorIds = new Set(donations.map((d) => d.donorId));
    const beneficiariesWithSponsors = beneficiaries.filter((b) => b.sponsorships.length > 0);

    const donationsByType = this.groupBy(donations, 'donationType', (items) => ({
      count: items.length,
      amount: items.reduce((s, d) => s + Number(d.donationAmount), 0),
    }));

    const donationsByPurpose = this.groupBy(donations, 'donationPurpose', (items) => ({
      count: items.length,
      amount: items.reduce((s, d) => s + Number(d.donationAmount), 0),
    }));

    const donationsByHome = this.groupBy(
      donations.filter((d) => d.donationHomeType),
      'donationHomeType',
      (items) => ({
        count: items.length,
        amount: items.reduce((s, d) => s + Number(d.donationAmount), 0),
      }),
    );

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const donationsByMonth: ReportData['donationsByMonth'] = [];
    const monthMap = new Map<string, { count: number; amount: number }>();
    for (const d of donations) {
      const key = `${months[d.donationDate.getMonth()]} ${d.donationDate.getFullYear()}`;
      const existing = monthMap.get(key) || { count: 0, amount: 0 };
      existing.count++;
      existing.amount += Number(d.donationAmount);
      monthMap.set(key, existing);
    }
    for (const [month, data] of monthMap) {
      donationsByMonth.push({ month, ...data });
    }

    const donorAmounts = new Map<string, { name: string; code: string; amount: number; count: number }>();
    for (const d of donations) {
      const key = d.donorId;
      const existing = donorAmounts.get(key) || {
        name: `${d.donor.firstName} ${d.donor.lastName || ''}`.trim(),
        code: d.donor.donorCode,
        amount: 0,
        count: 0,
      };
      existing.amount += Number(d.donationAmount);
      existing.count++;
      donorAmounts.set(key, existing);
    }
    const topDonors = Array.from(donorAmounts.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const campaignData = campaigns.map((c) => ({
      name: c.name,
      goal: Number(c.goalAmount || 0),
      raised: c.donations.reduce((s, d) => s + Number(d.donationAmount), 0),
      status: c.status,
    }));

    const beneficiaryData = beneficiariesWithSponsors.slice(0, 20).map((b) => ({
      name: b.fullName,
      home: b.homeType?.replace(/_/g, ' ') || 'N/A',
      sponsors: b.sponsorships.length,
    }));

    const usageSummary = donationsByHome.length > 0
      ? donationsByHome.map((h) => ({
          category: h.type?.replace(/_/g, ' ') || 'General',
          amount: h.amount,
          percentage: totalAmount > 0 ? Math.round((h.amount / totalAmount) * 100) : 0,
        }))
      : [{ category: 'General', amount: totalAmount, percentage: 100 }];

    const result: ReportData = {
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        label: this.getPeriodLabel(DonorReportType.CUSTOM, periodStart, periodEnd),
      },
      summary: {
        totalDonations: donations.length,
        totalAmount,
        uniqueDonors: uniqueDonorIds.size,
        beneficiariesSupported: beneficiariesWithSponsors.length,
        activeSponsorships: sponsorships.length,
        campaignsActive: campaigns.filter((c) => c.status === 'ACTIVE').length,
      },
      donationsByType,
      donationsByPurpose,
      donationsByHome,
      donationsByMonth,
      topDonors,
      beneficiaries: beneficiaryData,
      campaigns: campaignData,
      usageSummary,
    };

    if (donorId) {
      const donor = await this.prisma.donor.findUnique({
        where: { id: donorId },
        select: {
          firstName: true,
          lastName: true,
          donorCode: true,
          personalEmail: true,
          officialEmail: true,
        },
      });
      if (donor) {
        const donorSponsorships = sponsorships.filter((s) => s.donorId === donorId);
        result.donorDetail = {
          name: `${donor.firstName} ${donor.lastName || ''}`.trim(),
          code: donor.donorCode,
          email: donor.personalEmail || donor.officialEmail || '',
          totalDonated: totalAmount,
          donationCount: donations.length,
          sponsoredBeneficiaries: donorSponsorships.map((s) => ({
            name: s.beneficiary.fullName,
            home: s.beneficiary.homeType?.replace(/_/g, ' ') || 'N/A',
          })),
          donations: donations.slice(0, 50).map((d) => ({
            date: d.donationDate.toLocaleDateString('en-IN'),
            amount: Number(d.donationAmount),
            type: d.donationType,
            receipt: d.receiptNumber || 'N/A',
            purpose: d.donationPurpose || 'General',
          })),
        };
      }
    }

    return result;
  }

  private groupBy(items: any[], key: string, aggregate: (items: any[]) => { count: number; amount: number }) {
    const groups = new Map<string, any[]>();
    for (const item of items) {
      const value = item[key] || 'OTHER';
      if (!groups.has(value)) groups.set(value, []);
      groups.get(value)!.push(item);
    }
    return Array.from(groups.entries()).map(([type, groupItems]) => ({
      type,
      ...aggregate(groupItems),
    }));
  }

  async findAll(page: number = 1, limit: number = 20, filters?: { type?: string; donorId?: string }) {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.donorId) where.donorId = filters.donorId;

    const [items, total] = await Promise.all([
      this.prisma.donorReport.findMany({
        where,
        include: {
          generatedBy: { select: { name: true } },
          donor: { select: { firstName: true, lastName: true, donorCode: true } },
          template: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.donorReport.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const report = await this.prisma.donorReport.findUnique({
      where: { id },
      include: {
        generatedBy: { select: { name: true } },
        donor: { select: { firstName: true, lastName: true, donorCode: true } },
        template: { select: { name: true, headerText: true, footerText: true, showDonationSummary: true, showDonationBreakdown: true, showBeneficiaries: true, showCampaigns: true, showUsageSummary: true } },
      },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async deleteReport(id: string) {
    const report = await this.prisma.donorReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    await this.prisma.donorReport.delete({ where: { id } });
    return { message: 'Report deleted' };
  }

  async generatePdf(id: string): Promise<Buffer> {
    const report = await this.findOne(id);
    if (report.status !== DonorReportStatus.READY && report.status !== DonorReportStatus.SHARED) {
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
      doc.fontSize(9).text(`Period: ${new Date(report.periodStart).toLocaleDateString('en-IN')} - ${new Date(report.periodEnd).toLocaleDateString('en-IN')}`, 40, y0);
      doc.text(`Generated: ${new Date(report.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}`, 40, y0 + 14);
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
          if (i > 0 && i % 3 === 0) { sx = 40; sy += 40; }
          doc.rect(sx, sy, colW - 5, 35).fill('#F5F5F5').stroke();
          doc.fill('#333333').fontSize(8).font('Helvetica').text(summaryItems[i][0], sx + 8, sy + 5);
          doc.fontSize(12).font('Helvetica-Bold').text(summaryItems[i][1], sx + 8, sy + 17);
          sx += colW;
        }
        doc.y = sy + 50;
      }

      if (template?.showDonationBreakdown !== false && data.donationsByType.length > 0) {
        this.pdfSection(doc, 'Donations by Type');
        this.pdfTable(doc, ['Type', 'Count', 'Amount'],
          data.donationsByType.map((d) => [d.type?.replace(/_/g, ' '), `${d.count}`, this.fmt(d.amount)]));
      }

      if (data.donationsByMonth.length > 0) {
        if (doc.y > 650) doc.addPage();
        this.pdfSection(doc, 'Monthly Breakdown');
        this.pdfTable(doc, ['Month', 'Count', 'Amount'],
          data.donationsByMonth.map((d) => [d.month, `${d.count}`, this.fmt(d.amount)]));
      }

      if (template?.showBeneficiaries !== false && data.beneficiaries.length > 0) {
        if (doc.y > 600) doc.addPage();
        this.pdfSection(doc, 'Beneficiaries Supported');
        this.pdfTable(doc, ['Name', 'Home', 'Sponsors'],
          data.beneficiaries.map((b) => [b.name, b.home, `${b.sponsors}`]));
      }

      if (template?.showCampaigns !== false && data.campaigns.length > 0) {
        if (doc.y > 600) doc.addPage();
        this.pdfSection(doc, 'Campaigns');
        this.pdfTable(doc, ['Campaign', 'Goal', 'Raised', 'Status'],
          data.campaigns.map((c) => [c.name, this.fmt(c.goal), this.fmt(c.raised), c.status]));
      }

      if (template?.showUsageSummary !== false && data.usageSummary.length > 0) {
        if (doc.y > 600) doc.addPage();
        this.pdfSection(doc, 'Usage Summary');
        this.pdfTable(doc, ['Category', 'Amount', 'Percentage'],
          data.usageSummary.map((u) => [u.category, this.fmt(u.amount), `${u.percentage}%`]));
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
          this.pdfTable(doc, ['Date', 'Amount', 'Type', 'Receipt', 'Purpose'],
            data.donorDetail.donations.map((d) => [d.date, this.fmt(d.amount), d.type, d.receipt, d.purpose]));
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
        doc.text(row[i] || '', startX + i * colW + 4, y + 3, { width: colW - 8, lineBreak: false });
      }
      y += 15;
    }
    doc.y = y + 5;
  }

  async generateExcel(id: string): Promise<Buffer> {
    const report = await this.findOne(id);
    if (report.status !== DonorReportStatus.READY && report.status !== DonorReportStatus.SHARED) {
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
      summarySheet.addRow({ metric: 'Period', value: `${new Date(report.periodStart).toLocaleDateString('en-IN')} - ${new Date(report.periodEnd).toLocaleDateString('en-IN')}` });
      summarySheet.addRow({ metric: 'Total Donations', value: data.summary.totalDonations });
      summarySheet.addRow({ metric: 'Total Amount', value: data.summary.totalAmount });
      summarySheet.addRow({ metric: 'Unique Donors', value: data.summary.uniqueDonors });
      summarySheet.addRow({ metric: 'Beneficiaries Supported', value: data.summary.beneficiariesSupported });
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

  async shareReport(id: string, donorIds: string[], user: UserContext) {
    const report = await this.findOne(id);
    if (report.status !== DonorReportStatus.READY && report.status !== DonorReportStatus.SHARED) {
      throw new BadRequestException('Report is not ready for sharing');
    }

    const data = report.reportData as unknown as ReportData;
    const donors = await this.prisma.donor.findMany({
      where: { id: { in: donorIds }, isDeleted: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        personalEmail: true,
        officialEmail: true,
        donorCode: true,
      },
    });

    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;
    const primaryColor = orgProfile.brandingPrimaryColor || '#2E7D32';

    let sentCount = 0;
    for (const donor of donors) {
      const email = donor.personalEmail || donor.officialEmail;
      if (!email) continue;

      const donorName = `${donor.firstName} ${donor.lastName || ''}`.trim();
      const subject = `${report.title} - ${orgName}`;
      const body = this.buildShareEmailHtml(report.title, donorName, data, report, orgName, primaryColor);

      await this.emailJobsService.create({
        donorId: donor.id,
        toEmail: email,
        subject,
        body,
        type: 'DONOR_UPDATE' as any,
        scheduledAt: new Date(),
      });
      sentCount++;
    }

    await this.prisma.donorReport.update({
      where: { id },
      data: {
        status: DonorReportStatus.SHARED,
        sharedAt: new Date(),
        sharedTo: { push: donorIds },
      },
    });

    return { message: `Report shared with ${sentCount} donor(s)`, sentCount };
  }

  private buildShareEmailHtml(title: string, donorName: string, data: ReportData, report: any, orgName: string, primaryColor: string): string {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${primaryColor}; padding: 20px; color: white; text-align: center;">
        <h2 style="margin: 0;">${report.template?.headerText || orgName}</h2>
        <p style="margin: 5px 0 0;">${title}</p>
      </div>
      <div style="padding: 20px;">
        <p>Dear ${donorName},</p>
        <p>Please find below a summary of our activities for the period ${new Date(report.periodStart).toLocaleDateString('en-IN')} to ${new Date(report.periodEnd).toLocaleDateString('en-IN')}.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr style="background: #f5f5f5;">
            <td style="padding: 8px; border: 1px solid #ddd;">Total Donations</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${data.summary.totalDonations}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Total Amount</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${this.fmt(data.summary.totalAmount)}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 8px; border: 1px solid #ddd;">Beneficiaries Supported</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${data.summary.beneficiariesSupported}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Active Sponsorships</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${data.summary.activeSponsorships}</td>
          </tr>
        </table>
        <p>Thank you for your continued support. For detailed reports, please contact us.</p>
        ${report.template?.footerText ? `<p style="color: #666; font-size: 12px; margin-top: 20px;">${report.template.footerText}</p>` : ''}
      </div>
      <div style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 11px; color: #999;">
        This is an auto-generated report from NGO DMS
      </div>
    </div>`;
  }

  async searchDonors(search: string, limit: number = 20) {
    if (!search || search.length < 2) return [];
    return this.prisma.donor.findMany({
      where: {
        isDeleted: false,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { donorCode: { contains: search, mode: 'insensitive' } },
          { personalEmail: { contains: search, mode: 'insensitive' } },
          { primaryPhone: { contains: search, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        donorCode: true,
        personalEmail: true,
        officialEmail: true,
      },
      take: limit,
    });
  }

  async getTemplates() {
    return this.prisma.donorReportTemplate.findMany({
      include: { createdBy: { select: { name: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createTemplate(dto: {
    name: string;
    headerText?: string;
    footerText?: string;
    showDonationSummary?: boolean;
    showDonationBreakdown?: boolean;
    showBeneficiaries?: boolean;
    showCampaigns?: boolean;
    showUsageSummary?: boolean;
    isDefault?: boolean;
  }, user: UserContext) {
    if (dto.isDefault) {
      await this.prisma.donorReportTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.donorReportTemplate.create({
      data: {
        name: dto.name,
        headerText: dto.headerText,
        footerText: dto.footerText,
        showDonationSummary: dto.showDonationSummary ?? true,
        showDonationBreakdown: dto.showDonationBreakdown ?? true,
        showBeneficiaries: dto.showBeneficiaries ?? true,
        showCampaigns: dto.showCampaigns ?? true,
        showUsageSummary: dto.showUsageSummary ?? true,
        isDefault: dto.isDefault ?? false,
        createdById: user.id,
      },
      include: { createdBy: { select: { name: true } } },
    });
  }

  async updateTemplate(id: string, dto: Partial<{
    name: string;
    headerText: string;
    footerText: string;
    showDonationSummary: boolean;
    showDonationBreakdown: boolean;
    showBeneficiaries: boolean;
    showCampaigns: boolean;
    showUsageSummary: boolean;
    isDefault: boolean;
  }>) {
    const existing = await this.prisma.donorReportTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Template not found');

    if (dto.isDefault) {
      await this.prisma.donorReportTemplate.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.donorReportTemplate.update({
      where: { id },
      data: dto,
      include: { createdBy: { select: { name: true } } },
    });
  }

  async deleteTemplate(id: string) {
    const existing = await this.prisma.donorReportTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Template not found');
    await this.prisma.donorReportTemplate.delete({ where: { id } });
    return { message: 'Template deleted' };
  }

  async getCampaigns() {
    return this.prisma.campaign.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, status: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
