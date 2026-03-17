import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationsService } from '../communications/communications.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { EmailService } from '../email/email.service';
import { ReceiptService } from '../receipt/receipt.service';
import { CommChannel, CommunicationChannel, CommunicationType } from '@prisma/client';
import { WhatsAppTemplateKey } from '../communications/twilio-whatsapp.service';
import { DonationEmailType } from '../email/templates/donation.templates';

export interface DonationNotificationParams {
  donationId: string;
  donorId: string;
  receiptNumber: string;
  donationAmount: number;
  currency: string;
  donationType: string;
  donationDate: Date;
  donationMode?: string;
  donorPAN?: string;
  emailType?: DonationEmailType;
  userId?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private communicationsService: CommunicationsService,
    private communicationLogService: CommunicationLogService,
    private emailService: EmailService,
    private receiptService: ReceiptService,
  ) {}

  async hasDonationNotificationBeenSent(
    donationId: string,
    channel: 'EMAIL' | 'WHATSAPP',
  ): Promise<boolean> {
    const existingMessage = await this.prisma.communicationMessage.findFirst({
      where: {
        donationId,
        channel: channel === 'WHATSAPP' ? CommChannel.WHATSAPP : CommChannel.EMAIL,
        status: { notIn: ['FAILED', 'UNDELIVERED'] },
      },
    });

    if (existingMessage) return true;

    const existingLog = await this.prisma.communicationLog.findFirst({
      where: {
        donationId,
        channel: channel === 'EMAIL' ? CommunicationChannel.EMAIL : CommunicationChannel.WHATSAPP,
        status: { notIn: ['FAILED'] },
      },
    });

    return !!existingLog;
  }

  async sendDonationEmail(params: DonationNotificationParams): Promise<{
    status: string;
    skipped?: boolean;
  }> {
    const already = await this.hasDonationNotificationBeenSent(params.donationId, 'EMAIL');
    if (already) {
      this.logger.log(`Donation email already sent for donationId=${params.donationId}, skipping`);
      return { status: 'already_sent', skipped: true };
    }

    const donor = await this.prisma.donor.findUnique({
      where: { id: params.donorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        personalEmail: true,
        officialEmail: true,
      },
    });

    if (!donor) return { status: 'skipped_no_donor' };

    const donorEmail = donor.personalEmail || donor.officialEmail;
    if (!donorEmail) return { status: 'skipped_no_email' };

    const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ') || 'Valued Donor';

    try {
      const pdfBuffer = await this.receiptService.generateReceiptPDF({
        receiptNumber: params.receiptNumber,
        donationDate: params.donationDate,
        donorName,
        donationAmount: params.donationAmount,
        currency: params.currency,
        paymentMode: params.donationType,
        donationType: params.donationType,
      });

      const result = await this.emailService.sendDonationReceipt(
        donorEmail,
        donorName,
        params.receiptNumber,
        pdfBuffer,
        {
          emailType: params.emailType || 'GENERAL',
          donationAmount: params.donationAmount,
          currency: params.currency,
          donationDate: params.donationDate,
          donationMode: params.donationMode,
          donationType: params.donationType,
          donorPAN: params.donorPAN,
        },
      );

      await this.communicationLogService.logEmail({
        donorId: params.donorId,
        donationId: params.donationId,
        toEmail: donorEmail,
        subject: `Donation Receipt - ${params.receiptNumber}`,
        messagePreview: `Receipt email sent for ${params.receiptNumber}`,
        status: result.success ? 'SENT' : 'FAILED',
        errorMessage: result.error,
        sentById: params.userId,
        type: CommunicationType.RECEIPT,
      });

      return { status: result.success ? 'sent' : 'failed' };
    } catch (error: any) {
      this.logger.error(`Donation email error for ${params.donationId}: ${error?.message}`);
      return { status: 'failed' };
    }
  }

  async sendDonationWhatsApp(params: DonationNotificationParams): Promise<{
    status: string;
    messageId?: string;
    skipped?: boolean;
  }> {
    const already = await this.hasDonationNotificationBeenSent(params.donationId, 'WHATSAPP');
    if (already) {
      this.logger.log(`Donation WhatsApp already sent for donationId=${params.donationId}, skipping`);
      return { status: 'already_sent', skipped: true };
    }

    const donor = await this.prisma.donor.findUnique({
      where: { id: params.donorId },
      select: {
        primaryPhone: true,
        primaryPhoneCode: true,
        whatsappPhone: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!donor) return { status: 'skipped_no_donor' };

    const { normalizeToE164 } = await import('../common/phone-utils');
    const rawPhone = donor.whatsappPhone || donor.primaryPhone;
    if (!rawPhone) return { status: 'skipped_no_phone' };

    const e164 = normalizeToE164(rawPhone, donor.primaryPhoneCode);
    if (!e164) return { status: 'skipped_invalid_phone' };

    const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ') || 'Valued Donor';

    try {
      const result = await this.communicationsService.sendByTemplateKey(
        'DONATION_THANK_YOU' as WhatsAppTemplateKey,
        params.donorId,
        e164,
        {
          '1': donorName,
          '2': params.donationType || 'General',
          '3': `${params.currency} ${params.donationAmount}`,
        },
        params.userId,
        params.donationId,
      );

      return {
        status: result.status || 'queued',
        messageId: result.messageId,
      };
    } catch (error: any) {
      this.logger.error(`Donation WhatsApp error for ${params.donationId}: ${error?.message}`);
      return { status: 'failed' };
    }
  }
}
