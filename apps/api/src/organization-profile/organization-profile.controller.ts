import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  HttpException,
  HttpStatus,
  Logger,
  Res,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { OrganizationProfileService } from './organization-profile.service';
import { EmailService } from '../email/email.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'organization');

@Controller('organization-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationProfileController {
  private readonly logger = new Logger(OrganizationProfileController.name);

  constructor(
    private readonly orgProfileService: OrganizationProfileService,
    private readonly emailService: EmailService,
  ) {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  @Get()
  @Roles('ADMIN', 'STAFF')
  async getProfile() {
    return this.orgProfileService.getProfile();
  }

  @Get('public')
  @Public()
  async getPublicProfile() {
    const profile = await this.orgProfileService.getProfile();
    if (!profile) {
      return null;
    }
    return {
      name: profile.name,
      tagline1: profile.tagline1,
      tagline2: profile.tagline2,
      logoUrl: profile.logoUrl,
      brandingPrimaryColor: profile.brandingPrimaryColor,
      phone1: profile.phone1,
      phone2: profile.phone2,
      email: profile.email,
      website: profile.website,
      pan: profile.pan,
      section80GText: profile.section80GText,
      homes: profile.homes,
    };
  }

  @Put()
  @Roles('ADMIN')
  async updateProfile(
    @Body() data: {
      name?: string;
      tagline1?: string;
      tagline2?: string;
      logoUrl?: string;
      brandingPrimaryColor?: string;
      reportHeaderText?: string;
      reportFooterText?: string;
      signatureImageUrl?: string;
      phone1?: string;
      phone2?: string;
      email?: string;
      website?: string;
      pan?: string;
      section80GText?: string;
      homes?: string[];
    },
  ) {
    return this.orgProfileService.updateProfile(data);
  }

  @Post('upload-logo')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new HttpException('Only PNG, JPEG, WebP, and SVG images are allowed', HttpStatus.BAD_REQUEST);
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new HttpException('File size must be under 5MB', HttpStatus.BAD_REQUEST);
    }

    const ext = path.extname(file.originalname) || '.png';
    const filename = `logo_${Date.now()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filepath, file.buffer);

    const logoUrl = `/api/organization-profile/files/${filename}`;
    await this.orgProfileService.updateProfile({ logoUrl });

    this.logger.log(`Logo uploaded: ${filename}`);
    return { logoUrl };
  }

  @Post('upload-signature')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSignature(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new HttpException('Only PNG, JPEG, and WebP images are allowed', HttpStatus.BAD_REQUEST);
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new HttpException('File size must be under 2MB', HttpStatus.BAD_REQUEST);
    }

    const ext = path.extname(file.originalname) || '.png';
    const filename = `signature_${Date.now()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filepath, file.buffer);

    const signatureImageUrl = `/api/organization-profile/files/${filename}`;
    await this.orgProfileService.updateProfile({ signatureImageUrl });

    this.logger.log(`Signature uploaded: ${filename}`);
    return { signatureImageUrl };
  }

  @Get('files/:filename')
  @Public()
  async serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const safeName = path.basename(filename);
    const filepath = path.join(UPLOAD_DIR, safeName);

    if (!fs.existsSync(filepath)) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }

    const ext = path.extname(safeName).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };

    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(filepath).pipe(res);
  }

  @Get('email-settings')
  @Roles('ADMIN')
  async getEmailSettings() {
    const profile = await this.orgProfileService.getProfile();
    const configStatus = this.emailService.getConfigStatus();
    
    return {
      enableAutoEmail: profile.enableAutoEmail,
      smtpHost: profile.smtpHost,
      smtpPort: profile.smtpPort,
      smtpUser: profile.smtpUser,
      smtpSecureTls: profile.smtpSecureTls,
      emailFromName: profile.emailFromName,
      emailFromEmail: profile.emailFromEmail,
      hasPassword: !!profile.smtpPass,
      envConfigured: configStatus.configured,
      envSmtpUser: configStatus.smtpUser,
      envSmtpHost: configStatus.smtpHost,
    };
  }

  @Put('email-settings')
  @Roles('ADMIN')
  async updateEmailSettings(
    @Body() data: {
      enableAutoEmail?: boolean;
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPass?: string;
      smtpSecureTls?: boolean;
      emailFromName?: string;
      emailFromEmail?: string;
    },
  ) {
    if (data.emailFromEmail) {
      const plainEmailRegex = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
      const hasNameFormat = /<[^>]+>/.test(data.emailFromEmail);
      
      if (hasNameFormat || !plainEmailRegex.test(data.emailFromEmail)) {
        throw new HttpException(
          'From Email must be a plain email address (e.g., noreply@example.com). Do not include name or angle brackets.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      this.orgProfileService.clearCache();
      
      const result = await this.orgProfileService.updateProfile(data);
      
      return {
        success: true,
        message: 'Email settings saved successfully',
        enableAutoEmail: result.enableAutoEmail,
        smtpHost: result.smtpHost,
        smtpPort: result.smtpPort,
        smtpUser: result.smtpUser,
        smtpSecureTls: result.smtpSecureTls,
        emailFromName: result.emailFromName,
        emailFromEmail: result.emailFromEmail,
        hasPassword: !!result.smtpPass,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Failed to save email settings: ${errorMsg}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test-email')
  @Roles('ADMIN')
  async testEmail(@Body() data: { testEmail: string }) {
    const configStatus = this.emailService.getConfigStatus();
    
    if (!configStatus.configured) {
      return { 
        success: false, 
        error: `Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables. ${configStatus.error || ''}` 
      };
    }

    this.logger.log(`Sending test email to ${data.testEmail} using SMTP_USER: ${configStatus.smtpUser}`);

    try {
      const profile = await this.orgProfileService.getProfile();
      
      const result = await this.emailService.sendEmail({
        to: data.testEmail,
        subject: `Test Email from ${profile.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>This is a test email from <strong>${profile.name}</strong>.</p>
            <p>If you received this email, your SMTP settings are configured correctly.</p>
            <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Sent via SMTP_USER: ${configStatus.smtpUser}<br/>
              SMTP_HOST: ${configStatus.smtpHost}
            </p>
          </div>
        `,
        text: `This is a test email from ${profile.name}.\n\nIf you received this email, your SMTP settings are configured correctly.\n\nSent via SMTP_USER: ${configStatus.smtpUser}`,
        featureType: 'TEST',
      });

      if (result.success) {
        return { success: true, message: `Test email sent successfully via ${configStatus.smtpUser}` };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Test email failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  @Get('email-config-status')
  @Roles('ADMIN')
  async getEmailConfigStatus() {
    return this.emailService.getConfigStatus();
  }

  @Get('donation-notification-settings')
  @Roles('ADMIN')
  async getDonationNotificationSettings() {
    const profile = await this.orgProfileService.getProfile();
    const configStatus = this.emailService.getConfigStatus();
    return {
      enableDonationEmail: profile.enableDonationEmail,
      enableDonationWhatsApp: profile.enableDonationWhatsApp,
      enablePledgeWhatsApp: profile.enablePledgeWhatsApp,
      enableSpecialDayWhatsApp: profile.enableSpecialDayWhatsApp,
      enableFollowUpWhatsApp: profile.enableFollowUpWhatsApp,
      emailConfigured: configStatus.configured,
    };
  }

  @Put('donation-notification-settings')
  @Roles('ADMIN')
  async updateDonationNotificationSettings(
    @Body() data: {
      enableDonationEmail?: boolean;
      enableDonationWhatsApp?: boolean;
      enablePledgeWhatsApp?: boolean;
      enableSpecialDayWhatsApp?: boolean;
      enableFollowUpWhatsApp?: boolean;
    },
  ) {
    this.orgProfileService.clearCache();
    const result = await this.orgProfileService.updateProfile(data);
    return {
      success: true,
      enableDonationEmail: result.enableDonationEmail,
      enableDonationWhatsApp: result.enableDonationWhatsApp,
      enablePledgeWhatsApp: result.enablePledgeWhatsApp,
      enableSpecialDayWhatsApp: result.enableSpecialDayWhatsApp,
      enableFollowUpWhatsApp: result.enableFollowUpWhatsApp,
    };
  }
}
