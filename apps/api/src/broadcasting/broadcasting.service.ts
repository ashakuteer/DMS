import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationsService } from '../communications/communications.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { normalizeToE164 } from '../common/phone-utils';
import { CommChannel, CommProvider, CommStatus } from '@prisma/client';

export interface BroadcastFilters {
  gender?: string;
  religion?: string;
  city?: string;
  country?: string;
  category?: string;
  donationFrequency?: string;
  donationFrequencies?: string[];
  assignedToUserId?: string;
  supportPreferences?: string[];
  engagementLevel?: string;
  healthStatus?: string;
  ageMin?: number;
  ageMax?: number;
  professions?: string[];
  donationCategories?: string[];
  sponsorshipTypes?: string[];
  donationAmountMin?: number;
  donationAmountMax?: number;
}

export interface BroadcastRequest {
  channel: 'WHATSAPP' | 'EMAIL';
  filters: BroadcastFilters;
  contentSid?: string;
  contentVariables?: Record<string, string>;
  emailSubject?: string;
  emailBody?: string;
}

export interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  details: { donorId: string; donorName: string; status: string; error?: string }[];
}

@Injectable()
export class BroadcastingService {
  private readonly logger = new Logger(BroadcastingService.name);

  constructor(
    private prisma: PrismaService,
    private communicationsService: CommunicationsService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  buildWhereClause(filters: BroadcastFilters): any {
    const where: any = { isDeleted: false };

    if (filters.gender) where.gender = filters.gender;
    if (filters.religion) where.religion = { contains: filters.religion, mode: 'insensitive' };
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.country) where.country = { contains: filters.country, mode: 'insensitive' };
    if (filters.category) where.category = filters.category;
    if (filters.assignedToUserId) where.assignedToUserId = filters.assignedToUserId;
    if (filters.engagementLevel) where.engagementLevel = filters.engagementLevel;
    if (filters.healthStatus) where.healthStatus = filters.healthStatus;

    if (filters.supportPreferences && filters.supportPreferences.length > 0) {
      where.supportPreferences = { hasSome: filters.supportPreferences };
    }

    if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
      where.approximateAge = {};
      if (filters.ageMin !== undefined) where.approximateAge.gte = filters.ageMin;
      if (filters.ageMax !== undefined) where.approximateAge.lte = filters.ageMax;
    }

    if (filters.donationFrequencies && filters.donationFrequencies.length > 0) {
      where.donationFrequency = { in: filters.donationFrequencies };
    } else if (filters.donationFrequency) {
      where.donationFrequency = filters.donationFrequency;
    }

    if (filters.professions && filters.professions.length > 0) {
      where.profession = { in: filters.professions };
    }

    const andConditions: any[] = [];

    if (filters.donationCategories && filters.donationCategories.length > 0) {
      andConditions.push({
        donations: {
          some: {
            donationType: { in: filters.donationCategories },
            isDeleted: false,
          },
        },
      });
    }

    if (filters.sponsorshipTypes && filters.sponsorshipTypes.length > 0) {
      andConditions.push({
        sponsorships: {
          some: {
            sponsorshipType: { in: filters.sponsorshipTypes },
          },
        },
      });
    }

    if (filters.donationAmountMin !== undefined || filters.donationAmountMax !== undefined) {
      const amountFilter: any = {};
      if (filters.donationAmountMin !== undefined) amountFilter.gte = filters.donationAmountMin;
      if (filters.donationAmountMax !== undefined) amountFilter.lte = filters.donationAmountMax;
      andConditions.push({
        donations: {
          some: {
            donationAmount: amountFilter,
            isDeleted: false,
          },
        },
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return where;
  }

  async previewAudience(filters: BroadcastFilters, channel: 'WHATSAPP' | 'EMAIL') {
    const where = this.buildWhereClause(filters);
    const donors = await this.prisma.donor.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        primaryPhone: true,
        primaryPhoneCode: true,
        whatsappPhone: true,
        whatsappPhoneCode: true,
        personalEmail: true,
        officialEmail: true,
        prefWhatsapp: true,
        prefEmail: true,
      },
    });

    let reachable = 0;
    let unreachable = 0;

    for (const donor of donors) {
      if (channel === 'WHATSAPP') {
        const phone = donor.whatsappPhone || donor.primaryPhone;
        const code = donor.whatsappPhoneCode || donor.primaryPhoneCode;
        const e164 = normalizeToE164(phone, code);
        if (e164) reachable++;
        else unreachable++;
      } else {
        const email = donor.personalEmail || donor.officialEmail;
        if (email) reachable++;
        else unreachable++;
      }
    }

    return {
      total: donors.length,
      reachable,
      unreachable,
      sampleDonors: donors.slice(0, 10).map(d => ({
        id: d.id,
        name: `${d.firstName} ${d.lastName || ''}`.trim(),
        contact: channel === 'WHATSAPP'
          ? (d.whatsappPhone || d.primaryPhone || 'No phone')
          : (d.personalEmail || d.officialEmail || 'No email'),
      })),
    };
  }

  async sendBroadcast(request: BroadcastRequest, userId: string): Promise<BroadcastResult> {
    const where = this.buildWhereClause(request.filters);
    const donors = await this.prisma.donor.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        primaryPhone: true,
        primaryPhoneCode: true,
        whatsappPhone: true,
        whatsappPhoneCode: true,
        personalEmail: true,
        officialEmail: true,
        prefWhatsapp: true,
        prefEmail: true,
      },
    });

    const result: BroadcastResult = {
      total: donors.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    if (request.channel === 'WHATSAPP') {
      if (!request.contentSid) {
        throw new BadRequestException('contentSid is required for WhatsApp broadcasts');
      }
      if (!this.communicationsService.isWhatsAppConfigured()) {
        throw new BadRequestException('WhatsApp is not configured. Check Twilio credentials.');
      }

      for (const donor of donors) {
        const donorName = `${donor.firstName} ${donor.lastName || ''}`.trim();
        const phone = donor.whatsappPhone || donor.primaryPhone;
        const code = donor.whatsappPhoneCode || donor.primaryPhoneCode;
        const e164 = normalizeToE164(phone, code);

        if (!e164) {
          result.skipped++;
          result.details.push({ donorId: donor.id, donorName, status: 'skipped', error: 'No valid phone number' });
          continue;
        }

        try {
          const variables = {
            ...request.contentVariables,
            '1': donorName,
          };

          const msg = await this.communicationsService.sendWhatsAppTemplate(
            { donorId: donor.id, toE164: e164, contentSid: request.contentSid, variables },
            userId,
          );

          if (msg.status === CommStatus.FAILED) {
            result.failed++;
            result.details.push({ donorId: donor.id, donorName, status: 'failed', error: msg.errorMessage || 'Send failed' });
          } else {
            result.sent++;
            result.details.push({ donorId: donor.id, donorName, status: 'sent' });
          }
        } catch (err: any) {
          result.failed++;
          result.details.push({ donorId: donor.id, donorName, status: 'failed', error: err.message });
        }
      }
    } else {
      if (!request.emailSubject || !request.emailBody) {
        throw new BadRequestException('emailSubject and emailBody are required for Email broadcasts');
      }

      for (const donor of donors) {
        const donorName = `${donor.firstName} ${donor.lastName || ''}`.trim();
        const email = donor.personalEmail || donor.officialEmail;

        if (!email) {
          result.skipped++;
          result.details.push({ donorId: donor.id, donorName, status: 'skipped', error: 'No email address' });
          continue;
        }

        try {
          let body = request.emailBody;
          body = body.replace(/{{donorName}}/g, donorName);
          body = body.replace(/{{date}}/g, new Date().toLocaleDateString('en-IN'));

          let subject = request.emailSubject;
          subject = subject.replace(/{{donorName}}/g, donorName);

          await this.prisma.communicationMessage.create({
            data: {
              donorId: donor.id,
              channel: CommChannel.EMAIL,
              provider: CommProvider.SMTP,
              to: email,
              status: CommStatus.QUEUED,
              templateName: 'broadcast',
              createdByUserId: userId,
            },
          });

          const emailResult = await this.emailService.sendEmail({
            to: email,
            subject,
            html: body,
            featureType: 'MANUAL',
          });

          if (emailResult.success) {
            result.sent++;
            result.details.push({ donorId: donor.id, donorName, status: 'sent' });
          } else {
            result.failed++;
            result.details.push({ donorId: donor.id, donorName, status: 'failed', error: emailResult.error || 'Send failed' });
          }
        } catch (err: any) {
          result.failed++;
          result.details.push({ donorId: donor.id, donorName, status: 'failed', error: err.message });
        }
      }
    }

    await this.auditService.log({
      userId,
      action: 'BROADCAST_SENT' as any,
      entityType: 'Broadcast',
      entityId: `broadcast-${Date.now()}`,
      metadata: {
        channel: request.channel,
        filters: request.filters,
        total: result.total,
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
      },
    });

    this.logger.log(
      `Broadcast complete: channel=${request.channel}, total=${result.total}, sent=${result.sent}, failed=${result.failed}, skipped=${result.skipped}`,
    );

    return result;
  }

  async getAvailableWhatsAppTemplates() {
    return this.communicationsService.getConfiguredTemplates();
  }

  async getAvailableEmailTemplates() {
    return this.prisma.communicationTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        type: true,
        name: true,
        description: true,
        emailSubject: true,
        emailBody: true,
      },
    });
  }

  async getStaffList() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  async getProfessionList(): Promise<string[]> {
    const results = await this.prisma.donor.findMany({
      where: { isDeleted: false, profession: { not: null } },
      select: { profession: true },
      distinct: ['profession'],
      orderBy: { profession: 'asc' },
    });
    return results.map(r => r.profession!).filter(Boolean);
  }
}
