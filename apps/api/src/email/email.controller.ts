import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReceiptService } from '../receipt/receipt.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { AuditService } from '../audit/audit.service';

interface SendEmailDto {
  donorId: string;
  donationId?: string;
  templateId?: string;
  toEmail: string;
  subject: string;
  body: string;
  attachReceipt?: boolean;
}

@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly receiptService: ReceiptService,
    private readonly communicationLogService: CommunicationLogService,
    private readonly auditService: AuditService,
  ) {}

  @Get('config-status')
  @Roles('ADMIN')
  getConfigStatus() {
    const status = this.emailService.getConfigStatus();
    return {
      configured: status.configured,
      smtpHost: status.smtpHost || 'NOT_SET',
      smtpUser: this.emailService.getMaskedSmtpUser(),
      fromEmail: status.fromEmail || 'NOT_SET',
      error: status.error || null,
    };
  }

  @Post('test-send')
  @Roles('ADMIN')
  async testSend(@Body() body: { toEmail: string }, @Request() req: any) {
    if (!body.toEmail) {
      throw new BadRequestException('toEmail is required');
    }
    const result = await this.emailService.sendEmail({
      to: body.toEmail,
      subject: 'DMS Email Test',
      html: '<h2>Email is working!</h2><p>This is a test email from your Donor Management System.</p>',
      text: 'Email is working! This is a test email from your Donor Management System.',
      featureType: 'TEST',
    });
    return result;
  }

  @Post('send')
  @Roles('ADMIN', 'STAFF')
  async sendEmail(@Body() dto: SendEmailDto, @Request() req: any) {
    const { donorId, donationId, templateId, toEmail, subject, body, attachReceipt } = dto;

    if (!toEmail) {
      throw new BadRequestException('Recipient email is required');
    }

    if (!subject || !body) {
      throw new BadRequestException('Subject and body are required');
    }

    const donor = await this.prisma.donor.findUnique({
      where: { id: donorId },
    });

    if (!donor) {
      throw new NotFoundException('Donor not found');
    }

    let pdfBuffer: Buffer | undefined;
    let receiptNumber: string | undefined;

    if (attachReceipt && donationId) {
      const donation = await this.prisma.donation.findUnique({
        where: { id: donationId },
        include: { donor: true },
      });

      if (!donation) {
        throw new NotFoundException('Donation not found');
      }

      if (donation.receiptNumber) {
        receiptNumber = donation.receiptNumber;
        const donorName = [donation.donor.firstName, donation.donor.middleName, donation.donor.lastName]
          .filter(Boolean)
          .join(' ');

        pdfBuffer = await this.receiptService.generateReceiptPDF({
          receiptNumber: donation.receiptNumber,
          donationDate: donation.donationDate,
          donorName,
          donationAmount: Number(donation.donationAmount),
          currency: donation.currency,
          paymentMode: donation.donationMode,
          donationType: donation.donationType,
          remarks: donation.remarks || undefined,
          donorAddress: [donation.donor.address, donation.donor.city, donation.donor.state, donation.donor.pincode]
            .filter(Boolean)
            .join(', ') || undefined,
          donorEmail: donation.donor.personalEmail || donation.donor.officialEmail || undefined,
          donorPAN: donation.donor.pan || undefined,
          transactionRef: donation.transactionId || undefined,
        });
      }
    }

    const htmlBody = body.replace(/\n/g, '<br/>');
    const brandedHtml = await this.emailService.wrapWithBranding(htmlBody);

    const result = await this.emailService.sendEmail({
      to: toEmail,
      subject,
      html: brandedHtml,
      text: body,
      attachments: pdfBuffer && receiptNumber
        ? [
            {
              filename: `Receipt-${receiptNumber}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ]
        : undefined,
    });

    await this.prisma.emailLog.create({
      data: {
        donorId,
        donationId: donationId || null,
        templateId: templateId || null,
        toEmail,
        subject,
        status: result.success ? 'SENT' : 'FAILED',
        messageId: result.messageId || null,
        errorMessage: result.error || null,
        sentById: req.user.id,
      },
    });

    await this.communicationLogService.logEmail({
      donorId,
      donationId: donationId || undefined,
      templateId: templateId || undefined,
      toEmail,
      subject,
      messagePreview: body.substring(0, 200),
      status: result.success ? 'SENT' : 'FAILED',
      errorMessage: result.error,
      sentById: req.user.id,
    });

    if (result.success) {
      await this.auditService.logEmailSend(req.user.id, 'Donor', donorId, {
        toEmail,
        subject,
        donationId,
        templateId,
        attachReceipt: !!attachReceipt,
      });
    }

    if (!result.success) {
      throw new BadRequestException(`Failed to send email: ${result.error}`);
    }

    return {
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully',
    };
  }
}
