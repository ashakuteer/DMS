import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { EmailStatus, OccasionType, PledgeStatus } from '@prisma/client';

interface ReminderJobResult {
  specialDaysQueued: number;
  pledgesQueued: number;
  sponsorshipsQueued: number;
  sent: number;
  failed: number;
  errors: string[];
}

@Injectable()
export class AutoEmailReminderService {
  private readonly logger = new Logger(AutoEmailReminderService.name);
  private readonly OFFSET_DAYS = [30, 15, 7, 2, 0];

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private orgProfileService: OrganizationProfileService,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Kolkata' })
  async runDailyReminderJob(): Promise<ReminderJobResult> {
    this.logger.log('Starting daily email reminder job at 9 AM IST');
    return this.runReminderJob();
  }

  async runReminderJob(): Promise<ReminderJobResult> {
    const result: ReminderJobResult = {
      specialDaysQueued: 0,
      pledgesQueued: 0,
      sponsorshipsQueued: 0,
      sent: 0,
      failed: 0,
      errors: [],
    };

    if (!this.emailService.isConfigured()) {
      this.logger.warn('Email not configured. Skipping reminder job.');
      result.errors.push('Email not configured');
      return result;
    }

    try {
      const specialDayResult = await this.processSpecialDays();
      result.specialDaysQueued = specialDayResult.queued;
      result.sent += specialDayResult.sent;
      result.failed += specialDayResult.failed;
      result.errors.push(...specialDayResult.errors);

      const pledgeResult = await this.processPledges();
      result.pledgesQueued = pledgeResult.queued;
      result.sent += pledgeResult.sent;
      result.failed += pledgeResult.failed;
      result.errors.push(...pledgeResult.errors);

      // Process beneficiary birthday reminders to sponsors
      const beneficiaryBirthdayResult = await this.processBeneficiaryBirthdays();
      result.specialDaysQueued += beneficiaryBirthdayResult.queued;
      result.sent += beneficiaryBirthdayResult.sent;
      result.failed += beneficiaryBirthdayResult.failed;
      result.errors.push(...beneficiaryBirthdayResult.errors);

      // Process monthly sponsorship due reminders
      const sponsorshipResult = await this.processMonthlySponsorships();
      result.sponsorshipsQueued = sponsorshipResult.queued;
      result.sent += sponsorshipResult.sent;
      result.failed += sponsorshipResult.failed;
      result.errors.push(...sponsorshipResult.errors);

      this.logger.log(`Reminder job completed: Sent ${result.sent}, Failed ${result.failed}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Reminder job failed: ${errorMessage}`);
      result.errors.push(errorMessage);
    }

    return result;
  }

  private async processSpecialDays(): Promise<{ queued: number; sent: number; failed: number; errors: string[] }> {
    const result = { queued: 0, sent: 0, failed: 0, errors: [] as string[] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const donors = await this.prisma.donor.findMany({
      where: { isDeleted: false, prefReminders: true, prefEmail: true },
      include: {
        specialOccasions: true,
        familyMembers: {
          where: {
            birthMonth: { not: null },
            birthDay: { not: null },
          },
        },
      },
    });

    for (const donor of donors) {
      const email = donor.personalEmail || donor.officialEmail;
      if (!email) continue;

      for (const occasion of donor.specialOccasions) {
        const nextOccurrence = this.calculateNextOccurrence(occasion.month, occasion.day);
        const daysUntil = this.calculateDaysUntil(today, nextOccurrence);

        if (this.OFFSET_DAYS.includes(daysUntil)) {
          const subType = this.getOccasionSubType(occasion.type);
          const isDuplicate = await this.checkDuplicate(donor.id, 'SPECIAL_DAY', occasion.id, daysUntil);
          
          if (!isDuplicate) {
            result.queued++;
            const sendResult = await this.sendSpecialDayEmail(donor, email, occasion, daysUntil);
            if (sendResult.success) {
              result.sent++;
            } else {
              result.failed++;
              result.errors.push(sendResult.error || 'Unknown error');
            }
          }
        }
      }

      for (const familyMember of donor.familyMembers) {
        if (!familyMember.birthMonth || !familyMember.birthDay) continue;

        const nextOccurrence = this.calculateNextOccurrence(familyMember.birthMonth, familyMember.birthDay);
        const daysUntil = this.calculateDaysUntil(today, nextOccurrence);

        if (this.OFFSET_DAYS.includes(daysUntil)) {
          const isDuplicate = await this.checkDuplicate(donor.id, 'SPECIAL_DAY', familyMember.id, daysUntil);
          
          if (!isDuplicate) {
            result.queued++;
            const sendResult = await this.sendFamilyBirthdayEmail(donor, email, familyMember, daysUntil);
            if (sendResult.success) {
              result.sent++;
            } else {
              result.failed++;
              result.errors.push(sendResult.error || 'Unknown error');
            }
          }
        }
      }
    }

    return result;
  }

  private async processPledges(): Promise<{ queued: number; sent: number; failed: number; errors: string[] }> {
    const result = { queued: 0, sent: 0, failed: 0, errors: [] as string[] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pledges = await this.prisma.pledge.findMany({
      where: {
        status: PledgeStatus.PENDING,
        donor: {
          isDeleted: false,
          prefReminders: true,
          prefEmail: true,
        },
      },
      include: {
        donor: true,
      },
    });

    for (const pledge of pledges) {
      const email = pledge.donor.personalEmail || pledge.donor.officialEmail;
      if (!email) continue;

      const expectedDate = new Date(pledge.expectedFulfillmentDate);
      expectedDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.floor((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let shouldSend = false;
      let subType = '';

      if (daysUntil <= 7 && daysUntil > 0) {
        shouldSend = true;
        subType = 'PLEDGE_DUE_SOON';
      } else if (daysUntil === 0) {
        shouldSend = true;
        subType = 'PLEDGE_DUE_TODAY';
      } else if (daysUntil < 0 && daysUntil % 3 === 0) {
        shouldSend = true;
        subType = 'PLEDGE_OVERDUE';
      }

      if (shouldSend) {
        const isDuplicate = await this.checkDuplicate(pledge.donor.id, 'PLEDGE', pledge.id, daysUntil);

        if (!isDuplicate) {
          result.queued++;
          const sendResult = await this.sendPledgeEmail(pledge.donor, email, pledge, daysUntil, subType);
          if (sendResult.success) {
            result.sent++;
          } else {
            result.failed++;
            result.errors.push(sendResult.error || 'Unknown error');
          }
        }
      }
    }

    return result;
  }

  private async processBeneficiaryBirthdays(): Promise<{ queued: number; sent: number; failed: number; errors: string[] }> {
    const result = { queued: 0, sent: 0, failed: 0, errors: [] as string[] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find beneficiaries with birthday month/day set
    const beneficiaries = await this.prisma.beneficiary.findMany({
      where: {
        isDeleted: false,
        dobMonth: { not: null },
        dobDay: { not: null },
        sponsorships: {
          some: { isActive: true, status: 'ACTIVE' },
        },
      },
      include: {
        sponsorships: {
          where: { isActive: true, status: 'ACTIVE' },
          include: {
            donor: true,
          },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    for (const beneficiary of beneficiaries) {
      if (!beneficiary.dobMonth || !beneficiary.dobDay) continue;

      const nextOccurrence = this.calculateNextOccurrence(beneficiary.dobMonth, beneficiary.dobDay);
      const daysUntil = this.calculateDaysUntil(today, nextOccurrence);

      if (this.OFFSET_DAYS.includes(daysUntil)) {
        // Send to each sponsor donor
        for (const sponsorship of beneficiary.sponsorships) {
          const donor = sponsorship.donor;
          const email = donor.personalEmail || donor.officialEmail;
          if (!email || donor.isDeleted || !donor.prefEmail || !donor.prefReminders) continue;

          const isDuplicate = await this.checkDuplicate(donor.id, 'BENEFICIARY_BIRTHDAY', beneficiary.id, daysUntil);

          if (!isDuplicate) {
            result.queued++;
            const sendResult = await this.sendBeneficiaryBirthdayEmail(donor, email, beneficiary, daysUntil);
            if (sendResult.success) {
              result.sent++;
            } else {
              result.failed++;
              result.errors.push(sendResult.error || 'Unknown error');
            }
          }
        }
      }
    }

    return result;
  }

  private async processMonthlySponsorships(): Promise<{ queued: number; sent: number; failed: number; errors: string[] }> {
    const result = { queued: 0, sent: 0, failed: 0, errors: [] as string[] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = today.getDate();

    // Find active monthly sponsorships where the donor has email preferences enabled
    const sponsorships = await this.prisma.sponsorship.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        frequency: 'MONTHLY',
        donor: {
          isDeleted: false,
          prefReminders: true,
          prefEmail: true,
        },
      },
      include: {
        donor: true,
        beneficiary: true,
      },
    });

    for (const sponsorship of sponsorships) {
      const donor = sponsorship.donor;
      const email = donor.personalEmail || donor.officialEmail;
      if (!email) continue;

      // Calculate due date based on dueDayOfMonth or sponsorship start date (same day each month)
      const dueDay = sponsorship.dueDayOfMonth ?? (sponsorship.startDate ? new Date(sponsorship.startDate).getDate() : null);
      if (!dueDay) continue;
      
      // Calculate the next due date, handling month boundaries correctly
      const nextDueDate = this.calculateMonthlyDueDate(today, dueDay);
      const daysUntil = this.calculateDaysUntil(today, nextDueDate);
      
      // Also check if we recently passed the due date (for overdue reminders)
      const prevDueDate = this.calculatePreviousMonthlyDueDate(today, dueDay);
      const daysSinceDue = this.calculateDaysUntil(prevDueDate, today);
      
      // Determine which reminder to send
      let shouldSend = false;
      let reminderDaysUntil = daysUntil;
      let dueDateForKey = nextDueDate;
      
      // Check upcoming reminders: 7, 3, 0 days before
      if ([7, 3, 0].includes(daysUntil)) {
        shouldSend = true;
        reminderDaysUntil = daysUntil;
      }
      // Check overdue reminder: 1 day after due
      else if (daysSinceDue === 1) {
        shouldSend = true;
        reminderDaysUntil = -1;
        dueDateForKey = prevDueDate;
      }
      
      if (shouldSend) {
        // Use the due date's month for duplicate check
        const dueMonth = dueDateForKey.getMonth();
        const dueYear = dueDateForKey.getFullYear();
        const monthKey = `${dueYear}-${dueMonth}`;
        
        const isDuplicate = await this.checkDuplicate(donor.id, 'SPONSORSHIP_DUE', `${sponsorship.id}-${monthKey}`, reminderDaysUntil);

        if (!isDuplicate) {
          result.queued++;
          const sendResult = await this.sendSponsorshipDueEmail(donor, email, sponsorship, reminderDaysUntil, monthKey);
          if (sendResult.success) {
            result.sent++;
          } else {
            result.failed++;
            result.errors.push(sendResult.error || 'Unknown error');
          }
        }
      }
    }

    return result;
  }

  private async sendSponsorshipDueEmail(
    donor: any,
    email: string,
    sponsorship: any,
    daysUntil: number,
    monthKey: string,
  ): Promise<{ success: boolean; error?: string }> {
    const org = await this.orgProfileService.getProfile();
    const donorName = `${donor.firstName}${donor.lastName ? ' ' + donor.lastName : ''}`;
    const beneficiaryName = sponsorship.beneficiary?.fullName || 'your sponsored beneficiary';
    const amount = sponsorship.amount ? `₹${sponsorship.amount.toLocaleString('en-IN')}` : 'your monthly sponsorship';
    const homeName = this.getHomeTypeName(sponsorship.beneficiary?.homeType || '');

    const { subject, body } = this.getSponsorshipDueTemplate(donorName, beneficiaryName, amount, homeName, daysUntil, org);

    try {
      const result = await this.emailService.sendEmail({
        to: email,
        subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ''),
        featureType: 'AUTO',
      });

      await this.logEmail(donor.id, email, subject, result.success, result.messageId, result.error, {
        type: 'SPONSORSHIP',
        subType: 'SPONSORSHIP_DUE',
        relatedId: `${sponsorship.id}-${monthKey}`,
        offsetDays: daysUntil,
      });

      return { success: result.success, error: result.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  private getSponsorshipDueTemplate(
    donorName: string,
    beneficiaryName: string,
    amount: string,
    homeName: string,
    daysUntil: number,
    org: any,
  ): { subject: string; body: string } {
    const phoneDisplay = org.phone2 ? `${org.phone1} / ${org.phone2}` : org.phone1;
    let subject = '';
    let message = '';

    if (daysUntil === 0) {
      subject = `Monthly Sponsorship Due Today: ${beneficiaryName}`;
      message = `Today is the due date for your monthly sponsorship of <strong>${amount}</strong> for ${beneficiaryName} at ${homeName}.`;
    } else if (daysUntil < 0) {
      subject = `Reminder: Monthly Sponsorship Overdue - ${beneficiaryName}`;
      message = `This is a gentle reminder that your monthly sponsorship of <strong>${amount}</strong> for ${beneficiaryName} at ${homeName} was due ${Math.abs(daysUntil)} day(s) ago.`;
    } else if (daysUntil <= 3) {
      subject = `Coming Up: Monthly Sponsorship for ${beneficiaryName}`;
      message = `Your monthly sponsorship of <strong>${amount}</strong> for ${beneficiaryName} at ${homeName} is due in ${daysUntil} day(s).`;
    } else {
      subject = `Upcoming Sponsorship: ${beneficiaryName} in ${daysUntil} Days`;
      message = `Your monthly sponsorship of <strong>${amount}</strong> for ${beneficiaryName} at ${homeName} will be due in ${daysUntil} days.`;
    }

    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <p>Dear ${donorName},</p>
        
        <p>${message}</p>
        
        <p>Your continued support makes a tremendous difference in ${beneficiaryName}'s life. Thank you for being a part of their journey.</p>
        
        <p>If you have any questions or need assistance with your sponsorship, please don't hesitate to reach out.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #cccccc; font-size: 13px; color: #666666;">
          <p style="margin: 0;">With heartfelt gratitude,</p>
          <p style="margin: 5px 0 15px 0;"><strong>${org.name}</strong></p>
          <p style="margin: 0;">Phone: ${phoneDisplay}</p>
          <p style="margin: 0;">Email: ${org.email}</p>
          <p style="margin: 0;">Website: ${org.website}</p>
        </div>
      </div>
    `;

    return { subject, body };
  }

  private async sendBeneficiaryBirthdayEmail(
    donor: any,
    email: string,
    beneficiary: any,
    daysUntil: number,
  ): Promise<{ success: boolean; error?: string }> {
    const org = await this.orgProfileService.getProfile();
    const donorName = `${donor.firstName}${donor.lastName ? ' ' + donor.lastName : ''}`;
    const beneficiaryName = beneficiary.fullName;
    const homeName = this.getHomeTypeName(beneficiary.homeType);
    const latestUpdate = beneficiary.updates?.[0];
    const updateSnippet = latestUpdate ? latestUpdate.title : 'is doing well at the home';

    const { subject, body } = await this.getBeneficiaryBirthdayTemplate(donorName, beneficiaryName, homeName, updateSnippet, daysUntil, org);

    try {
      const result = await this.emailService.sendEmail({
        to: email,
        subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ''),
        featureType: 'SPECIALDAY',
      });

      await this.logEmail(donor.id, email, subject, result.success, result.messageId, result.error, {
        type: 'BENEFICIARY_BIRTHDAY',
        subType: 'BENEFICIARY_BIRTHDAY',
        relatedId: beneficiary.id,
        offsetDays: daysUntil,
      });

      return { success: result.success, error: result.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logEmail(donor.id, email, subject, false, undefined, errorMessage, {
        type: 'BENEFICIARY_BIRTHDAY',
        subType: 'BENEFICIARY_BIRTHDAY',
        relatedId: beneficiary.id,
        offsetDays: daysUntil,
      });
      return { success: false, error: errorMessage };
    }
  }

  private getHomeTypeName(homeType: string): string {
    switch (homeType) {
      case 'ORPHAN_GIRLS': return 'Orphan Girls Home';
      case 'BLIND_BOYS': return 'Visually Challenged Boys Home';
      case 'OLD_AGE': return 'Old Age Home';
      default: return homeType;
    }
  }

  private async getBeneficiaryBirthdayTemplate(
    donorName: string,
    beneficiaryName: string,
    homeName: string,
    updateSnippet: string,
    daysUntil: number,
    org: any,
  ): Promise<{ subject: string; body: string }> {
    let birthdayIntro = '';
    let fallbackSubject = '';

    if (daysUntil === 0) {
      fallbackSubject = `Today is ${beneficiaryName}'s Birthday!`;
      birthdayIntro = `<p>Today is a special day! <strong>${beneficiaryName}</strong> from ${homeName} is celebrating their birthday.</p>`;
    } else if (daysUntil === 2) {
      fallbackSubject = `${beneficiaryName}'s Birthday is in 2 Days!`;
      birthdayIntro = `<p>${beneficiaryName} from ${homeName} will be celebrating their birthday in just 2 days!</p>`;
    } else if (daysUntil === 7) {
      fallbackSubject = `${beneficiaryName}'s Birthday is Coming Up Next Week`;
      birthdayIntro = `<p>${beneficiaryName} from ${homeName} has a birthday coming up in 7 days!</p>`;
    } else {
      fallbackSubject = `Upcoming Birthday: ${beneficiaryName} in ${daysUntil} Days`;
      birthdayIntro = `<p>${beneficiaryName} from ${homeName} has a birthday coming up in ${daysUntil} days.</p>`;
    }

    const variables: Record<string, string> = {
      donor_name: donorName,
      beneficiary_name: beneficiaryName,
      home_name: homeName,
      update_snippet: updateSnippet,
      birthday_intro: birthdayIntro,
      org_name: org.name,
    };

    try {
      const template = await this.prisma.messageTemplate.findUnique({
        where: { key_channel: { key: 'BENEFICIARY_BIRTHDAY_WISH', channel: 'EMAIL' } },
      });

      if (template) {
        const subject = template.subject
          ? this.renderBeneficiaryTemplate(template.subject, variables)
          : fallbackSubject;
        const body = this.renderBeneficiaryTemplate(template.body, variables);
        return { subject, body };
      }
    } catch (error) {
      this.logger.warn('Failed to load beneficiary birthday template from DB, using fallback');
    }

    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Dear ${donorName},</h2>
        ${birthdayIntro}
        <p>Your generous support has made a real difference in their life. Here's a recent update: <em>${updateSnippet}</em></p>
        <p>Thank you for being a part of ${beneficiaryName}'s journey with ${org.name}. Your kindness and compassion continue to bring hope and joy.</p>
        <p>Warm regards,<br>${org.name}</p>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by ${org.name}. If you wish to update your communication preferences, please contact us.
        </p>
      </div>
    `;

    return { subject: fallbackSubject, body };
  }

  private renderBeneficiaryTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
  }

  private async sendSpecialDayEmail(
    donor: any,
    email: string,
    occasion: any,
    daysUntil: number,
  ): Promise<{ success: boolean; error?: string }> {
    const org = await this.orgProfileService.getProfile();
    const donorName = `${donor.firstName}${donor.lastName ? ' ' + donor.lastName : ''}`;
    const subType = this.getOccasionSubType(occasion.type);

    const { subject, body } = this.getSpecialDayTemplate(donorName, occasion.type, occasion.relatedPersonName, daysUntil, org);

    try {
      const result = await this.emailService.sendEmail({
        to: email,
        subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ''),
        featureType: 'SPECIALDAY',
      });

      await this.logEmail(donor.id, email, subject, result.success, result.messageId, result.error, {
        type: 'SPECIAL_DAY',
        subType,
        relatedId: occasion.id,
        offsetDays: daysUntil,
      });

      return { success: result.success, error: result.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logEmail(donor.id, email, subject, false, undefined, errorMessage, {
        type: 'SPECIAL_DAY',
        subType,
        relatedId: occasion.id,
        offsetDays: daysUntil,
      });
      return { success: false, error: errorMessage };
    }
  }

  private async sendFamilyBirthdayEmail(
    donor: any,
    email: string,
    familyMember: any,
    daysUntil: number,
  ): Promise<{ success: boolean; error?: string }> {
    const org = await this.orgProfileService.getProfile();
    const donorName = `${donor.firstName}${donor.lastName ? ' ' + donor.lastName : ''}`;

    const { subject, body } = this.getSpecialDayTemplate(donorName, 'FAMILY_BIRTHDAY' as any, familyMember.name, daysUntil, org);

    try {
      const result = await this.emailService.sendEmail({
        to: email,
        subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ''),
        featureType: 'SPECIALDAY',
      });

      await this.logEmail(donor.id, email, subject, result.success, result.messageId, result.error, {
        type: 'SPECIAL_DAY',
        subType: 'FAMILY_BIRTHDAY',
        relatedId: familyMember.id,
        offsetDays: daysUntil,
      });

      return { success: result.success, error: result.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logEmail(donor.id, email, subject, false, undefined, errorMessage, {
        type: 'SPECIAL_DAY',
        subType: 'FAMILY_BIRTHDAY',
        relatedId: familyMember.id,
        offsetDays: daysUntil,
      });
      return { success: false, error: errorMessage };
    }
  }

  private async sendPledgeEmail(
    donor: any,
    email: string,
    pledge: any,
    daysUntil: number,
    subType: string,
  ): Promise<{ success: boolean; error?: string }> {
    const org = await this.orgProfileService.getProfile();
    const donorName = `${donor.firstName}${donor.lastName ? ' ' + donor.lastName : ''}`;

    const { subject, body } = this.getPledgeTemplate(donorName, pledge, daysUntil, org);

    try {
      const result = await this.emailService.sendEmail({
        to: email,
        subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ''),
        featureType: 'PLEDGE',
      });

      await this.logEmail(donor.id, email, subject, result.success, result.messageId, result.error, {
        type: 'PLEDGE',
        subType,
        relatedId: pledge.id,
        offsetDays: daysUntil,
      });

      return { success: result.success, error: result.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logEmail(donor.id, email, subject, false, undefined, errorMessage, {
        type: 'PLEDGE',
        subType,
        relatedId: pledge.id,
        offsetDays: daysUntil,
      });
      return { success: false, error: errorMessage };
    }
  }

  async sendTestEmail(toEmail: string): Promise<{ success: boolean; error?: string }> {
    if (!this.emailService.isConfigured()) {
      return { success: false, error: 'Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables.' };
    }

    const org = await this.orgProfileService.getProfile();
    const result = await this.emailService.sendEmail({
      to: toEmail,
      subject: 'NGO DMS Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Configuration Test</h2>
          <p>This is a test email from ${org.name} Donor Management System.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated test email. Please do not reply.
          </p>
        </div>
      `,
      text: `Email Configuration Test\n\nThis is a test email from ${org.name} Donor Management System.\nIf you received this email, your email configuration is working correctly.`,
      featureType: 'TEST',
    });

    return { success: result.success, error: result.error };
  }

  async sendManualSpecialDayEmail(
    donorId: string,
    occasionId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const occasion = await this.prisma.donorSpecialOccasion.findUnique({
      where: { id: occasionId },
      include: { donor: true },
    });

    if (!occasion) {
      return { success: false, error: 'Occasion not found' };
    }

    const donor = occasion.donor;
    const email = donor.personalEmail || donor.officialEmail;
    if (!email) {
      return { success: false, error: 'No email available for donor' };
    }

    const org = await this.orgProfileService.getProfile();
    const donorName = `${donor.firstName}${donor.lastName ? ' ' + donor.lastName : ''}`;
    const { subject, body } = this.getSpecialDayTemplate(donorName, occasion.type, occasion.relatedPersonName, 0, org);

    try {
      const result = await this.emailService.sendEmail({
        to: email,
        subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ''),
        featureType: 'MANUAL',
      });

      await this.logEmail(donor.id, email, subject, result.success, result.messageId, result.error, {
        type: 'MANUAL',
        subType: 'MANUAL_SEND',
        relatedId: occasion.id,
        offsetDays: null,
      });

      return { success: result.success, error: result.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  private getSpecialDayTemplate(
    donorName: string,
    occasionType: OccasionType | 'FAMILY_BIRTHDAY',
    personName: string | null | undefined,
    daysUntil: number,
    org: any,
  ): { subject: string; body: string } {
    let subject: string;
    let greeting: string;
    const phoneDisplay = org.phone2 ? `${org.phone1} / ${org.phone2}` : org.phone1;

    const datePrefix = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`;

    switch (occasionType) {
      case OccasionType.DOB_SELF:
        subject = `Warm Birthday Wishes from ${org.name}`;
        greeting = daysUntil === 0 
          ? `Wishing you a very happy birthday!`
          : `${datePrefix}, we will be celebrating your special day!`;
        break;
      case 'FAMILY_BIRTHDAY':
        subject = `Birthday Wishes for ${personName || 'Your Loved One'} from ${org.name}`;
        greeting = daysUntil === 0
          ? `Wishing ${personName || 'your loved one'} a very happy birthday!`
          : `${datePrefix}, we will be celebrating ${personName || 'your loved one'}'s birthday!`;
        break;
      case OccasionType.ANNIVERSARY:
        subject = `Happy Anniversary — Thank You for Supporting ${org.name}`;
        greeting = daysUntil === 0
          ? `Wishing you a very happy anniversary!`
          : `${datePrefix}, we will be celebrating your anniversary!`;
        break;
      case OccasionType.DEATH_ANNIVERSARY:
        const personRef = personName || 'your loved one';
        subject = `In Loving Memory — With Gratitude from ${org.name}`;
        greeting = daysUntil === 0
          ? `As we remember ${personRef} today, our thoughts and prayers are with you.`
          : `${datePrefix}, we will be remembering ${personRef} with you.`;
        break;
      default:
        subject = `Warm Wishes from ${org.name}`;
        greeting = 'We hope this message finds you well.';
    }

    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <p>Dear ${donorName},</p>
        
        <p>${greeting}</p>
        
        <p>Your support for ${org.name} has touched many lives, and we are grateful to have you as part of our family.</p>
        
        <p>We send our warmest wishes and prayers for health, prosperity, and happiness.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #cccccc; font-size: 13px; color: #666666;">
          <p style="margin: 0;">With heartfelt gratitude,</p>
          <p style="margin: 5px 0 15px 0;"><strong>${org.name}</strong></p>
          <p style="margin: 0;">Phone: ${phoneDisplay}</p>
          <p style="margin: 0;">Email: ${org.email}</p>
          <p style="margin: 0;">Website: ${org.website}</p>
        </div>
      </div>
    `;

    return { subject, body };
  }

  private getPledgeTemplate(
    donorName: string,
    pledge: any,
    daysUntil: number,
    org: any,
  ): { subject: string; body: string } {
    const phoneDisplay = org.phone2 ? `${org.phone1} / ${org.phone2}` : org.phone1;
    const pledgeItem = pledge.pledgeType === 'MONEY' 
      ? `₹${pledge.amount?.toLocaleString('en-IN')}` 
      : pledge.quantity || 'your pledge';

    let subject: string;
    let message: string;

    if (daysUntil < 0) {
      subject = `Gentle reminder: Your pledged support (${pledgeItem})`;
      message = `This is a gentle reminder about your pledge of <strong>${pledgeItem}</strong> which was expected on ${new Date(pledge.expectedFulfillmentDate).toLocaleDateString('en-IN')}.`;
    } else if (daysUntil === 0) {
      subject = `Today: Your pledged support (${pledgeItem})`;
      message = `Today is the expected date for your pledge of <strong>${pledgeItem}</strong>.`;
    } else {
      subject = `Upcoming: Your pledged support (${pledgeItem})`;
      message = `Your pledge of <strong>${pledgeItem}</strong> is expected in ${daysUntil} days (${new Date(pledge.expectedFulfillmentDate).toLocaleDateString('en-IN')}).`;
    }

    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <p>Dear ${donorName},</p>
        
        <p>${message}</p>
        
        <p>Your commitment to ${org.name} means the world to us and to the lives we serve together.</p>
        
        <p>If you'd like us to arrange pickup or have any questions, please reply to this email or contact us.</p>
        
        ${pledge.notes ? `<p style="background: #f5f5f5; padding: 10px; border-radius: 5px;"><strong>Notes:</strong> ${pledge.notes}</p>` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #cccccc; font-size: 13px; color: #666666;">
          <p style="margin: 0;">With heartfelt gratitude,</p>
          <p style="margin: 5px 0 15px 0;"><strong>${org.name}</strong></p>
          <p style="margin: 0;">Phone: ${phoneDisplay}</p>
          <p style="margin: 0;">Email: ${org.email}</p>
          <p style="margin: 0;">Website: ${org.website}</p>
        </div>
      </div>
    `;

    return { subject, body };
  }

  private async checkDuplicate(
    donorId: string,
    type: string,
    relatedId: string,
    offsetDays: number,
  ): Promise<boolean> {
    const existing = await this.prisma.emailLog.findFirst({
      where: {
        donorId,
        subType: { contains: type },
        relatedId,
        offsetDays,
        status: EmailStatus.SENT,
      },
    });
    return !!existing;
  }


  private async logEmail(
    donorId: string,
    toEmail: string,
    subject: string,
    success: boolean,
    messageId?: string,
    errorMessage?: string,
    metadata?: {
      type?: string;
      subType?: string;
      relatedId?: string;
      offsetDays?: number | null;
    },
  ): Promise<void> {
    try {
      await this.prisma.emailLog.create({
        data: {
          donorId,
          toEmail,
          subject,
          status: success ? EmailStatus.SENT : EmailStatus.FAILED,
          messageId,
          errorMessage,
          subType: metadata?.subType,
          relatedId: metadata?.relatedId,
          offsetDays: metadata?.offsetDays,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log email: ${error}`);
    }
  }

  private calculateNextOccurrence(month: number, day: number): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    let nextDate = new Date(currentYear, month - 1, day);
    nextDate.setHours(0, 0, 0, 0);

    if (nextDate < today) {
      nextDate = new Date(currentYear + 1, month - 1, day);
      nextDate.setHours(0, 0, 0, 0);
    }

    return nextDate;
  }

  private calculateDaysUntil(from: Date, to: Date): number {
    return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateMonthlyDueDate(today: Date, dueDay: number): Date {
    const year = today.getFullYear();
    const month = today.getMonth();
    const currentDay = today.getDate();
    
    // Try current month first
    let dueDate = new Date(year, month, Math.min(dueDay, this.getDaysInMonth(year, month)));
    dueDate.setHours(0, 0, 0, 0);
    
    // If the due date has already passed this month, move to next month
    if (dueDate < today) {
      const nextMonth = month + 1;
      const nextYear = nextMonth > 11 ? year + 1 : year;
      const nextMonthIndex = nextMonth > 11 ? 0 : nextMonth;
      dueDate = new Date(nextYear, nextMonthIndex, Math.min(dueDay, this.getDaysInMonth(nextYear, nextMonthIndex)));
      dueDate.setHours(0, 0, 0, 0);
    }
    
    return dueDate;
  }

  private calculatePreviousMonthlyDueDate(today: Date, dueDay: number): Date {
    const year = today.getFullYear();
    const month = today.getMonth();
    const currentDay = today.getDate();
    
    // Try current month first
    let dueDate = new Date(year, month, Math.min(dueDay, this.getDaysInMonth(year, month)));
    dueDate.setHours(0, 0, 0, 0);
    
    // If the due date is in the future or today, go to previous month
    if (dueDate >= today) {
      const prevMonth = month - 1;
      const prevYear = prevMonth < 0 ? year - 1 : year;
      const prevMonthIndex = prevMonth < 0 ? 11 : prevMonth;
      dueDate = new Date(prevYear, prevMonthIndex, Math.min(dueDay, this.getDaysInMonth(prevYear, prevMonthIndex)));
      dueDate.setHours(0, 0, 0, 0);
    }
    
    return dueDate;
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  private getOccasionSubType(type: OccasionType): string {
    switch (type) {
      case OccasionType.DOB_SELF:
        return 'BIRTHDAY';
      case OccasionType.ANNIVERSARY:
        return 'ANNIVERSARY';
      case OccasionType.DEATH_ANNIVERSARY:
        return 'DEATH_ANNIVERSARY';
      default:
        return 'OTHER';
    }
  }

  async getEmailLogs(limit: number = 50): Promise<any[]> {
    return this.prisma.emailLog.findMany({
      take: limit,
      orderBy: { sentAt: 'desc' },
      include: {
        donor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
