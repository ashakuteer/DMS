import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailJobsService, CreateEmailJobDto } from '../email-jobs/email-jobs.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { CommunicationType } from '@prisma/client';
import { UserContext } from './birthday-wishes.types';

@Injectable()
export class BirthdayWishBeneficiaryService {
  private readonly logger = new Logger(BirthdayWishBeneficiaryService.name);

  constructor(
    private prisma: PrismaService,
    private emailJobsService: EmailJobsService,
    private communicationLogService: CommunicationLogService,
    private orgProfileService: OrganizationProfileService,
  ) {}

  private calculateDaysUntil(
    dobMonth: number,
    dobDay: number,
    currentMonth: number,
    currentDay: number,
    now: Date,
  ): number {
    let birthdayThisYear = new Date(now.getFullYear(), dobMonth - 1, dobDay);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (
      birthdayThisYear.getMonth() + 1 === currentMonth &&
      birthdayThisYear.getDate() === currentDay
    ) {
      return 0;
    }

    if (birthdayThisYear < todayStart) {
      birthdayThisYear = new Date(now.getFullYear() + 1, dobMonth - 1, dobDay);
    }

    return Math.ceil(
      (birthdayThisYear.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  private async formatHomeType(homeType: string): Promise<string> {
    const orgName = (await this.orgProfileService.getProfile()).name;
    const map: Record<string, string> = {
      ORPHAN_GIRLS: `${orgName} Girls Home`,
      BLIND_BOYS: `${orgName} Blind Boys Home`,
      OLD_AGE: `${orgName} Old Age Home`,
    };
    return map[homeType] || homeType;
  }

  private buildBirthdayIntro(
    beneficiaryName: string,
    homeName: string,
    daysUntil: number,
  ): string {
    if (daysUntil === 0) {
      return `<p>Today is a special day! <strong>${beneficiaryName}</strong> from ${homeName} is celebrating their birthday.</p>`;
    } else if (daysUntil <= 2) {
      return `<p>${beneficiaryName} from ${homeName} will be celebrating their birthday in just ${daysUntil} day${daysUntil > 1 ? 's' : ''}!</p>`;
    } else if (daysUntil <= 7) {
      return `<p>${beneficiaryName} from ${homeName} has a birthday coming up in ${daysUntil} days!</p>`;
    }
    return `<p>${beneficiaryName} from ${homeName} has a birthday coming up in ${daysUntil} days.</p>`;
  }

  private renderTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
    }
    return result;
  }

  private async getEmailTemplate(key: string): Promise<{ subject: string | null; body: string }> {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { key_channel: { key, channel: 'EMAIL' } },
    });

    if (template) {
      return { subject: template.subject, body: template.body };
    }

    return {
      subject: `{{beneficiary_name}}'s Birthday - {{org_name}}`,
      body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><p>Dear <strong>{{donor_name}}</strong>,</p>{{birthday_intro}}<p>Your continued support makes a real difference in ${`{{beneficiary_name}}`}'s life at {{home_name}}.</p><p>With warm regards,<br/><strong>{{org_name}}</strong></p></div>`,
    };
  }

  async getUpcomingBeneficiaryBirthdays(range: 'today' | 'next7' = 'next7') {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const beneficiaries = await this.prisma.beneficiary.findMany({
      where: {
        isDeleted: false,
        dobMonth: { not: null },
        dobDay: { not: null },
      },
      select: {
        id: true,
        code: true,
        fullName: true,
        homeType: true,
        dobDay: true,
        dobMonth: true,
        protectPrivacy: true,
        photoUrl: true,
        sponsorships: {
          where: { isActive: true, status: 'ACTIVE' },
          select: {
            id: true,
            donor: {
              select: {
                id: true,
                donorCode: true,
                firstName: true,
                lastName: true,
                personalEmail: true,
                officialEmail: true,
                whatsappPhone: true,
              },
            },
          },
        },
        updates: {
          orderBy: { createdAt: 'desc' as const },
          take: 1,
          select: { title: true },
        },
      },
    });

    const results: any[] = [];
    for (const b of beneficiaries) {
      if (!b.dobDay || !b.dobMonth) continue;
      const daysUntil = this.calculateDaysUntil(
        b.dobMonth,
        b.dobDay,
        currentMonth,
        currentDay,
        now,
      );
      if (range === 'today' && daysUntil !== 0) continue;
      if (range === 'next7' && (daysUntil < 0 || daysUntil > 7)) continue;

      results.push({
        beneficiaryId: b.id,
        beneficiaryCode: b.code,
        beneficiaryName: b.fullName,
        homeType: b.homeType,
        dobDay: b.dobDay,
        dobMonth: b.dobMonth,
        daysUntil,
        isToday: daysUntil === 0,
        photoUrl: b.protectPrivacy ? null : b.photoUrl,
        latestUpdate: b.updates[0]?.title || null,
        sponsors: b.sponsorships.map((s) => ({
          donorId: s.donor.id,
          donorCode: s.donor.donorCode,
          donorName: [s.donor.firstName, s.donor.lastName].filter(Boolean).join(' '),
          hasEmail: !!(s.donor.personalEmail || s.donor.officialEmail),
          hasWhatsApp: !!s.donor.whatsappPhone,
        })),
      });
    }

    results.sort((a, b) => a.daysUntil - b.daysUntil);
    return results;
  }

  async sendBeneficiaryBirthdayWish(
    beneficiaryId: string,
    user: UserContext,
  ): Promise<{ success: boolean; message: string; sent: number }> {
    const beneficiary = await this.prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
      select: {
        id: true,
        fullName: true,
        homeType: true,
        dobDay: true,
        dobMonth: true,
        protectPrivacy: true,
        photoUrl: true,
        sponsorships: {
          where: { isActive: true, status: 'ACTIVE' },
          select: {
            donor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                personalEmail: true,
                officialEmail: true,
              },
            },
          },
        },
        updates: {
          orderBy: { createdAt: 'desc' as const },
          take: 1,
          select: { title: true },
        },
      },
    });

    if (!beneficiary) throw new NotFoundException('Beneficiary not found');

    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;
    const homeName = await this.formatHomeType(beneficiary.homeType);
    const updateSnippet = beneficiary.updates[0]?.title || 'is doing well at the home';

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const daysUntil =
      beneficiary.dobMonth && beneficiary.dobDay
        ? this.calculateDaysUntil(
            beneficiary.dobMonth,
            beneficiary.dobDay,
            currentMonth,
            currentDay,
            now,
          )
        : 0;

    const birthdayIntro = this.buildBirthdayIntro(beneficiary.fullName, homeName, daysUntil);

    const emailTemplate = await this.getEmailTemplate('BENEFICIARY_BIRTHDAY_WISH');

    let sentCount = 0;

    for (const sponsorship of beneficiary.sponsorships) {
      const donor = sponsorship.donor;
      const toEmail = donor.personalEmail || donor.officialEmail;
      if (!toEmail) continue;

      const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
      const variables: Record<string, string> = {
        donor_name: donorName,
        beneficiary_name: beneficiary.fullName,
        home_name: homeName,
        update_snippet: updateSnippet,
        birthday_intro: birthdayIntro,
        org_name: orgName,
      };

      const subject = this.renderTemplate(
        emailTemplate.subject || `${beneficiary.fullName}'s Birthday - ${orgName}`,
        variables,
      );
      const body = this.renderTemplate(emailTemplate.body, variables);

      const emailJobDto: CreateEmailJobDto = {
        donorId: donor.id,
        toEmail,
        subject,
        body,
        type: 'BENEFICIARY_BIRTHDAY',
        relatedId: `benef-birthday-${beneficiary.id}-${now.getFullYear()}`,
        scheduledAt: new Date(now.getTime() + 60000),
      };

      await this.emailJobsService.create(emailJobDto);

      await this.prisma.outboundMessageLog.create({
        data: {
          type: 'BENEFICIARY_BIRTHDAY',
          channel: 'EMAIL',
          donorId: donor.id,
          beneficiaryIds: [beneficiary.id],
          status: 'QUEUED',
          createdById: user.userId,
        },
      });

      await this.communicationLogService.logEmail({
        donorId: donor.id,
        toEmail,
        subject,
        messagePreview: `Birthday greeting for ${beneficiary.fullName} sent to sponsor ${donorName}`,
        status: 'SENT',
        sentById: user.userId,
        type: CommunicationType.GREETING,
      });

      sentCount++;
    }

    return {
      success: true,
      message: `Birthday wish emails queued for ${sentCount} sponsor(s) of ${beneficiary.fullName}`,
      sent: sentCount,
    };
  }

  async getSentLog(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.outboundMessageLog.findMany({
        where: { type: { in: ['DONOR_BIRTHDAY', 'BENEFICIARY_BIRTHDAY'] } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          donor: { select: { id: true, firstName: true, lastName: true, donorCode: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.outboundMessageLog.count({
        where: { type: { in: ['DONOR_BIRTHDAY', 'BENEFICIARY_BIRTHDAY'] } },
      }),
    ]);

    return {
      logs: logs.map((l) => ({
        id: l.id,
        type: l.type,
        channel: l.channel,
        donorId: l.donorId,
        donorName: [l.donor.firstName, l.donor.lastName].filter(Boolean).join(' '),
        donorCode: l.donor.donorCode,
        beneficiaryIds: l.beneficiaryIds,
        status: l.status,
        createdAt: l.createdAt,
        createdBy: l.createdBy?.name || 'System',
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
