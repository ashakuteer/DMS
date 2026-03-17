import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import { OrganizationProfileService, OrganizationProfileData } from '../organization-profile/organization-profile.service';
import { resolveLogoPath } from '../common/pdf-branding';
import { DonationEmailType, getDonationEmailTemplate } from './templates/donation.templates';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export type EmailFeatureType = 'TEST' | 'AUTO' | 'PLEDGE' | 'SPECIALDAY' | 'RECEIPT' | 'QUEUE' | 'MANUAL' | 'RELAY';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  featureType?: EmailFeatureType;
}

export interface EmailConfigStatus {
  configured: boolean;
  smtpUser?: string;
  smtpHost?: string;
  fromEmail?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private configStatus: EmailConfigStatus = { configured: false };

  constructor(private orgProfileService: OrganizationProfileService) {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter using ONLY environment variables:
   * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
   */
  private emailRelayUrl: string | null = null;
  private emailRelaySecret: string | null = null;

  private initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    this.emailRelayUrl = process.env.EMAIL_RELAY_URL || null;
    this.emailRelaySecret = process.env.EMAIL_RELAY_SECRET || process.env.SESSION_SECRET || null;

    if (this.emailRelayUrl) {
      this.logger.log(`=== EMAIL RELAY MODE ===`);
      this.logger.log(`Relay URL: ${this.emailRelayUrl}`);
      this.configStatus = {
        configured: true,
        smtpUser: smtpUser || 'relay',
        smtpHost: 'relay',
        fromEmail: smtpFrom,
      };
      return;
    }

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        tls: { rejectUnauthorized: false },
      } as any);

      this.configStatus = {
        configured: true,
        smtpUser,
        smtpHost,
        fromEmail: smtpFrom,
      };

      this.logger.log(`=== EMAIL TRANSPORT INITIALIZED ===`);
      this.logger.log(`SMTP Host: ${smtpHost}`);
      this.logger.log(`SMTP Port: ${smtpPort}`);
      this.logger.log(`SMTP User: ${smtpUser}`);
      this.logger.log(`From Email: ${smtpFrom}`);
      this.logger.log(`===================================`);
    } else {
      const missing: string[] = [];
      if (!smtpHost) missing.push('SMTP_HOST');
      if (!smtpUser) missing.push('SMTP_USER');
      if (!smtpPass) missing.push('SMTP_PASS');

      this.configStatus = {
        configured: false,
        error: `Missing required environment variables: ${missing.join(', ')}`,
      };

      this.logger.warn(`=== EMAIL NOT CONFIGURED ===`);
      this.logger.warn(`Missing: ${missing.join(', ')}`);
      this.logger.warn(`Emails will be logged but not sent.`);
      this.logger.warn(`============================`);
    }
  }

  /**
   * Reinitialize transporter (useful if env vars change at runtime)
   */
  reinitialize() {
    this.transporter = null;
    this.initializeTransporter();
  }

  getConfigStatus(): EmailConfigStatus {
    return this.configStatus;
  }

  isConfigured(): boolean {
    return this.configStatus.configured;
  }

  getSmtpUser(): string | undefined {
    return this.configStatus.smtpUser;
  }

  getMaskedSmtpUser(): string {
    const user = this.configStatus.smtpUser;
    if (!user) return 'NOT_CONFIGURED';
    if (user.length <= 4) return '****';
    return user.substring(0, 3) + '***' + user.substring(user.length - 4);
  }

  private async sendViaRelay(options: EmailOptions & { inlineAttachments?: any[] }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.emailRelayUrl) return { success: false, error: 'No relay URL configured' };
    const featureType = options.featureType || 'UNKNOWN';
    try {
      this.logger.log(`[${featureType}] Sending email via relay to ${options.to}`);
      const payload: any = {
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };
      if (options.attachments?.length) {
        payload.attachments = options.attachments.map(att => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
          contentType: att.contentType,
          encoding: 'base64',
        }));
      }
      const res = await fetch(this.emailRelayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Relay-Secret': this.emailRelaySecret || '',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });
      const result = await res.json() as any;
      if (result.success) {
        this.logger.log(`[${featureType}] Relay email sent to ${options.to}, messageId: ${result.messageId}`);
      } else {
        this.logger.error(`[${featureType}] Relay email failed: ${result.error}`);
      }
      return result;
    } catch (err: any) {
      this.logger.error(`[${featureType}] Relay error: ${err?.message}`);
      return { success: false, error: err?.message || 'Relay failed' };
    }
  }

  private buildFromAddress(orgName?: string): string {
    const rawFrom = process.env.SMTP_FROM || process.env.SMTP_USER || '';
    const fromName = orgName || 'NGO DMS';
    const angleMatch = rawFrom.match(/<([^>]+)>/);
    const plainEmail = angleMatch ? angleMatch[1].trim() : rawFrom.trim();
    if (!plainEmail) return fromName;
    return `"${fromName}" <${plainEmail}>`;
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (this.emailRelayUrl) {
      const relayResult = await this.sendViaRelay(options);
      if (relayResult.success) return relayResult;
      // Relay failed — fall through to direct SMTP if configured
      this.logger.warn(`[${options.featureType || 'UNKNOWN'}] Relay failed (${relayResult.error}), falling back to direct SMTP`);
    }

    const org = await this.orgProfileService.getProfile();
    const featureType = options.featureType || 'UNKNOWN';
    const maskedUser = this.getMaskedSmtpUser();
    
    const fromAddress = this.buildFromAddress(org.name);

    if (!this.transporter) {
      this.logger.log(`[${featureType}] [Email Mock] To: ${options.to}, SMTP_USER: ${maskedUser}`);
      this.logger.log(`[${featureType}] Subject: ${options.subject}`);
      this.logger.log(`[${featureType}] From: ${fromAddress}`);
      this.logger.log(`[${featureType}] Attachments: ${options.attachments?.map(a => a.filename).join(', ') || 'none'}`);
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    try {
      this.logger.log(`[${featureType}] Sending email to ${options.to} via SMTP_USER: ${maskedUser}`);
      
      const mailOptions: nodemailer.SendMailOptions = {
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`[${featureType}] Email sent successfully to ${options.to}, messageId: ${info.messageId}, SMTP_USER: ${maskedUser}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[${featureType}] Failed to send email to ${options.to}: ${errorMessage}, SMTP_USER: ${maskedUser}`);
      return { success: false, error: errorMessage };
    }
  }

  async wrapWithBranding(bodyHtml: string): Promise<string> {
    const org = await this.orgProfileService.getProfile();
    const phoneDisplay = org.phone2 ? `${org.phone1} / ${org.phone2}` : org.phone1;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${bodyHtml}
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #cccccc; font-size: 13px; color: #666666;">
          <p style="margin: 0;">With heartfelt gratitude,</p>
          <p style="margin: 5px 0 15px 0;"><strong>${org.name}</strong></p>
          <p style="margin: 0;">Phone: ${phoneDisplay}</p>
          <p style="margin: 0;">Email: ${org.email}</p>
          <p style="margin: 0;">Website: ${org.website}</p>
        </div>
      </div>
    `;
  }

  async sendReminderEmail(
    toEmail: string,
    donorName: string,
    reminderType: 'BIRTHDAY' | 'ANNIVERSARY' | 'MEMORIAL' | 'FOLLOW_UP' | 'FAMILY_BIRTHDAY' | 'PLEDGE',
    relatedPersonName?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const org = await this.orgProfileService.getProfile();
    const phoneDisplay = org.phone2 ? `${org.phone1} / ${org.phone2}` : org.phone1;

    let subject: string;
    let bodyText: string;

    switch (reminderType) {
      case 'BIRTHDAY':
      case 'FAMILY_BIRTHDAY':
        subject = `Warm wishes from ${org.name}`;
        bodyText = `Dear ${donorName},

Wishing ${relatedPersonName ? relatedPersonName : 'you'} a very happy birthday!

May this special day bring you joy, happiness, and all the blessings you deserve. Your support for ${org.name} has touched many lives, and we are grateful to have you as part of our family.

On this occasion, we send our warmest wishes and prayers for health, prosperity, and happiness in the year ahead.`;
        break;
      case 'ANNIVERSARY':
        subject = `Warm wishes from ${org.name}`;
        bodyText = `Dear ${donorName},

Wishing you a very happy anniversary!

May this special milestone in your journey together be filled with love, joy, and beautiful memories. Your continued support for ${org.name} has been a blessing, and we cherish your association with us.

We pray for your togetherness to grow stronger with each passing year.`;
        break;
      case 'MEMORIAL':
        const personName = relatedPersonName || 'your loved one';
        subject = `Remembering with gratitude – ${org.name}`;
        bodyText = `Dear ${donorName},

As we remember ${personName} on this day, we want you to know that our thoughts and prayers are with you and your family.

The memories of our loved ones live on in our hearts forever. May you find peace and comfort knowing that their legacy continues to inspire and guide us.

We are honored to have your trust and support at ${org.name}.`;
        break;
      case 'PLEDGE':
        subject = `Gentle reminder of your pledge – ${org.name}`;
        bodyText = `Dear ${donorName},

We hope this message finds you well. This is a gentle reminder about the pledge you made to support ${org.name}.

Your commitment means the world to us and to the lives we serve together. When you're ready to fulfill your pledge, please feel free to reach out to us.

If you have any questions or would like to discuss this further, we are here to help.`;
        break;
      case 'FOLLOW_UP':
      default:
        subject = `Greetings from ${org.name}`;
        bodyText = `Dear ${donorName},

We hope this message finds you well. At ${org.name}, we are deeply grateful for your continued support and generosity.

Your contributions have been instrumental in bringing hope and positive change to countless lives. We wanted to reach out and share our heartfelt appreciation for being part of our mission.

If you would like to learn more about our recent activities or explore ways to continue making a difference, please feel free to contact us.`;
        break;
    }

    const text = `${bodyText}

With heartfelt gratitude,
${org.name}

Phone: ${phoneDisplay}
Email: ${org.email}
Website: ${org.website}

(This is an automated email. Please do not reply.)`;

    const featureType = reminderType === 'PLEDGE' ? 'PLEDGE' : 'SPECIALDAY';
    return this.sendEmail({
      to: toEmail,
      subject,
      html: text,
      text,
      featureType,
    });
  }

  async sendDonationReceipt(
    toEmail: string,
    donorName: string,
    receiptNumber: string,
    pdfBuffer: Buffer,
    options?: {
      emailType?: DonationEmailType;
      donationAmount?: number;
      currency?: string;
      donationDate?: Date;
      donationMode?: string;
      donationType?: string;
      donorPAN?: string;
      kindDescription?: string;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const org = await this.orgProfileService.getProfile();
    const logoFilePath = resolveLogoPath(org.logoUrl || null);

    const emailType: DonationEmailType = options?.emailType || 'GENERAL';

    const template = getDonationEmailTemplate(emailType, {
      donorName,
      receiptNumber,
      donationAmount: options?.donationAmount,
      currency: options?.currency,
      donationDate: options?.donationDate,
      donationMode: options?.donationMode,
      donationType: options?.donationType,
      donorPAN: options?.donorPAN,
      kindDescription: options?.kindDescription,
      org: {
        name: org.name,
        phone1: org.phone1 || undefined,
        phone2: org.phone2 || undefined,
        email: org.email || undefined,
        website: org.website || undefined,
        tagline1: org.tagline1 || undefined,
        tagline2: org.tagline2 || undefined,
      },
    });

    const attachments: EmailAttachment[] = [
      {
        filename: `Receipt-${receiptNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ];

    const inlineAttachments: Array<{ filename: string; content: Buffer; cid: string; contentType: string }> = [];
    if (logoFilePath) {
      try {
        const logoBuffer = fs.readFileSync(logoFilePath);
        inlineAttachments.push({
          filename: 'logo.jpg',
          content: logoBuffer,
          cid: 'orglogo',
          contentType: 'image/jpeg',
        });
      } catch (e) {
        this.logger.warn(`Could not read logo file: ${e}`);
      }
    }

    return this.sendEmailWithInline({
      to: toEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      attachments,
      inlineAttachments,
      featureType: 'RECEIPT',
    });
  }

  private async sendEmailWithInline(options: EmailOptions & {
    inlineAttachments?: Array<{ filename: string; content: Buffer; cid: string; contentType: string }>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (this.emailRelayUrl) {
      const relayResult = await this.sendViaRelay(options);
      if (relayResult.success) return relayResult;
      this.logger.warn(`[${options.featureType || 'UNKNOWN'}] Relay failed (${relayResult.error}), falling back to direct SMTP`);
    }

    const org = await this.orgProfileService.getProfile();
    const featureType = options.featureType || 'UNKNOWN';
    const maskedUser = this.getMaskedSmtpUser();
    
    const fromAddress = this.buildFromAddress(org.name);

    if (!this.transporter) {
      this.logger.log(`[${featureType}] [Email Mock] To: ${options.to}, SMTP_USER: ${maskedUser}`);
      this.logger.log(`[${featureType}] Subject: ${options.subject}`);
      this.logger.log(`[${featureType}] From: ${fromAddress}`);
      this.logger.log(`[${featureType}] Attachments: ${options.attachments?.map(a => a.filename).join(', ') || 'none'}`);
      this.logger.log(`[${featureType}] Inline attachments: ${options.inlineAttachments?.map(a => a.cid).join(', ') || 'none'}`);
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    try {
      this.logger.log(`[${featureType}] Sending email to ${options.to} via SMTP_USER: ${maskedUser}`);
      
      const nodeAttachments: nodemailer.SendMailOptions['attachments'] = [];

      if (options.attachments) {
        for (const att of options.attachments) {
          nodeAttachments.push({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
          });
        }
      }

      if (options.inlineAttachments) {
        for (const inl of options.inlineAttachments) {
          nodeAttachments.push({
            filename: inl.filename,
            content: inl.content,
            contentType: inl.contentType,
            cid: inl.cid,
            contentDisposition: 'inline',
          });
        }
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: nodeAttachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`[${featureType}] Email sent successfully to ${options.to}, messageId: ${info.messageId}, SMTP_USER: ${maskedUser}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[${featureType}] Failed to send email to ${options.to}: ${errorMessage}, SMTP_USER: ${maskedUser}`);
      return { success: false, error: errorMessage };
    }
  }
}
