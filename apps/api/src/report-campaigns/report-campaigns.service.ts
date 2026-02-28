import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailJobsService, CreateEmailJobDto } from '../email-jobs/email-jobs.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { ReportCampaignStatus, ReportCampaignType, ReportTarget } from '@prisma/client';

interface UserContext {
  userId: string;
  role: string;
}

interface CreateCampaignDto {
  name: string;
  type: ReportCampaignType;
  periodStart: string;
  periodEnd: string;
  target: ReportTarget;
  customDonorIds?: string[];
  notes?: string;
}

@Injectable()
export class ReportCampaignsService {
  private readonly logger = new Logger(ReportCampaignsService.name);

  constructor(
    private prisma: PrismaService,
    private emailJobsService: EmailJobsService,
    private orgProfileService: OrganizationProfileService,
  ) {}

  async findAll() {
    return this.prisma.reportCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        document: { select: { id: true, title: true, storagePath: true, mimeType: true } },
      },
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.reportCampaign.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        document: { select: { id: true, title: true, storagePath: true, mimeType: true } },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async create(dto: CreateCampaignDto, user: UserContext) {
    if (dto.target === 'CUSTOM' && (!dto.customDonorIds || dto.customDonorIds.length === 0)) {
      throw new BadRequestException('Please select at least one donor for custom audience');
    }

    return this.prisma.reportCampaign.create({
      data: {
        name: dto.name,
        type: dto.type,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        target: dto.target,
        customDonorIds: dto.customDonorIds || [],
        notes: dto.notes || null,
        status: 'DRAFT',
        createdById: user.userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        document: { select: { id: true, title: true, storagePath: true, mimeType: true } },
      },
    });
  }

  async attachDocument(campaignId: string, documentData: {
    title: string;
    storagePath: string;
    storageBucket: string;
    mimeType: string;
    sizeBytes: number;
  }, user: UserContext) {
    const campaign = await this.prisma.reportCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status !== 'DRAFT') throw new BadRequestException('Can only attach documents to draft campaigns');

    const document = await this.prisma.document.create({
      data: {
        ownerType: 'ORGANIZATION',
        docType: 'OTHER',
        title: documentData.title,
        storageBucket: documentData.storageBucket,
        storagePath: documentData.storagePath,
        mimeType: documentData.mimeType,
        sizeBytes: documentData.sizeBytes,
        isSensitive: false,
        shareWithDonor: true,
        createdById: user.userId,
      },
    });

    const updated = await this.prisma.reportCampaign.update({
      where: { id: campaignId },
      data: { documentId: document.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        document: { select: { id: true, title: true, storagePath: true, mimeType: true } },
      },
    });

    this.logger.log(`Document attached to campaign ${campaignId}: ${document.id}`);
    return updated;
  }

  async send(campaignId: string, user: UserContext) {
    const campaign = await this.prisma.reportCampaign.findUnique({
      where: { id: campaignId },
      include: {
        document: { select: { id: true, title: true, storagePath: true } },
      },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status === 'SENT') throw new BadRequestException('Campaign has already been sent');
    if (!campaign.document) throw new BadRequestException('Please attach a report document before sending');

    const donors = await this.getTargetDonors(campaign.target, campaign.customDonorIds);

    if (donors.length === 0) {
      throw new BadRequestException('No donors found for the selected target audience');
    }

    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;
    const reportUrl = campaign.document.storagePath;
    const periodLabel = this.formatPeriodLabel(campaign);

    await this.prisma.reportCampaign.update({
      where: { id: campaignId },
      data: { status: 'QUEUED' },
    });

    let emailCount = 0;
    const scheduledAt = new Date(Date.now() + 60000);

    for (const donor of donors) {
      const toEmail = donor.personalEmail || donor.officialEmail;
      if (!toEmail) continue;

      const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');

      const subject = `${campaign.name} - ${orgName}`;
      const body = this.buildEmailBody(donorName, orgName, campaign.name, periodLabel, reportUrl, campaign.document.title);

      const emailJobDto: CreateEmailJobDto = {
        donorId: donor.id,
        toEmail,
        subject,
        body,
        type: 'REPORT_CAMPAIGN',
        relatedId: campaignId,
        scheduledAt,
      };

      try {
        await this.emailJobsService.create(emailJobDto);
        emailCount++;

        await this.prisma.outboundMessageLog.create({
          data: {
            type: 'REPORT_CAMPAIGN',
            channel: 'EMAIL',
            donorId: donor.id,
            beneficiaryIds: [],
            status: 'QUEUED',
            createdById: user.userId,
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to queue email for donor ${donor.id}: ${err.message}`);
      }
    }

    await this.prisma.reportCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'SENT',
        emailsSent: emailCount,
        sentAt: new Date(),
      },
    });

    this.logger.log(`Campaign ${campaignId} sent: ${emailCount} emails queued`);
    return {
      success: true,
      message: `Report emails queued for ${emailCount} donor${emailCount !== 1 ? 's' : ''}`,
      emailCount,
    };
  }

  async getWhatsAppText(campaignId: string) {
    const campaign = await this.prisma.reportCampaign.findUnique({
      where: { id: campaignId },
      include: {
        document: { select: { id: true, title: true, storagePath: true } },
      },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;
    const periodLabel = this.formatPeriodLabel(campaign);
    const reportUrl = campaign.document?.storagePath || '';

    const text = [
      `Dear Donor,`,
      ``,
      `Greetings from ${orgName}!`,
      ``,
      `We are pleased to share our ${campaign.name} covering the period ${periodLabel}.`,
      ``,
      reportUrl ? `You can view/download the report here:` : '',
      reportUrl || '',
      ``,
      `Thank you for your continued support and generosity.`,
      ``,
      `With gratitude,`,
      orgName,
    ].filter((line) => line !== undefined).join('\n');

    return { text, reportUrl };
  }

  async markWhatsAppSent(campaignId: string, donorId: string, user: UserContext) {
    const campaign = await this.prisma.reportCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.prisma.outboundMessageLog.create({
      data: {
        type: 'REPORT_CAMPAIGN',
        channel: 'WHATSAPP',
        donorId,
        beneficiaryIds: [],
        status: 'COPIED',
        createdById: user.userId,
      },
    });

    return { success: true };
  }

  async searchDonors(query: string) {
    if (!query || query.length < 2) return [];

    return this.prisma.donor.findMany({
      where: {
        isDeleted: false,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { donorCode: { contains: query, mode: 'insensitive' } },
          { personalEmail: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        lastName: true,
        personalEmail: true,
        officialEmail: true,
      },
      take: 20,
      orderBy: { firstName: 'asc' },
    });
  }

  async getCampaignDonors(campaignId: string) {
    const campaign = await this.prisma.reportCampaign.findUnique({
      where: { id: campaignId },
      select: { customDonorIds: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.customDonorIds.length === 0) return [];

    return this.prisma.donor.findMany({
      where: { id: { in: campaign.customDonorIds }, isDeleted: false },
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        lastName: true,
        personalEmail: true,
        officialEmail: true,
      },
    });
  }

  private async getTargetDonors(target: string, customDonorIds: string[] = []) {
    if (target === 'CUSTOM' && customDonorIds.length > 0) {
      return this.prisma.donor.findMany({
        where: { id: { in: customDonorIds }, isDeleted: false },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          personalEmail: true,
          officialEmail: true,
          whatsappPhone: true,
        },
      });
    }

    const where: any = { isDeleted: false };

    if (target === 'SPONSORS_ONLY') {
      where.sponsorships = {
        some: { isActive: true, status: 'ACTIVE' },
      };
    }

    return this.prisma.donor.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        personalEmail: true,
        officialEmail: true,
        whatsappPhone: true,
      },
    });
  }

  private formatPeriodLabel(campaign: { periodStart: Date; periodEnd: Date; type: string }) {
    const start = new Date(campaign.periodStart);
    const end = new Date(campaign.periodEnd);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[start.getMonth()]} ${start.getFullYear()} - ${months[end.getMonth()]} ${end.getFullYear()}`;
  }

  private buildEmailBody(
    donorName: string,
    orgName: string,
    campaignName: string,
    periodLabel: string,
    reportUrl: string,
    documentTitle: string,
  ) {
    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <p>Dear <strong>${donorName}</strong>,</p>
  <p>Greetings from <strong>${orgName}</strong>!</p>
  <p>We are pleased to share our <strong>${campaignName}</strong> covering the period <strong>${periodLabel}</strong>.</p>
  <p>This report highlights the impact of your generous contributions and the progress made by our beneficiaries.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="${reportUrl}" style="display:inline-block;padding:12px 24px;background-color:#2E7D5A;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
      View Report: ${documentTitle}
    </a>
  </div>
  <p>Thank you for your continued support and generosity. Together, we are making a real difference.</p>
  <p>With warm regards,<br/><strong>${orgName}</strong></p>
</div>`;
  }
}
