import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { PledgeType } from '@prisma/client';
import { UserContext } from './pledges.types';

const pledgeTypeLabels: Record<string, string> = {
  CASH: 'Cash Donation',
  FOOD_GRAINS: 'Food Grains',
  CLOTHES: 'Clothes',
  EDUCATIONAL_SUPPLIES: 'Educational Supplies',
  MEDICAL_SUPPLIES: 'Medical Supplies',
  FURNITURE: 'Furniture',
  ELECTRONICS: 'Electronics',
  VOLUNTEERING: 'Volunteering',
  OTHER: 'Other',
};

@Injectable()
export class PledgesRemindersService {
  private readonly logger = new Logger(PledgesRemindersService.name);

  constructor(
    private prisma: PrismaService,
    private communicationLogService: CommunicationLogService,
    private emailJobsService: EmailJobsService,
    private orgProfileService: OrganizationProfileService,
  ) {}

  async sendPledgeReminderEmail(user: UserContext, id: string) {
    const pledge = await this.prisma.pledge.findFirst({
      where: { id, isDeleted: false },
      include: {
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            personalEmail: true,
            officialEmail: true,
            primaryPhone: true,
          },
        },
      },
    });

    if (!pledge) {
      throw new NotFoundException('Pledge not found');
    }

    const donorEmail = pledge.donor.personalEmail || pledge.donor.officialEmail;
    if (!donorEmail) {
      throw new BadRequestException('Donor has no email address on file');
    }

    const donorName =
      [pledge.donor.firstName, pledge.donor.lastName].filter(Boolean).join(' ') ||
      'Valued Donor';
    const pledgeLabel = pledgeTypeLabels[pledge.pledgeType] || pledge.pledgeType;
    const amountStr = pledge.amount
      ? `Rs. ${pledge.amount.toNumber().toLocaleString('en-IN')}`
      : '';
    const dueDate = pledge.expectedFulfillmentDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const orgName = (await this.orgProfileService.getProfile()).name;

    const subject = `Gentle Reminder: Pledge Due - ${pledgeLabel}${amountStr ? ` (${amountStr})` : ''}`;
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <p>Dear ${donorName},</p>
        <p>This is a gentle reminder about your pledge to ${orgName}.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; font-weight: bold; width: 140px;">Pledge Type:</td><td style="padding: 8px;">${pledgeLabel}</td></tr>
          ${amountStr ? `<tr><td style="padding: 8px; font-weight: bold;">Amount:</td><td style="padding: 8px;">${amountStr}</td></tr>` : ''}
          ${pledge.quantity ? `<tr><td style="padding: 8px; font-weight: bold;">Quantity:</td><td style="padding: 8px;">${pledge.quantity}</td></tr>` : ''}
          <tr><td style="padding: 8px; font-weight: bold;">Expected Date:</td><td style="padding: 8px;">${dueDate}</td></tr>
        </table>
        <p>Your continued support helps us continue our mission of serving those in need.</p>
        <p>If you have already fulfilled this pledge, please ignore this message.</p>
        <p>Warm regards,<br/>${orgName}</p>
      </div>
    `;

    const scheduledAt = new Date();
    await this.emailJobsService.create({
      donorId: pledge.donor.id,
      toEmail: donorEmail,
      subject,
      body,
      type: 'PLEDGE_REMINDER',
      relatedId: pledge.id,
      scheduledAt,
    });

    await this.communicationLogService.logEmail({
      donorId: pledge.donor.id,
      toEmail: donorEmail,
      subject,
      messagePreview: `Pledge reminder: ${pledgeLabel}${amountStr ? ` - ${amountStr}` : ''} due ${dueDate}`,
      status: 'SENT',
      sentById: user.id,
      type: 'FOLLOW_UP' as any,
    });

    this.logger.log(`Pledge reminder email queued for pledge ${id} to ${donorEmail}`);

    return { success: true, message: `Reminder email queued to ${donorEmail}` };
  }

  async buildWhatsAppReminderText(pledge: any): Promise<string> {
    const donorName =
      [pledge.donor?.firstName, pledge.donor?.lastName].filter(Boolean).join(' ') ||
      'Valued Donor';
    const pledgeLabel =
      pledgeTypeLabels[pledge.pledgeType as PledgeType] || pledge.pledgeType;
    const amountStr = pledge.amount
      ? `Rs. ${(typeof pledge.amount === 'object' ? pledge.amount.toNumber() : pledge.amount).toLocaleString('en-IN')}`
      : '';
    const dueDate = new Date(pledge.expectedFulfillmentDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const org = await this.orgProfileService.getProfile();
    return `Dear ${donorName},\n\nThis is a gentle reminder about your pledge to ${org.name}.\n\nPledge: ${pledgeLabel}${amountStr ? `\nAmount: ${amountStr}` : ''}${pledge.quantity ? `\nQuantity: ${pledge.quantity}` : ''}\nExpected Date: ${dueDate}\n\nYour continued support helps us serve those in need. Thank you for your generosity!\n\nIf you have already fulfilled this pledge, please ignore this message.\n\nWarm regards,\n${org.name}`;
  }

  async logWhatsAppReminder(user: UserContext, id: string) {
    const pledge = await this.prisma.pledge.findFirst({
      where: { id, isDeleted: false },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
            whatsappPhone: true,
          },
        },
      },
    });

    if (!pledge) {
      throw new NotFoundException('Pledge not found');
    }

    const phone = pledge.donor.whatsappPhone || pledge.donor.primaryPhone;
    if (!phone) {
      throw new BadRequestException('Donor has no phone number on file');
    }

    const pledgeLabel = pledgeTypeLabels[pledge.pledgeType] || pledge.pledgeType;
    const amountStr = pledge.amount
      ? `Rs. ${pledge.amount.toNumber().toLocaleString('en-IN')}`
      : '';

    await this.communicationLogService.logWhatsApp({
      donorId: pledge.donor.id,
      phoneNumber: phone,
      messagePreview: `Pledge reminder: ${pledgeLabel}${amountStr ? ` - ${amountStr}` : ''}`,
      sentById: user.id,
      type: 'FOLLOW_UP' as any,
    });

    return { success: true, message: 'WhatsApp reminder logged' };
  }

  async generatePledgeReminders(
    pledgeId: string,
    donorId: string,
    dueDate: Date,
    pledgeType: PledgeType,
  ) {
    const offsets = [7, 2, 0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const offset of offsets) {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - offset);
      reminderDate.setHours(0, 0, 0, 0);

      if (reminderDate < today) continue;

      const title =
        offset === 0
          ? `Pledge Due Today (${pledgeTypeLabels[pledgeType]})`
          : `Pledge Due in ${offset} days (${pledgeTypeLabels[pledgeType]})`;

      try {
        await this.prisma.reminderTask.upsert({
          where: {
            unique_pledge_reminder: {
              donorId,
              sourcePledgeId: pledgeId,
              offsetDays: offset,
            },
          },
          update: { title, dueDate: reminderDate, status: 'OPEN' },
          create: {
            donorId,
            type: 'PLEDGE',
            title,
            dueDate: reminderDate,
            sourcePledgeId: pledgeId,
            offsetDays: offset,
            status: 'OPEN',
          },
        });
      } catch (error: any) {
        this.logger.warn(`Failed to create pledge reminder: ${error.message}`);
      }
    }
  }
}
