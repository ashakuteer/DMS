import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { TemplatesService } from '../templates/templates.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { CommunicationsService } from '../communications/communications.service';
import { normalizeToE164 } from '../common/phone-utils';
import { ReminderTaskType, ReminderTaskStatus, OccasionType, Role, AuditAction, CommunicationType, TemplateType, EmailJobType } from '@prisma/client';

interface UserContext {
  id: string;
  email: string;
  role: Role;
}

@Injectable()
export class ReminderTasksService {
  private readonly logger = new Logger(ReminderTasksService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private emailService: EmailService,
    private communicationLogService: CommunicationLogService,
    private templatesService: TemplatesService,
    private orgProfileService: OrganizationProfileService,
    private emailJobsService: EmailJobsService,
    private communicationsService: CommunicationsService,
  ) {}

  private mapOccasionTypeToReminderType(occasionType: OccasionType): ReminderTaskType {
    switch (occasionType) {
      case OccasionType.DOB_SELF:
      case OccasionType.DOB_SPOUSE:
      case OccasionType.DOB_CHILD:
        return ReminderTaskType.BIRTHDAY;
      case OccasionType.ANNIVERSARY:
        return ReminderTaskType.ANNIVERSARY;
      case OccasionType.DEATH_ANNIVERSARY:
        return ReminderTaskType.MEMORIAL;
      default:
        return ReminderTaskType.FOLLOW_UP;
    }
  }

  private getOffsetText(offset: number): string {
    switch (offset) {
      case 30: return 'in 30 days';
      case 15: return 'in 15 days';
      case 7: return 'in 7 days';
      case 2: return 'in 2 days';
      case 0: return 'Today';
      default: return `in ${offset} days`;
    }
  }

  private getOccasionTitle(occasion: { type: OccasionType; relatedPersonName?: string | null }, offset: number): string {
    const offsetText = this.getOffsetText(offset);
    const isSameDay = offset === 0;
    
    switch (occasion.type) {
      case OccasionType.DOB_SELF:
        return isSameDay ? 'Birthday Today' : `Birthday ${offsetText}`;
      case OccasionType.DOB_SPOUSE:
        return isSameDay 
          ? `${occasion.relatedPersonName || 'Spouse'}'s Birthday Today`
          : `${occasion.relatedPersonName || 'Spouse'}'s Birthday ${offsetText}`;
      case OccasionType.DOB_CHILD:
        return isSameDay
          ? `${occasion.relatedPersonName || 'Child'}'s Birthday Today`
          : `${occasion.relatedPersonName || 'Child'}'s Birthday ${offsetText}`;
      case OccasionType.ANNIVERSARY:
        return isSameDay ? 'Anniversary Today' : `Anniversary ${offsetText}`;
      case OccasionType.DEATH_ANNIVERSARY:
        return isSameDay ? 'Memorial Today' : `Memorial ${offsetText}`;
      default:
        return isSameDay ? 'Special Occasion Today' : `Special Occasion ${offsetText}`;
    }
  }

  private getFamilyBirthdayTitle(familyMember: { name: string; relationType: string }, offset: number): string {
    const offsetText = this.getOffsetText(offset);
    const isSameDay = offset === 0;
    return isSameDay 
      ? `${familyMember.name}'s Birthday Today`
      : `${familyMember.name}'s Birthday ${offsetText}`;
  }

  private calculateNextOccurrence(month: number, day: number, targetYear?: number): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const year = targetYear || today.getFullYear();
    let nextDate = new Date(year, month - 1, day);
    nextDate.setHours(0, 0, 0, 0);
    
    if (nextDate < today && !targetYear) {
      nextDate = new Date(year + 1, month - 1, day);
      nextDate.setHours(0, 0, 0, 0);
    }
    
    return nextDate;
  }

  private subtractDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  private async queueEmailJob(
    donor: { id: string; firstName: string; lastName?: string | null; personalEmail?: string | null; officialEmail?: string | null },
    type: EmailJobType,
    title: string,
    dueDate: Date,
    relatedId?: string,
  ): Promise<void> {
    const org = await this.orgProfileService.getProfile();
    if (!org.enableAutoEmail) return;

    const email = donor.personalEmail || donor.officialEmail;
    if (!email) return;

    const donorName = `${donor.firstName}${donor.lastName ? ' ' + donor.lastName : ''}`;
    
    let subject = '';
    let body = '';
    
    switch (type) {
      case 'SPECIAL_DAY':
        subject = `Warm wishes from ${org.name}`;
        body = `<p>Dear ${donorName},</p><p>We hope this message finds you well. Wishing you a wonderful day!</p><p>With warm regards,<br/>${org.name}</p>`;
        break;
      case 'PLEDGE_REMINDER':
        subject = `Gentle reminder of your pledge – ${org.name}`;
        body = `<p>Dear ${donorName},</p><p>This is a gentle reminder about your pledge to ${org.name}. We truly appreciate your commitment to our mission.</p><p>With heartfelt gratitude,<br/>${org.name}</p>`;
        break;
      case 'FOLLOW_UP':
      default:
        subject = `Greetings from ${org.name}`;
        body = `<p>Dear ${donorName},</p><p>We hope this message finds you well. Thank you for your continued support of ${org.name}.</p><p>With warm regards,<br/>${org.name}</p>`;
    }

    const scheduledAt = new Date(dueDate);
    scheduledAt.setHours(9, 0, 0, 0);

    try {
      await this.emailJobsService.create({
        donorId: donor.id,
        toEmail: email,
        subject,
        body,
        type,
        relatedId,
        scheduledAt,
      });
    } catch (error) {
      this.logger.warn(`Could not queue email job for donor ${donor.id}: ${error}`);
    }
  }

  private async sendAutoWhatsApp(
    donor: { id: string; firstName: string; lastName?: string | null; primaryPhone?: string | null; primaryPhoneCode?: string | null; whatsappPhone?: string | null },
    templateKey: 'SPECIAL_DAY_WISH' | 'PLEDGE_DUE' | 'FOLLOWUP_REMINDER',
    variables?: Record<string, string>,
  ): Promise<void> {
    try {
      const org = await this.orgProfileService.getProfile();

      if (templateKey === 'SPECIAL_DAY_WISH' && !org.enableSpecialDayWhatsApp) return;
      if (templateKey === 'PLEDGE_DUE' && !org.enablePledgeWhatsApp) return;
      if (templateKey === 'FOLLOWUP_REMINDER' && !org.enableFollowUpWhatsApp) return;

      const rawPhone = donor.whatsappPhone || donor.primaryPhone;
      if (!rawPhone) return;

      const e164 = normalizeToE164(rawPhone, donor.primaryPhoneCode);
      if (!e164) return;

      const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ') || 'Valued Donor';

      const vars = {
        '1': donorName,
        ...variables,
      };

      const result = await this.communicationsService.sendByTemplateKey(
        templateKey,
        donor.id,
        e164,
        vars,
      );

      this.logger.log(`Auto WhatsApp ${templateKey} for donor ${donor.id}: ${result.status}`);
    } catch (err: any) {
      this.logger.warn(`Auto WhatsApp ${templateKey} for donor ${donor.id} failed: ${err?.message || err}`);
    }
  }

  async generateSpecialDayReminders(): Promise<number> {
    this.logger.log('Starting special day reminder generation...');
    
    const donors = await this.prisma.donor.findMany({
      where: { isDeleted: false, prefReminders: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        primaryPhone: true,
        primaryPhoneCode: true,
        whatsappPhone: true,
        personalEmail: true,
        officialEmail: true,
        prefReminders: true,
        specialOccasions: true,
        familyMembers: {
          where: {
            birthMonth: { not: null },
            birthDay: { not: null },
          },
        },
      },
    });

    let createdCount = 0;
    // Generate reminders at these offsets before the special day
    const offsets = [30, 15, 7, 2, 0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const donor of donors) {
      for (const occasion of donor.specialOccasions) {
        const nextOccurrence = this.calculateNextOccurrence(occasion.month, occasion.day);
        const reminderType = this.mapOccasionTypeToReminderType(occasion.type);

        for (const offset of offsets) {
          const dueDate = this.subtractDays(nextOccurrence, offset);
          
          if (dueDate < today) continue;

          const thirtyDaysFromNow = new Date(today);
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 35);
          if (dueDate > thirtyDaysFromNow) continue;

          try {
            const reminderTask = await this.prisma.reminderTask.upsert({
              where: {
                unique_occasion_reminder: {
                  donorId: donor.id,
                  sourceOccasionId: occasion.id,
                  offsetDays: offset,
                },
              },
              update: {
                title: this.getOccasionTitle(occasion, offset),
                dueDate: dueDate,
              },
              create: {
                donorId: donor.id,
                type: reminderType,
                title: this.getOccasionTitle(occasion, offset),
                dueDate: dueDate,
                status: ReminderTaskStatus.OPEN,
                sourceOccasionId: occasion.id,
                offsetDays: offset,
              },
            });
            createdCount++;

            if (offset === 0) {
              await this.queueEmailJob(
                donor,
                EmailJobType.SPECIAL_DAY,
                this.getOccasionTitle(occasion, offset),
                dueDate,
                reminderTask.id,
              );
              await this.sendAutoWhatsApp(donor, 'SPECIAL_DAY_WISH', {
                '2': this.getOccasionTitle(occasion, offset),
              });
            }
          } catch (error: any) {
            if (error.code !== 'P2002') {
              this.logger.error(`Error creating reminder for donor ${donor.id}: ${error.message}`);
            }
          }
        }
      }

      for (const familyMember of donor.familyMembers) {
        if (!familyMember.birthMonth || !familyMember.birthDay) continue;
        
        const nextOccurrence = this.calculateNextOccurrence(familyMember.birthMonth, familyMember.birthDay);

        for (const offset of offsets) {
          const dueDate = this.subtractDays(nextOccurrence, offset);
          
          if (dueDate < today) continue;

          const thirtyDaysFromNow = new Date(today);
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 35);
          if (dueDate > thirtyDaysFromNow) continue;

          try {
            const reminderTask = await this.prisma.reminderTask.upsert({
              where: {
                unique_family_reminder: {
                  donorId: donor.id,
                  sourceFamilyId: familyMember.id,
                  offsetDays: offset,
                },
              },
              update: {
                title: this.getFamilyBirthdayTitle(familyMember, offset),
                dueDate: dueDate,
              },
              create: {
                donorId: donor.id,
                type: ReminderTaskType.FAMILY_BIRTHDAY,
                title: this.getFamilyBirthdayTitle(familyMember, offset),
                dueDate: dueDate,
                status: ReminderTaskStatus.OPEN,
                sourceFamilyId: familyMember.id,
                offsetDays: offset,
              },
            });
            createdCount++;

            if (offset === 0) {
              await this.queueEmailJob(
                donor,
                EmailJobType.SPECIAL_DAY,
                this.getFamilyBirthdayTitle(familyMember, offset),
                dueDate,
                reminderTask.id,
              );
              await this.sendAutoWhatsApp(donor, 'SPECIAL_DAY_WISH', {
                '2': this.getFamilyBirthdayTitle(familyMember, offset),
              });
            }
          } catch (error: any) {
            if (error.code !== 'P2002') {
              this.logger.error(`Error creating family reminder for donor ${donor.id}: ${error.message}`);
            }
          }
        }
      }
    }

    this.logger.log(`Generated ${createdCount} reminder tasks`);
    return createdCount;
  }

  async getReminders(user: UserContext, filter: 'today' | 'week' | 'month' | 'overdue') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    let dateFilter: any = {};

    switch (filter) {
      case 'today':
        dateFilter = {
          dueDate: {
            gte: today,
            lte: endOfToday,
          },
        };
        break;
      case 'week':
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        dateFilter = {
          dueDate: {
            gte: today,
            lte: weekFromNow,
          },
        };
        break;
      case 'month':
        const monthFromNow = new Date(today);
        monthFromNow.setDate(monthFromNow.getDate() + 30);
        dateFilter = {
          dueDate: {
            gte: today,
            lte: monthFromNow,
          },
        };
        break;
      case 'overdue':
        dateFilter = {
          dueDate: {
            lt: today,
          },
        };
        break;
    }

    const statusFilter = filter === 'overdue' 
      ? { status: ReminderTaskStatus.OPEN }
      : { status: { in: [ReminderTaskStatus.OPEN, ReminderTaskStatus.SNOOZED] } };

    const whereClause = {
      ...dateFilter,
      ...statusFilter,
      OR: filter === 'overdue' ? undefined : [
        { snoozedUntil: null },
        { snoozedUntil: { lte: today } },
      ],
    };

    if (filter === 'overdue') {
      delete whereClause.OR;
    }

    return this.prisma.reminderTask.findMany({
      where: whereClause,
      include: {
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
            primaryPhoneCode: true,
            whatsappPhone: true,
            whatsappPhoneCode: true,
            personalEmail: true,
            officialEmail: true,
          },
        },
        sourceOccasion: {
          select: {
            relatedPersonName: true,
          },
        },
        sourceFamilyMember: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { type: 'asc' },
      ],
    });
  }

  async markDone(user: UserContext, id: string) {
    if (user.role === Role.TELECALLER) {
      throw new ForbiddenException('Telecallers cannot modify reminder tasks');
    }

    const task = await this.prisma.reminderTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Reminder task not found');
    }

    const updated = await this.prisma.reminderTask.update({
      where: { id },
      data: {
        status: ReminderTaskStatus.DONE,
        completedAt: new Date(),
      },
    });

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DONOR_UPDATE,
      entityType: 'ReminderTask',
      entityId: id,
      newValue: { status: 'DONE', completedBy: user.id },
      metadata: { action: 'mark_done' },
    });

    return updated;
  }

  async snooze(user: UserContext, id: string, days: number) {
    if (user.role === Role.TELECALLER) {
      throw new ForbiddenException('Telecallers cannot modify reminder tasks');
    }

    if (![7, 30].includes(days)) {
      throw new Error('Snooze days must be 7 or 30');
    }

    const task = await this.prisma.reminderTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Reminder task not found');
    }

    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + days);

    const updated = await this.prisma.reminderTask.update({
      where: { id },
      data: {
        status: ReminderTaskStatus.SNOOZED,
        snoozedUntil: snoozedUntil,
      },
    });

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DONOR_UPDATE,
      entityType: 'ReminderTask',
      entityId: id,
      newValue: { status: 'SNOOZED', snoozedUntil, snoozedBy: user.id },
      metadata: { action: 'snooze', days },
    });

    return updated;
  }

  async processAutoEmails(): Promise<{ sent: number; failed: number }> {
    this.logger.log('Processing auto emails for due reminders...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Auto emails are only sent for 7 days, 2 days, and same day (0) reminders
    const autoEmailOffsets = [7, 2, 0];
    
    const dueReminders = await this.prisma.reminderTask.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: endOfToday,
        },
        status: ReminderTaskStatus.OPEN,
        autoEmailSent: false,
        offsetDays: { in: autoEmailOffsets },
      },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            personalEmail: true,
            officialEmail: true,
            prefEmail: true,
          },
        },
        sourceOccasion: {
          select: {
            relatedPersonName: true,
          },
        },
        sourceFamilyMember: {
          select: {
            name: true,
          },
        },
        sourcePledge: {
          select: {
            quantity: true,
            amount: true,
            expectedFulfillmentDate: true,
            pledgeType: true,
          },
        },
      },
    });

    let sent = 0;
    let failed = 0;
    const org = await this.orgProfileService.getProfile();
    const phoneDisplay = org.phone2 ? `${org.phone1} / ${org.phone2}` : org.phone1;

    for (const reminder of dueReminders) {
      // prefEmail is a boolean - true means prefer personal email, false means official
      const donorEmail = reminder.donor.prefEmail 
        ? (reminder.donor.personalEmail || reminder.donor.officialEmail)
        : (reminder.donor.officialEmail || reminder.donor.personalEmail);

      if (!donorEmail) {
        this.logger.warn(`No email found for donor ${reminder.donorId}, skipping auto email`);
        continue;
      }

      const donorName = `${reminder.donor.firstName} ${reminder.donor.lastName || ''}`.trim();
      const relatedPersonName = reminder.sourceFamilyMember?.name || reminder.sourceOccasion?.relatedPersonName;

      // Get template and resolve placeholders
      const templateType = this.mapReminderTypeToTemplateType(reminder.type);
      const template = await this.templatesService.findByType(templateType);

      let emailSubject: string;
      let emailBody: string;

      if (template && template.emailBody && template.emailSubject) {
        const pledgeDescription = reminder.sourcePledge
          ? (reminder.sourcePledge.pledgeType === 'MONEY'
              ? `Monetary donation`
              : reminder.sourcePledge.quantity || 'your pledge')
          : 'your pledge';
        const pledgeAmountStr = reminder.sourcePledge?.amount
          ? `Rs. ${Number(reminder.sourcePledge.amount).toLocaleString('en-IN')}`
          : '';

        const resolvedSubject = await this.resolveTemplatePlaceholders(template.emailSubject, {
          donorName,
          relatedPerson: relatedPersonName || undefined,
          pledgeItem: pledgeDescription,
          pledgeAmount: pledgeAmountStr || undefined,
          dueDate: reminder.sourcePledge?.expectedFulfillmentDate
            ? new Date(reminder.sourcePledge.expectedFulfillmentDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : undefined,
        });

        const resolvedBody = await this.resolveTemplatePlaceholders(template.emailBody, {
          donorName,
          relatedPerson: relatedPersonName || undefined,
          pledgeItem: pledgeDescription,
          pledgeAmount: pledgeAmountStr || undefined,
          dueDate: reminder.sourcePledge?.expectedFulfillmentDate
            ? new Date(reminder.sourcePledge.expectedFulfillmentDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : undefined,
        });

        // Guard against empty resolved content
        if (resolvedSubject.trim() && resolvedBody.trim().length > 20) {
          emailSubject = resolvedSubject;
          emailBody = resolvedBody;
        } else {
          emailSubject = await this.getEmailSubject(reminder.type);
          emailBody = await this.getFallbackEmailBody(reminder.type, donorName, relatedPersonName || undefined);
        }
      } else {
        // Fallback to default subject and body
        emailSubject = await this.getEmailSubject(reminder.type);
        emailBody = await this.getFallbackEmailBody(reminder.type, donorName, relatedPersonName || undefined);
      }

      // Wrap body with organization branding
      const fullEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          ${emailBody.split('\n').map(line => `<p style="margin: 0 0 10px 0;">${line}</p>`).join('')}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #cccccc; font-size: 13px; color: #666666;">
            <p style="margin: 0;">With heartfelt gratitude,</p>
            <p style="margin: 5px 0 15px 0;"><strong>${org.name}</strong></p>
            <p style="margin: 0;">Phone: ${phoneDisplay}</p>
            <p style="margin: 0;">Email: ${org.email}</p>
            <p style="margin: 0;">Website: ${org.website}</p>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #999999; font-style: italic;">
            (This is an automated email. Please do not reply.)
          </p>
        </div>
      `;

      try {
        const result = await this.emailService.sendEmail({
          to: donorEmail,
          subject: emailSubject,
          html: fullEmailHtml,
          text: emailBody,
          featureType: 'AUTO',
        });

        if (result.success) {
          await this.prisma.reminderTask.update({
            where: { id: reminder.id },
            data: {
              autoEmailSent: true,
              autoEmailSentAt: new Date(),
              status: ReminderTaskStatus.DONE,
              completedAt: new Date(),
            },
          });

          await this.communicationLogService.logEmail({
            donorId: reminder.donorId,
            toEmail: donorEmail,
            subject: emailSubject,
            messagePreview: emailBody.substring(0, 200),
            status: 'SENT',
            type: CommunicationType.GREETING,
          });

          sent++;
          this.logger.log(`Auto email sent for reminder ${reminder.id} to ${donorEmail}`);
        } else {
          await this.communicationLogService.logEmail({
            donorId: reminder.donorId,
            toEmail: donorEmail,
            subject: emailSubject,
            messagePreview: emailBody.substring(0, 200),
            status: 'FAILED',
            errorMessage: result.error,
            type: CommunicationType.GREETING,
          });
          failed++;
          this.logger.error(`Failed to send auto email for reminder ${reminder.id}: ${result.error}`);
        }
      } catch (error: any) {
        failed++;
        this.logger.error(`Error processing auto email for reminder ${reminder.id}: ${error.message}`);
      }
    }

    this.logger.log(`Auto email processing complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  private async getEmailSubject(type: ReminderTaskType): Promise<string> {
    const org = await this.orgProfileService.getProfile();
    switch (type) {
      case ReminderTaskType.BIRTHDAY:
      case ReminderTaskType.FAMILY_BIRTHDAY:
      case ReminderTaskType.ANNIVERSARY:
        return `Warm wishes from ${org.name}`;
      case ReminderTaskType.MEMORIAL:
        return `Remembering with gratitude – ${org.name}`;
      case ReminderTaskType.PLEDGE:
        return `Gentle reminder of your pledge – ${org.name}`;
      default:
        return `Greetings from ${org.name}`;
    }
  }

  private mapReminderTypeToTemplateType(type: ReminderTaskType): TemplateType {
    switch (type) {
      case ReminderTaskType.BIRTHDAY:
      case ReminderTaskType.FAMILY_BIRTHDAY:
        return TemplateType.BIRTHDAY;
      case ReminderTaskType.ANNIVERSARY:
        return TemplateType.ANNIVERSARY;
      case ReminderTaskType.MEMORIAL:
        return TemplateType.MEMORIAL;
      case ReminderTaskType.PLEDGE:
        return TemplateType.PLEDGE_DUE;
      case ReminderTaskType.FOLLOW_UP:
      default:
        return TemplateType.FOLLOWUP;
    }
  }

  private async resolveTemplatePlaceholders(
    template: string,
    data: {
      donorName?: string;
      relatedPerson?: string;
      pledgeItem?: string;
      pledgeAmount?: string;
      dueDate?: string;
    },
  ): Promise<string> {
    const org = await this.orgProfileService.getProfile();
    let result = template;

    result = result.replace(/\{\{donor_name\}\}/g, data.donorName || '');
    result = result.replace(/\{\{related_person\}\}/g, data.relatedPerson || 'your loved one');
    result = result.replace(/\{\{pledge_item\}\}/g, data.pledgeItem || 'your pledge');
    result = result.replace(/\{\{pledge_amount\}\}/g, data.pledgeAmount || '');
    result = result.replace(/\{\{due_date\}\}/g, data.dueDate || '');

    result = result.replace(/\{\{org_name\}\}/g, org.name);
    result = result.replace(/\{\{org_phone\}\}/g, `${org.phone1}${org.phone2 ? ' / ' + org.phone2 : ''}`);
    result = result.replace(/\{\{org_email\}\}/g, org.email);
    result = result.replace(/\{\{org_website\}\}/g, org.website);
    result = result.replace(/\{\{homes\}\}/g, org.tagline1 || '');

    return result;
  }

  private async getFallbackWhatsAppMessage(type: ReminderTaskType, donorName: string, relatedPersonName?: string): Promise<string> {
    const org = await this.orgProfileService.getProfile();
    switch (type) {
      case ReminderTaskType.BIRTHDAY:
        return `Dear ${donorName}, warm birthday wishes from ${org.name}! May this special day bring you joy, happiness, and all the blessings you deserve. We are grateful for your continued support.`;
      case ReminderTaskType.FAMILY_BIRTHDAY:
        return `Dear ${donorName}, warm birthday wishes to ${relatedPersonName || 'your loved one'} from ${org.name}! May this special day be filled with joy and happiness.`;
      case ReminderTaskType.ANNIVERSARY:
        return `Dear ${donorName}, warm anniversary wishes from ${org.name}! May your journey together continue to be blessed with love and happiness.`;
      case ReminderTaskType.MEMORIAL:
        return `Dear ${donorName}, remembering ${relatedPersonName || 'your loved one'} with respect and prayers. Our thoughts are with you and your family. - ${org.name}`;
      case ReminderTaskType.PLEDGE:
        return `Dear ${donorName}, this is a gentle reminder about your pledge to support ${org.name}. Your commitment means the world to us. Please reach out when you are ready to fulfill your pledge.`;
      default:
        return `Dear ${donorName}, greetings from ${org.name}! We hope this message finds you well. Thank you for your continued support and generosity.`;
    }
  }

  async logWhatsAppClick(user: UserContext, reminderId: string) {
    const reminder = await this.prisma.reminderTask.findUnique({
      where: { id: reminderId },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            whatsappPhone: true,
            whatsappPhoneCode: true,
            primaryPhone: true,
            primaryPhoneCode: true,
          },
        },
        sourceOccasion: {
          select: {
            relatedPersonName: true,
          },
        },
        sourceFamilyMember: {
          select: {
            name: true,
          },
        },
        sourcePledge: {
          select: {
            quantity: true,
            amount: true,
            expectedFulfillmentDate: true,
            pledgeType: true,
          },
        },
      },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder task not found');
    }

    const phone = reminder.donor.whatsappPhone || reminder.donor.primaryPhone;
    const phoneCode = reminder.donor.whatsappPhoneCode || reminder.donor.primaryPhoneCode || '91';
    const donorName = `${reminder.donor.firstName} ${reminder.donor.lastName || ''}`.trim();
    const relatedPersonName = reminder.sourceFamilyMember?.name || reminder.sourceOccasion?.relatedPersonName;

    const templateType = this.mapReminderTypeToTemplateType(reminder.type);
    const template = await this.templatesService.findByType(templateType);

    let message: string;
    if (template && template.whatsappMessage) {
      const pledgeDescription = reminder.sourcePledge
        ? (reminder.sourcePledge.pledgeType === 'MONEY'
            ? `Monetary donation`
            : reminder.sourcePledge.quantity || 'your pledge')
        : 'your pledge';
      const pledgeAmountStr = reminder.sourcePledge?.amount
        ? `Rs. ${Number(reminder.sourcePledge.amount).toLocaleString('en-IN')}`
        : '';
      
      message = await this.resolveTemplatePlaceholders(template.whatsappMessage, {
        donorName,
        relatedPerson: relatedPersonName || undefined,
        pledgeItem: pledgeDescription,
        pledgeAmount: pledgeAmountStr || undefined,
        dueDate: reminder.sourcePledge?.expectedFulfillmentDate
          ? new Date(reminder.sourcePledge.expectedFulfillmentDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : undefined,
      });
    } else {
      message = await this.getFallbackWhatsAppMessage(reminder.type, donorName, relatedPersonName || undefined);
    }

    await this.communicationLogService.logWhatsApp({
      donorId: reminder.donorId,
      phoneNumber: `+${phoneCode}${phone}`,
      messagePreview: message.substring(0, 200),
      sentById: user.id,
      type: CommunicationType.GREETING,
    });

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DONOR_UPDATE,
      entityType: 'ReminderTask',
      entityId: reminderId,
      newValue: { action: 'whatsapp_sent' },
      metadata: { phone: `+${phoneCode}${phone}`, reminderType: reminder.type },
    });

    return {
      phone: `${phoneCode}${phone}`,
      message,
      donorName,
    };
  }

  async sendManualEmail(user: UserContext, reminderId: string): Promise<{ success: boolean; message: string }> {
    const reminder = await this.prisma.reminderTask.findUnique({
      where: { id: reminderId },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            personalEmail: true,
            officialEmail: true,
            prefEmail: true,
          },
        },
        sourceOccasion: {
          select: {
            relatedPersonName: true,
          },
        },
        sourceFamilyMember: {
          select: {
            name: true,
          },
        },
        sourcePledge: {
          select: {
            quantity: true,
            amount: true,
            expectedFulfillmentDate: true,
            pledgeType: true,
          },
        },
      },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder task not found');
    }

    // Only allow manual email for 7, 2, and 0 day offsets
    const emailEligibleOffsets = [7, 2, 0];
    if (!emailEligibleOffsets.includes(reminder.offsetDays || -1)) {
      return { 
        success: false, 
        message: `Email not available for ${reminder.offsetDays}-day reminders. Only 7-day, 2-day, and same-day reminders support email.` 
      };
    }

    const donorEmail = reminder.donor.prefEmail 
      ? (reminder.donor.personalEmail || reminder.donor.officialEmail)
      : (reminder.donor.officialEmail || reminder.donor.personalEmail);

    if (!donorEmail) {
      return { success: false, message: 'Donor has no email address on file' };
    }

    const donorName = `${reminder.donor.firstName} ${reminder.donor.lastName || ''}`.trim();
    const relatedPersonName = reminder.sourceFamilyMember?.name || reminder.sourceOccasion?.relatedPersonName;

    // Get template and resolve placeholders
    const templateType = this.mapReminderTypeToTemplateType(reminder.type);
    const template = await this.templatesService.findByType(templateType);

    let emailSubject: string;
    let emailBody: string;

    if (template && template.emailBody && template.emailSubject) {
      const pledgeDescription = reminder.sourcePledge
        ? (reminder.sourcePledge.pledgeType === 'MONEY'
            ? `Monetary donation`
            : reminder.sourcePledge.quantity || 'your pledge')
        : 'your pledge';
      const pledgeAmountStr = reminder.sourcePledge?.amount
        ? `Rs. ${Number(reminder.sourcePledge.amount).toLocaleString('en-IN')}`
        : '';

      const resolvedSubject = await this.resolveTemplatePlaceholders(template.emailSubject, {
        donorName,
        relatedPerson: relatedPersonName || undefined,
        pledgeItem: pledgeDescription,
        pledgeAmount: pledgeAmountStr || undefined,
        dueDate: reminder.sourcePledge?.expectedFulfillmentDate
          ? new Date(reminder.sourcePledge.expectedFulfillmentDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : undefined,
      });

      const resolvedBody = await this.resolveTemplatePlaceholders(template.emailBody, {
        donorName,
        relatedPerson: relatedPersonName || undefined,
        pledgeItem: pledgeDescription,
        pledgeAmount: pledgeAmountStr || undefined,
        dueDate: reminder.sourcePledge?.expectedFulfillmentDate
          ? new Date(reminder.sourcePledge.expectedFulfillmentDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : undefined,
      });

      // Guard against empty resolved content
      if (resolvedSubject.trim() && resolvedBody.trim().length > 20) {
        emailSubject = resolvedSubject;
        emailBody = resolvedBody;
      } else {
        emailSubject = await this.getEmailSubject(reminder.type);
        emailBody = await this.getFallbackEmailBody(reminder.type, donorName, relatedPersonName || undefined);
      }
    } else {
      // Fallback to default subject and body
      emailSubject = await this.getEmailSubject(reminder.type);
      emailBody = await this.getFallbackEmailBody(reminder.type, donorName, relatedPersonName || undefined);
    }

    // Wrap body with organization branding
    const org = await this.orgProfileService.getProfile();
    const phoneDisplay = org.phone2 ? `${org.phone1} / ${org.phone2}` : org.phone1;
    const fullEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        ${emailBody.split('\n').map(line => `<p style="margin: 0 0 10px 0;">${line}</p>`).join('')}
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #cccccc; font-size: 13px; color: #666666;">
          <p style="margin: 0;">With heartfelt gratitude,</p>
          <p style="margin: 5px 0 15px 0;"><strong>${org.name}</strong></p>
          <p style="margin: 0;">Phone: ${phoneDisplay}</p>
          <p style="margin: 0;">Email: ${org.email}</p>
          <p style="margin: 0;">Website: ${org.website}</p>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #999999; font-style: italic;">
          (This is an automated email. Please do not reply.)
        </p>
      </div>
    `;

    try {
      const result = await this.emailService.sendEmail({
        to: donorEmail,
        subject: emailSubject,
        html: fullEmailHtml,
        text: emailBody,
      });

      if (result.success) {
        await this.prisma.reminderTask.update({
          where: { id: reminder.id },
          data: {
            autoEmailSent: true,
            autoEmailSentAt: new Date(),
            status: ReminderTaskStatus.DONE,
            completedAt: new Date(),
          },
        });

        await this.communicationLogService.logEmail({
          donorId: reminder.donorId,
          toEmail: donorEmail,
          subject: emailSubject,
          messagePreview: emailBody.substring(0, 200),
          status: 'SENT',
          sentById: user.id,
          type: CommunicationType.GREETING,
        });

        await this.auditService.log({
          userId: user.id,
          action: AuditAction.DONOR_UPDATE,
          entityType: 'ReminderTask',
          entityId: reminderId,
          newValue: { action: 'email_sent_manual', toEmail: donorEmail },
          metadata: { reminderType: reminder.type },
        });

        this.logger.log(`Manual email sent for reminder ${reminderId} to ${donorEmail}`);
        return { success: true, message: `Email sent successfully to ${donorEmail}` };
      } else {
        await this.communicationLogService.logEmail({
          donorId: reminder.donorId,
          toEmail: donorEmail,
          subject: emailSubject,
          messagePreview: emailBody.substring(0, 200),
          status: 'FAILED',
          errorMessage: result.error,
          sentById: user.id,
          type: CommunicationType.GREETING,
        });

        this.logger.error(`Failed to send manual email for reminder ${reminderId}: ${result.error}`);
        return { success: false, message: `Failed to send email: ${result.error}` };
      }
    } catch (error: any) {
      this.logger.error(`Error sending manual email for reminder ${reminderId}: ${error.message}`);
      return { success: false, message: `Error sending email: ${error.message}` };
    }
  }

  private async getFallbackEmailBody(type: ReminderTaskType, donorName: string, relatedPersonName?: string): Promise<string> {
    const org = await this.orgProfileService.getProfile();
    switch (type) {
      case ReminderTaskType.BIRTHDAY:
        return `Dear ${donorName},

On behalf of everyone at ${org.name}, we wish you a very Happy Birthday!

Your generous support has touched countless lives, and we are truly grateful for your partnership in our mission.

May your special day be filled with joy, love, and all the happiness you deserve.`;
      case ReminderTaskType.FAMILY_BIRTHDAY:
        return `Dear ${donorName},

Wishing ${relatedPersonName || 'your loved one'} a very Happy Birthday from all of us at ${org.name}!

May this special day be filled with joy, laughter, and wonderful memories.`;
      case ReminderTaskType.ANNIVERSARY:
        return `Dear ${donorName},

Warmest wishes on your Anniversary from all of us at ${org.name}!

Your support and partnership mean so much to us. We hope this special day brings you wonderful memories and continued happiness.`;
      case ReminderTaskType.MEMORIAL:
        return `Dear ${donorName},

On this day, we pause to remember ${relatedPersonName || 'your loved one'} and send you our thoughts and prayers.

We are honored that you continue to be part of the ${org.name} family, and we hope our work together brings some comfort and meaning.`;
      case ReminderTaskType.PLEDGE:
        return `Dear ${donorName},

We hope this message finds you well.

This is a friendly reminder about your pledge to ${org.name}.

Your continued support is vital to our mission. If you have any questions or need assistance, please do not hesitate to reach out.`;
      default:
        return `Dear ${donorName},

Greetings from ${org.name}!

It has been a while since we last connected, and we wanted to reach out and share how your past support has made a difference.

We would love the opportunity to reconnect and update you on our latest initiatives. Please feel free to reach out at your convenience.`;
    }
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const monthFromNow = new Date(today);
    monthFromNow.setDate(monthFromNow.getDate() + 30);

    const [todayCount, weekCount, monthCount, overdueCount] = await Promise.all([
      this.prisma.reminderTask.count({
        where: {
          status: { in: [ReminderTaskStatus.OPEN, ReminderTaskStatus.SNOOZED] },
          dueDate: { gte: today, lte: endOfToday },
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: today } }],
        },
      }),
      this.prisma.reminderTask.count({
        where: {
          status: { in: [ReminderTaskStatus.OPEN, ReminderTaskStatus.SNOOZED] },
          dueDate: { gte: today, lte: weekFromNow },
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: today } }],
        },
      }),
      this.prisma.reminderTask.count({
        where: {
          status: { in: [ReminderTaskStatus.OPEN, ReminderTaskStatus.SNOOZED] },
          dueDate: { gte: today, lte: monthFromNow },
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: today } }],
        },
      }),
      this.prisma.reminderTask.count({
        where: {
          status: ReminderTaskStatus.OPEN,
          dueDate: { lt: today },
        },
      }),
    ]);

    return { today: todayCount, week: weekCount, month: monthCount, overdue: overdueCount };
  }
}
