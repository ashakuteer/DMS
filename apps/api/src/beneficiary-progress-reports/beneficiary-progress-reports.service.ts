import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { BeneficiaryProgressReportsPdfService } from './beneficiary-progress-reports.pdf.service';
import { GenerateProgressReportDto, UserContext, ProgressReportData } from './beneficiary-progress-reports.types';

@Injectable()
export class BeneficiaryProgressReportsService {
  private readonly logger = new Logger(BeneficiaryProgressReportsService.name);

  constructor(
    private prisma: PrismaService,
    private emailJobsService: EmailJobsService,
    private orgProfileService: OrganizationProfileService,
    private pdfService: BeneficiaryProgressReportsPdfService,
  ) {}

  async generate(dto: GenerateProgressReportDto, user: UserContext) {
    const beneficiary = await this.prisma.beneficiary.findUnique({
      where: { id: dto.beneficiaryId },
      select: {
        id: true, fullName: true, code: true, homeType: true, gender: true,
        approxAge: true, photoUrl: true, joinDate: true,
        educationClassOrRole: true, schoolOrCollege: true,
        currentHealthStatus: true, hobbies: true, dreamCareer: true,
        favouriteSubject: true, protectPrivacy: true,
      },
    });
    if (!beneficiary) throw new NotFoundException('Beneficiary not found');

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      throw new BadRequestException('Invalid date range');
    }

    const title = dto.title || `Progress Report - ${beneficiary.fullName} (${this.formatDateRange(periodStart, periodEnd)})`;

    const report = await this.prisma.beneficiaryProgressReport.create({
      data: {
        beneficiaryId: dto.beneficiaryId,
        title,
        periodStart,
        periodEnd,
        includePhotos: dto.includePhotos ?? true,
        includeHealth: dto.includeHealth ?? true,
        includeEducation: dto.includeEducation ?? true,
        includeUpdates: dto.includeUpdates ?? true,
        generatedById: user.id,
        status: 'GENERATING',
      },
    });

    try {
      const reportData = await this.aggregateData(
        dto.beneficiaryId,
        periodStart,
        periodEnd,
        {
          includePhotos: dto.includePhotos ?? true,
          includeHealth: dto.includeHealth ?? true,
          includeEducation: dto.includeEducation ?? true,
          includeUpdates: dto.includeUpdates ?? true,
        },
        beneficiary,
      );

      await this.prisma.beneficiaryProgressReport.update({
        where: { id: report.id },
        data: { reportData: reportData as any, status: 'READY' },
      });

      return { id: report.id, status: 'READY' };
    } catch (err) {
      this.logger.error(`Failed to generate progress report: ${err.message}`, err.stack);
      await this.prisma.beneficiaryProgressReport.update({
        where: { id: report.id },
        data: { status: 'FAILED' },
      });
      throw err;
    }
  }

  private async aggregateData(
    beneficiaryId: string,
    periodStart: Date,
    periodEnd: Date,
    options: { includePhotos: boolean; includeHealth: boolean; includeEducation: boolean; includeUpdates: boolean },
    beneficiary: any,
  ): Promise<ProgressReportData> {
    const [healthEvents, metrics, progressCards, updates, sponsorships] = await Promise.all([
      options.includeHealth
        ? this.prisma.beneficiaryHealthEvent.findMany({
            where: {
              beneficiaryId,
              eventDate: { gte: periodStart, lte: periodEnd },
            },
            orderBy: { eventDate: 'asc' },
          })
        : Promise.resolve([]),
      options.includeHealth
        ? this.prisma.beneficiaryMetric.findMany({
            where: {
              beneficiaryId,
              recordedOn: { gte: periodStart, lte: periodEnd },
            },
            orderBy: { recordedOn: 'asc' },
          })
        : Promise.resolve([]),
      options.includeEducation
        ? this.prisma.progressCard.findMany({
            where: {
              beneficiaryId,
              createdAt: { gte: periodStart, lte: periodEnd },
            },
            orderBy: { createdAt: 'asc' },
          })
        : Promise.resolve([]),
      options.includeUpdates
        ? this.prisma.beneficiaryUpdate.findMany({
            where: {
              beneficiaryId,
              createdAt: { gte: periodStart, lte: periodEnd },
              isPrivate: false,
            },
            orderBy: { createdAt: 'asc' },
          })
        : Promise.resolve([]),
      this.prisma.sponsorship.findMany({
        where: { beneficiaryId, isActive: true },
        include: { donor: { select: { firstName: true, lastName: true, donorCode: true } } },
      }),
    ]);

    const photos: string[] = [];
    if (options.includePhotos) {
      if (beneficiary.photoUrl && !beneficiary.protectPrivacy) {
        photos.push(beneficiary.photoUrl);
      }
      for (const u of updates) {
        if (u.mediaUrls?.length) {
          photos.push(...u.mediaUrls);
        }
      }
    }

    return {
      beneficiary: {
        fullName: beneficiary.fullName,
        code: beneficiary.code,
        homeType: beneficiary.homeType,
        gender: beneficiary.gender,
        approxAge: beneficiary.approxAge,
        photoUrl: !beneficiary.protectPrivacy ? beneficiary.photoUrl : undefined,
        joinDate: beneficiary.joinDate?.toISOString(),
        educationClassOrRole: beneficiary.educationClassOrRole,
        schoolOrCollege: beneficiary.schoolOrCollege,
        currentHealthStatus: beneficiary.currentHealthStatus,
        hobbies: beneficiary.hobbies,
        dreamCareer: beneficiary.dreamCareer,
        favouriteSubject: beneficiary.favouriteSubject,
      },
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        label: this.formatDateRange(periodStart, periodEnd),
      },
      healthEvents: healthEvents.map((e: any) => ({
        date: e.eventDate.toISOString(),
        title: e.title,
        description: e.description,
        severity: e.severity,
      })),
      healthMetrics: metrics.map((m: any) => ({
        date: m.recordedOn.toISOString(),
        heightCm: m.heightCm,
        weightKg: m.weightKg ? Number(m.weightKg) : undefined,
        healthStatus: m.healthStatus,
        notes: m.notes,
      })),
      progressCards: progressCards.map((p: any) => ({
        academicYear: p.academicYear,
        term: p.term,
        classGrade: p.classGrade,
        school: p.school,
        percentage: p.overallPercentage ? Number(p.overallPercentage) : undefined,
        remarks: p.remarks,
      })),
      updates: updates.map((u: any) => ({
        date: u.createdAt.toISOString(),
        type: u.updateType,
        title: u.title,
        content: u.content,
        mediaUrls: u.mediaUrls || [],
      })),
      sponsors: sponsorships.map((s: any) => ({
        name: `${s.donor.firstName} ${s.donor.lastName || ''}`.trim(),
        code: s.donor.donorCode,
      })),
      photos,
    };
  }

  async findAll(page: number = 1, limit: number = 20, filters?: { beneficiaryId?: string }) {
    const where: any = {};
    if (filters?.beneficiaryId) where.beneficiaryId = filters.beneficiaryId;

    const [items, total] = await Promise.all([
      this.prisma.beneficiaryProgressReport.findMany({
        where,
        include: {
          beneficiary: { select: { fullName: true, code: true, homeType: true } },
          generatedBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.beneficiaryProgressReport.count({ where }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const report = await this.prisma.beneficiaryProgressReport.findUnique({
      where: { id },
      include: {
        beneficiary: { select: { fullName: true, code: true, homeType: true, photoUrl: true } },
        generatedBy: { select: { name: true } },
      },
    });
    if (!report) throw new NotFoundException('Progress report not found');
    return report;
  }

  async generatePdf(id: string): Promise<Buffer> {
    const report = await this.findOne(id);
    return this.pdfService.generatePdf(report);
  }

  async shareWithSponsors(id: string, user: UserContext) {
    const report = await this.findOne(id);
    if (report.status !== 'READY' && report.status !== 'SHARED') {
      throw new BadRequestException('Report is not ready for sharing');
    }

    const sponsorships = await this.prisma.sponsorship.findMany({
      where: { beneficiaryId: report.beneficiaryId, isActive: true },
      include: {
        donor: { select: { id: true, firstName: true, lastName: true, personalEmail: true, officialEmail: true } },
      },
    });

    if (sponsorships.length === 0) {
      throw new BadRequestException('No active sponsors to share with');
    }

    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;
    const data = report.reportData as unknown as ProgressReportData;

    const donorIds: string[] = [];
    for (const sp of sponsorships) {
      const email = sp.donor.personalEmail || sp.donor.officialEmail;
      if (!email) continue;

      const donorName = `${sp.donor.firstName} ${sp.donor.lastName || ''}`.trim();
      const subject = `Progress Report: ${data?.beneficiary?.fullName || report.beneficiary.fullName}`;
      const body = this.buildShareEmail(donorName, data?.beneficiary?.fullName || report.beneficiary.fullName, data?.period?.label || '', orgName);

      await this.emailJobsService.create({
        donorId: sp.donor.id,
        toEmail: email,
        subject,
        body,
        type: 'BENEFICIARY_PROGRESS_REPORT' as any,
        relatedId: id,
        scheduledAt: new Date(),
      });
      donorIds.push(sp.donor.id);
    }

    await this.prisma.beneficiaryProgressReport.update({
      where: { id },
      data: {
        status: 'SHARED',
        sharedAt: new Date(),
        sharedTo: donorIds,
      },
    });

    return { sharedCount: donorIds.length };
  }

  async shareToDonors(id: string, donorIds: string[], user: UserContext) {
    const report = await this.findOne(id);
    if (report.status !== 'READY' && report.status !== 'SHARED') {
      throw new BadRequestException('Report is not ready for sharing');
    }

    const donors = await this.prisma.donor.findMany({
      where: { id: { in: donorIds } },
      select: { id: true, firstName: true, lastName: true, personalEmail: true, officialEmail: true },
    });

    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;
    const data = report.reportData as unknown as ProgressReportData;

    let sharedCount = 0;
    for (const donor of donors) {
      const email = donor.personalEmail || donor.officialEmail;
      if (!email) continue;

      const donorName = `${donor.firstName} ${donor.lastName || ''}`.trim();
      const subject = `Progress Report: ${data?.beneficiary?.fullName || report.beneficiary.fullName}`;
      const body = this.buildShareEmail(donorName, data?.beneficiary?.fullName || report.beneficiary.fullName, data?.period?.label || '', orgName);

      await this.emailJobsService.create({
        donorId: donor.id,
        toEmail: email,
        subject,
        body,
        type: 'BENEFICIARY_PROGRESS_REPORT' as any,
        relatedId: id,
        scheduledAt: new Date(),
      });
      sharedCount++;
    }

    const existingShared = report.sharedTo || [];
    const allShared = [...new Set([...existingShared, ...donorIds])];

    await this.prisma.beneficiaryProgressReport.update({
      where: { id },
      data: {
        status: 'SHARED',
        sharedAt: new Date(),
        sharedTo: allShared,
      },
    });

    return { sharedCount };
  }

  async delete(id: string) {
    const report = await this.findOne(id);
    await this.prisma.beneficiaryProgressReport.delete({ where: { id: report.id } });
    return { deleted: true };
  }

  async searchBeneficiaries(q: string) {
    const beneficiaries = await this.prisma.beneficiary.findMany({
      where: {
        isDeleted: false,
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, fullName: true, code: true, homeType: true },
      take: 15,
    });
    return beneficiaries;
  }

  private buildShareEmail(donorName: string, beneficiaryName: string, period: string, orgName: string): string {
    return `
Dear ${donorName},

We are pleased to share the progress report for ${beneficiaryName}${period ? ` covering the period ${period}` : ''}.

This report includes updates on their health, education, and overall development. We hope this gives you joy and confidence in the positive impact of your support.

Please find the detailed report attached or contact us for more information.

With gratitude,
${orgName}
    `.trim();
  }

  private formatDateRange(start: Date, end: Date): string {
    const fmt = (d: Date) => d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    return `${fmt(start)} - ${fmt(end)}`;
  }
}
