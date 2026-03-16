import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { DonorReportType, DonorReportStatus } from '@prisma/client';
import { DonorReportsExportService } from './donor-reports.export.service';

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
    private exportService: DonorReportsExportService,
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
    return this.exportService.generatePdf(report);
  }

  async generateExcel(id: string): Promise<Buffer> {
    const report = await this.findOne(id);
    return this.exportService.generateExcel(report);
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
