import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailJobsService, CreateEmailJobDto } from '../email-jobs/email-jobs.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { CommunicationType } from '@prisma/client';
import { BirthdayWishBeneficiaryService } from './birthday-wishes.beneficiary.service';

interface UserContext {
  userId: string;
  role: string;
}

interface BeneficiaryWishInfo {
  id: string;
  fullName: string;
  homeType: string;
  protectPrivacy: boolean;
  photoUrl: string | null;
}

export interface DonorBirthdayResult {
  donorId: string;
  donorCode: string;
  donorName: string;
  firstName: string;
  lastName: string | null;
  dobDay: number;
  dobMonth: number;
  daysUntil: number;
  isToday: boolean;
  hasEmail: boolean;
  hasWhatsApp: boolean;
  personalEmail: string | null;
  officialEmail: string | null;
  whatsappPhone: string | null;
  beneficiaries: {
    id: string;
    name: string;
    homeType: string;
    privacyProtected: boolean;
  }[];
  whatsappText: string;
  emailSubject: string;
  emailHtml: string;
  imageUrl: string | null;
}

@Injectable()
export class BirthdayWishService {
  private readonly logger = new Logger(BirthdayWishService.name);
  constructor(
    private prisma: PrismaService,
    private emailJobsService: EmailJobsService,
    private communicationLogService: CommunicationLogService,
    private orgProfileService: OrganizationProfileService,
    private beneficiaryService: BirthdayWishBeneficiaryService,
  ) {}

  async getUpcomingBirthdays(range: 'today' | 'next7' = 'next7'): Promise<DonorBirthdayResult[]> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const donors = await this.prisma.donor.findMany({
      where: {
        isDeleted: false,
        dobDay: { not: null },
        dobMonth: { not: null },
      },
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        lastName: true,
        dobDay: true,
        dobMonth: true,
        personalEmail: true,
        officialEmail: true,
        whatsappPhone: true,
        whatsappPhoneCode: true,
        sponsorships: {
          where: { isActive: true, status: 'ACTIVE' },
          select: {
            beneficiary: {
              select: {
                id: true,
                fullName: true,
                homeType: true,
                protectPrivacy: true,
                photoUrl: true,
              },
            },
          },
        },
      },
    });

    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;

    const results: DonorBirthdayResult[] = [];

    for (const donor of donors) {
      if (!donor.dobDay || !donor.dobMonth) continue;

      const daysUntil = this.calculateDaysUntil(donor.dobMonth, donor.dobDay, currentMonth, currentDay, now);

      if (range === 'today' && daysUntil !== 0) continue;
      if (range === 'next7' && (daysUntil < 0 || daysUntil > 7)) continue;

      const beneficiaries: BeneficiaryWishInfo[] = donor.sponsorships.map((s) => ({
        id: s.beneficiary.id,
        fullName: s.beneficiary.fullName,
        homeType: s.beneficiary.homeType,
        protectPrivacy: s.beneficiary.protectPrivacy,
        photoUrl: s.beneficiary.photoUrl,
      }));

      const visibleBeneficiaries = beneficiaries.filter((b) => !b.protectPrivacy);
      const beneficiaryLine = await this.buildBeneficiaryLine(visibleBeneficiaries, beneficiaries);
      const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');

      const imageUrl = await this.findEligiblePhoto(donor.id, beneficiaries);

      const whatsappTemplate = await this.getTemplate('DONOR_BIRTHDAY_WISH', 'WHATSAPP');
      const emailTemplate = await this.getTemplate('DONOR_BIRTHDAY_WISH', 'EMAIL');

      const variables: Record<string, string> = {
        donor_name: donorName,
        org_name: orgName,
        beneficiary_line: beneficiaryLine,
        image_block: imageUrl
          ? `<div style="text-align:center;margin:16px 0;"><img src="${imageUrl}" alt="Beneficiary" style="max-width:400px;border-radius:8px;" /></div>`
          : '',
      };

      const whatsappText = this.renderTemplate(whatsappTemplate.body, variables);
      const emailSubject = this.renderTemplate(emailTemplate.subject || '', variables);
      const emailHtml = this.renderTemplate(emailTemplate.body, variables);

      results.push({
        donorId: donor.id,
        donorCode: donor.donorCode,
        donorName,
        firstName: donor.firstName,
        lastName: donor.lastName,
        dobDay: donor.dobDay,
        dobMonth: donor.dobMonth,
        daysUntil,
        isToday: daysUntil === 0,
        hasEmail: !!(donor.personalEmail || donor.officialEmail),
        hasWhatsApp: !!donor.whatsappPhone,
        personalEmail: donor.personalEmail,
        officialEmail: donor.officialEmail,
        whatsappPhone: donor.whatsappPhone,
        beneficiaries: beneficiaries.map((b) => ({
          id: b.id,
          name: b.protectPrivacy ? `(Privacy Protected)` : b.fullName,
          homeType: b.homeType,
          privacyProtected: b.protectPrivacy,
        })),
        whatsappText,
        emailSubject,
        emailHtml,
        imageUrl,
      });
    }

    results.sort((a, b) => a.daysUntil - b.daysUntil);
    return results;
  }

  async getWishPreview(donorId: string): Promise<DonorBirthdayResult | null> {
    const donor = await this.prisma.donor.findUnique({
      where: { id: donorId },
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        lastName: true,
        dobDay: true,
        dobMonth: true,
        personalEmail: true,
        officialEmail: true,
        whatsappPhone: true,
        sponsorships: {
          where: { isActive: true, status: 'ACTIVE' },
          select: {
            beneficiary: {
              select: {
                id: true,
                fullName: true,
                homeType: true,
                protectPrivacy: true,
                photoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!donor || !donor.dobDay || !donor.dobMonth) return null;

    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const daysUntil = this.calculateDaysUntil(donor.dobMonth, donor.dobDay, currentMonth, currentDay, now);

    const beneficiaries: BeneficiaryWishInfo[] = donor.sponsorships.map((s) => ({
      id: s.beneficiary.id,
      fullName: s.beneficiary.fullName,
      homeType: s.beneficiary.homeType,
      protectPrivacy: s.beneficiary.protectPrivacy,
      photoUrl: s.beneficiary.photoUrl,
    }));

    const visibleBeneficiaries = beneficiaries.filter((b) => !b.protectPrivacy);
    const beneficiaryLine = await this.buildBeneficiaryLine(visibleBeneficiaries, beneficiaries);
    const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
    const imageUrl = await this.findEligiblePhoto(donorId, beneficiaries);

    const whatsappTemplate = await this.getTemplate('DONOR_BIRTHDAY_WISH', 'WHATSAPP');
    const emailTemplate = await this.getTemplate('DONOR_BIRTHDAY_WISH', 'EMAIL');

    const variables: Record<string, string> = {
      donor_name: donorName,
      org_name: orgName,
      beneficiary_line: beneficiaryLine,
      image_block: imageUrl
        ? `<div style="text-align:center;margin:16px 0;"><img src="${imageUrl}" alt="Beneficiary" style="max-width:400px;border-radius:8px;" /></div>`
        : '',
    };

    return {
      donorId: donor.id,
      donorCode: donor.donorCode,
      donorName,
      firstName: donor.firstName,
      lastName: donor.lastName,
      dobDay: donor.dobDay,
      dobMonth: donor.dobMonth,
      daysUntil,
      isToday: daysUntil === 0,
      hasEmail: !!(donor.personalEmail || donor.officialEmail),
      hasWhatsApp: !!donor.whatsappPhone,
      personalEmail: donor.personalEmail,
      officialEmail: donor.officialEmail,
      whatsappPhone: donor.whatsappPhone,
      beneficiaries: beneficiaries.map((b) => ({
        id: b.id,
        name: b.protectPrivacy ? `(Privacy Protected)` : b.fullName,
        homeType: b.homeType,
        privacyProtected: b.protectPrivacy,
      })),
      whatsappText: this.renderTemplate(whatsappTemplate.body, variables),
      emailSubject: this.renderTemplate(emailTemplate.subject || '', variables),
      emailHtml: this.renderTemplate(emailTemplate.body, variables),
      imageUrl,
    };
  }

  async queueBirthdayEmail(donorId: string, user: UserContext): Promise<{ success: boolean; message: string }> {
    const donor = await this.prisma.donor.findUnique({
      where: { id: donorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        personalEmail: true,
        officialEmail: true,
        dobDay: true,
        dobMonth: true,
        sponsorships: {
          where: { isActive: true, status: 'ACTIVE' },
          select: {
            beneficiary: {
              select: {
                id: true,
                fullName: true,
                homeType: true,
                protectPrivacy: true,
                photoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!donor) throw new NotFoundException('Donor not found');

    const toEmail = donor.personalEmail || donor.officialEmail;
    if (!toEmail) throw new BadRequestException('Donor has no email address on file');

    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;

    const beneficiaries: BeneficiaryWishInfo[] = donor.sponsorships.map((s) => ({
      id: s.beneficiary.id,
      fullName: s.beneficiary.fullName,
      homeType: s.beneficiary.homeType,
      protectPrivacy: s.beneficiary.protectPrivacy,
      photoUrl: s.beneficiary.photoUrl,
    }));

    const visibleBeneficiaries = beneficiaries.filter((b) => !b.protectPrivacy);
    const beneficiaryLine = await this.buildBeneficiaryLine(visibleBeneficiaries, beneficiaries);
    const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
    const imageUrl = await this.findEligiblePhoto(donorId, beneficiaries);

    const emailTemplate = await this.getTemplate('DONOR_BIRTHDAY_WISH', 'EMAIL');

    const variables: Record<string, string> = {
      donor_name: donorName,
      org_name: orgName,
      beneficiary_line: beneficiaryLine,
      image_block: imageUrl
        ? `<div style="text-align:center;margin:16px 0;"><img src="${imageUrl}" alt="Beneficiary" style="max-width:400px;border-radius:8px;" /></div>`
        : '',
    };

    const emailSubject = this.renderTemplate(emailTemplate.subject || `Happy Birthday, ${donorName}!`, variables);
    const emailHtml = this.renderTemplate(emailTemplate.body, variables);

    const now = new Date();
    const scheduledAt = new Date(now.getFullYear(), (donor.dobMonth || now.getMonth() + 1) - 1, donor.dobDay || now.getDate(), 8, 0, 0);
    if (scheduledAt < now) {
      scheduledAt.setTime(now.getTime() + 60000);
    }

    const emailJobDto: CreateEmailJobDto = {
      donorId: donor.id,
      toEmail,
      subject: emailSubject,
      body: emailHtml,
      type: 'DONOR_BIRTHDAY',
      relatedId: `birthday-${donor.dobMonth}-${donor.dobDay}-${now.getFullYear()}`,
      scheduledAt,
    };

    await this.emailJobsService.create(emailJobDto);

    await this.prisma.outboundMessageLog.create({
      data: {
        type: 'DONOR_BIRTHDAY',
        channel: 'EMAIL',
        donorId: donor.id,
        beneficiaryIds: beneficiaries.map((b) => b.id),
        status: 'QUEUED',
        createdById: user.userId,
      },
    });

    await this.communicationLogService.logEmail({
      donorId: donor.id,
      toEmail,
      subject: emailSubject,
      messagePreview: `Birthday wish email queued for ${donorName}`,
      status: 'SENT',
      sentById: user.userId,
      type: CommunicationType.GREETING,
    });

    this.logger.log(`Birthday email queued for donor ${donorId} (${donorName}) to ${toEmail}`);
    return { success: true, message: `Birthday email queued for ${donorName}` };
  }

  async markSent(donorId: string, channel: 'EMAIL' | 'WHATSAPP', user: UserContext): Promise<{ success: boolean }> {
    const donor = await this.prisma.donor.findUnique({
      where: { id: donorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        whatsappPhone: true,
        personalEmail: true,
        officialEmail: true,
        sponsorships: {
          where: { isActive: true, status: 'ACTIVE' },
          select: { beneficiaryId: true },
        },
      },
    });

    if (!donor) throw new NotFoundException('Donor not found');

    const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');

    await this.prisma.outboundMessageLog.create({
      data: {
        type: 'DONOR_BIRTHDAY',
        channel: channel === 'EMAIL' ? 'EMAIL' : 'WHATSAPP',
        donorId: donor.id,
        beneficiaryIds: donor.sponsorships.map((s) => s.beneficiaryId),
        status: channel === 'WHATSAPP' ? 'COPIED' : 'SENT',
        createdById: user.userId,
      },
    });

    if (channel === 'WHATSAPP' && donor.whatsappPhone) {
      await this.communicationLogService.logWhatsApp({
        donorId: donor.id,
        phoneNumber: donor.whatsappPhone,
        messagePreview: `Birthday wish sent via WhatsApp to ${donorName}`,
        sentById: user.userId,
        type: CommunicationType.GREETING,
      });
    }

    return { success: true };
  }

  async getUpcomingBeneficiaryBirthdays(range: 'today' | 'next7' = 'next7') {
    return this.beneficiaryService.getUpcomingBeneficiaryBirthdays(range);
  }

  async sendBeneficiaryBirthdayWish(
    beneficiaryId: string,
    user: UserContext,
  ): Promise<{ success: boolean; message: string; sent: number }> {
    return this.beneficiaryService.sendBeneficiaryBirthdayWish(beneficiaryId, user);
  }

  async getSentLog(page = 1, limit = 20) {
    return this.beneficiaryService.getSentLog(page, limit);
  }

  private buildBirthdayIntro(beneficiaryName: string, homeName: string, daysUntil: number): string {
    if (daysUntil === 0) {
      return `<p>Today is a special day! <strong>${beneficiaryName}</strong> from ${homeName} is celebrating their birthday.</p>`;
    } else if (daysUntil <= 2) {
      return `<p>${beneficiaryName} from ${homeName} will be celebrating their birthday in just ${daysUntil} day${daysUntil > 1 ? 's' : ''}!</p>`;
    } else if (daysUntil <= 7) {
      return `<p>${beneficiaryName} from ${homeName} has a birthday coming up in ${daysUntil} days!</p>`;
    }
    return `<p>${beneficiaryName} from ${homeName} has a birthday coming up in ${daysUntil} days.</p>`;
  }

  async getTemplates() {
    const templates = await this.prisma.messageTemplate.findMany({
      where: { key: { in: ['DONOR_BIRTHDAY_WISH', 'BENEFICIARY_BIRTHDAY_WISH'] } },
      orderBy: [{ key: 'asc' }, { channel: 'asc' }],
    });
    return templates.map((t) => {
      const variableMatches = t.body.match(/\{\{(\w+)\}\}/g);
      const variables = variableMatches
        ? [...new Set(variableMatches.map((v) => v.replace(/\{\{|\}\}/g, '')))]
        : [];
      return { ...t, variables };
    });
  }

  async updateTemplate(id: string, data: { subject?: string; body: string }, userId: string) {
    return this.prisma.messageTemplate.update({
      where: { id },
      data: {
        subject: data.subject,
        body: data.body,
        updatedById: userId,
      },
    });
  }

  private calculateDaysUntil(dobMonth: number, dobDay: number, currentMonth: number, currentDay: number, now: Date): number {
    let birthdayThisYear = new Date(now.getFullYear(), dobMonth - 1, dobDay);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (birthdayThisYear.getMonth() + 1 === currentMonth && birthdayThisYear.getDate() === currentDay) {
      return 0;
    }

    if (birthdayThisYear < todayStart) {
      birthdayThisYear = new Date(now.getFullYear() + 1, dobMonth - 1, dobDay);
    }

    return Math.ceil((birthdayThisYear.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async buildBeneficiaryLine(visibleBeneficiaries: BeneficiaryWishInfo[], allBeneficiaries: BeneficiaryWishInfo[]): Promise<string> {
    if (visibleBeneficiaries.length === 0) {
      if (allBeneficiaries.length > 0) {
        const homeTypeResults = await Promise.all(allBeneficiaries.map((b) => this.formatHomeType(b.homeType)));
        const homeTypes = [...new Set(homeTypeResults)];
        return `Our children and elders at ${homeTypes.join(' and ')} send warm wishes.`;
      }
      return 'Our children and elders send warm wishes.';
    }

    if (visibleBeneficiaries.length === 1) {
      return `Your sponsored beneficiary ${visibleBeneficiaries[0].fullName} sends warm wishes.`;
    }

    const names = visibleBeneficiaries.map((b) => b.fullName);
    const lastTwo = names.slice(-2).join(' and ');
    const rest = names.slice(0, -2);
    const nameStr = rest.length > 0 ? `${rest.join(', ')}, ${lastTwo}` : lastTwo;
    return `Your sponsored beneficiaries ${nameStr} send warm wishes.`;
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

  private async findEligiblePhoto(donorId: string, beneficiaries: BeneficiaryWishInfo[]): Promise<string | null> {
    const visibleBeneficiaries = beneficiaries.filter((b) => !b.protectPrivacy);

    if (visibleBeneficiaries.length > 0) {
      const beneficiaryIds = visibleBeneficiaries.map((b) => b.id);
      const photo = await this.prisma.document.findFirst({
        where: {
          ownerId: { in: beneficiaryIds },
          ownerType: 'BENEFICIARY',
          docType: { in: ['BENEFICIARY_PHOTO', 'PHOTO'] },
          isSensitive: false,
          shareWithDonor: true,
        },
        select: { storagePath: true },
        orderBy: { createdAt: 'desc' },
      });

      if (photo) return photo.storagePath;
    }

    const homePhoto = await this.prisma.document.findFirst({
      where: {
        ownerType: 'ORGANIZATION',
        docType: { in: ['HOME_PHOTO', 'PHOTO'] },
        isSensitive: false,
        shareWithDonor: true,
      },
      select: { storagePath: true },
      orderBy: { createdAt: 'desc' },
    });

    if (homePhoto) return homePhoto.storagePath;

    return null;
  }

  private async getTemplate(key: string, channel: 'EMAIL' | 'WHATSAPP'): Promise<{ subject: string | null; body: string }> {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { key_channel: { key, channel } },
    });

    if (template) {
      return { subject: template.subject, body: template.body };
    }

    if (channel === 'WHATSAPP') {
      return {
        subject: null,
        body: `Dear {{donor_name}},\n\nHappy Birthday! On this special day, {{org_name}} thanks you for your generous support.\n{{beneficiary_line}}\nWishing you a wonderful year ahead.\n\nWith gratitude,\n{{org_name}}`,
      };
    }

    return {
      subject: 'Happy Birthday, {{donor_name}}! - {{org_name}}',
      body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><p>Dear <strong>{{donor_name}}</strong>,</p><p>Wishing you a very <strong>Happy Birthday!</strong></p><p>On this special day, <strong>{{org_name}}</strong> wants to express our heartfelt gratitude for your support.</p><p>{{beneficiary_line}}</p>{{image_block}}<p>May this new year of your life bring you joy and happiness.</p><p>With warm regards,<br/><strong>{{org_name}}</strong></p></div>`,
    };
  }

  private renderTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
  }
}
