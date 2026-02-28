import { Controller, Get, Post, Delete, Param, Query, UseGuards, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { EmailJobsService, EmailJobFilters } from './email-jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, EmailJobStatus, EmailJobType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { EmailService } from '../email/email.service';

interface UserContext {
  id: string;
  email: string;
  role: Role;
}

@Controller('email-jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmailJobsController {
  private readonly logger = new Logger(EmailJobsController.name);

  constructor(
    private readonly emailJobsService: EmailJobsService,
    private readonly prisma: PrismaService,
    private readonly orgProfileService: OrganizationProfileService,
    private readonly communicationLogService: CommunicationLogService,
    private readonly emailService: EmailService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  async findAll(
    @Query('status') status?: EmailJobStatus,
    @Query('type') type?: EmailJobType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: EmailJobFilters = {
      status,
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    };
    return this.emailJobsService.findAll(filters);
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  async getStats() {
    return this.emailJobsService.getStats();
  }

  @Post(':id/retry')
  @Roles(Role.ADMIN)
  async retry(@Param('id') id: string) {
    return this.emailJobsService.retryFailed(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string) {
    return this.emailJobsService.delete(id);
  }

  @Post('queue')
  @Roles(Role.ADMIN, Role.STAFF)
  async queueEmail(
    @CurrentUser() user: UserContext,
    @Body() body: {
      donorId: string;
      type: 'special_day' | 'pledge';
      occasionType?: string;
      pledgeId?: string;
      relatedPersonName?: string;
    },
  ) {
    try {
      const org = await this.orgProfileService.getProfile();
      
      // Use EmailService to check SMTP configuration from environment variables
      if (!this.emailService.isConfigured()) {
        const configStatus = this.emailService.getConfigStatus();
        throw new HttpException(
          `Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables. ${configStatus.error || ''}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      
      const featureType = body.type === 'special_day' ? 'SPECIALDAY' : 'PLEDGE';
      this.logger.log(`[${featureType}] Queueing email for donor ${body.donorId}, SMTP_USER: ${this.emailService.getSmtpUser()}`);

      // Get donor details
      const donor = await this.prisma.donor.findUnique({
        where: { id: body.donorId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          personalEmail: true,
          officialEmail: true,
          prefEmail: true,
        },
      });

      if (!donor) {
        throw new HttpException('Donor not found', HttpStatus.NOT_FOUND);
      }

      const email = donor.prefEmail
        ? (donor.personalEmail || donor.officialEmail)
        : (donor.officialEmail || donor.personalEmail);

      if (!email) {
        throw new HttpException(
          'No email address on file for this donor',
          HttpStatus.BAD_REQUEST,
        );
      }

      const donorName = `${donor.firstName}${donor.lastName ? ' ' + donor.lastName : ''}`;
      
      let subject = '';
      let emailBody = '';
      let emailJobType: EmailJobType;
      let relatedId = '';

      if (body.type === 'special_day') {
        emailJobType = 'SPECIAL_DAY';
        const occasionLabel = this.getOccasionLabel(body.occasionType || '');
        const personName = body.relatedPersonName || donorName;
        
        subject = `${occasionLabel} Wishes from ${org.name}`;
        emailBody = this.getSpecialDayEmailBody(body.occasionType || '', personName, donorName, org.name);
        relatedId = `${body.occasionType || 'special'}_${body.donorId}_${new Date().toISOString().split('T')[0]}`;
      } else if (body.type === 'pledge') {
        emailJobType = 'PLEDGE_REMINDER';
        
        if (body.pledgeId) {
          const pledge = await this.prisma.pledge.findUnique({
            where: { id: body.pledgeId },
          });
          
          // Validate pledgeId belongs to the donor
          if (pledge && pledge.donorId !== body.donorId) {
            throw new HttpException(
              'Pledge does not belong to this donor',
              HttpStatus.BAD_REQUEST,
            );
          }
          
          relatedId = body.pledgeId;
          
          const pledgeDesc = pledge?.quantity || 
            (pledge?.amount ? `₹${Number(pledge.amount).toLocaleString('en-IN')}` : 'your pledge');
          
          subject = `Reminder: Your Pledge to ${org.name}`;
          emailBody = `<p>Dear ${donorName},</p>
<p>This is a gentle reminder about your pledge of ${pledgeDesc} to ${org.name}.</p>
<p>Your continued support helps us make a positive impact in the lives of those we serve. We truly appreciate your commitment to our mission.</p>
<p>If you have already fulfilled this pledge, please disregard this message.</p>
<p>With heartfelt gratitude,<br/>${org.name}</p>`;
        } else {
          subject = `Reminder: Your Pledge to ${org.name}`;
          emailBody = `<p>Dear ${donorName},</p>
<p>This is a gentle reminder about your pledge to ${org.name}.</p>
<p>Your continued support helps us make a positive impact in the lives of those we serve.</p>
<p>With heartfelt gratitude,<br/>${org.name}</p>`;
          relatedId = `pledge_${body.donorId}_${new Date().toISOString().split('T')[0]}`;
        }
      } else {
        throw new HttpException('Invalid email type', HttpStatus.BAD_REQUEST);
      }

      // Queue the email job
      const job = await this.emailJobsService.create({
        donorId: donor.id,
        toEmail: email,
        subject,
        body: emailBody,
        type: emailJobType,
        relatedId,
        scheduledAt: new Date(),
      });

      // Log the communication
      await this.communicationLogService.create({
        donorId: donor.id,
        channel: 'EMAIL',
        type: body.type === 'special_day' ? 'GREETING' : 'FOLLOW_UP',
        status: 'TRIGGERED',
        recipient: email,
        subject,
        messagePreview: emailBody.replace(/<[^>]*>/g, '').substring(0, 200),
        sentById: user.id,
      });

      return {
        success: true,
        message: `Email queued for ${donorName}`,
        jobId: job.id,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Failed to queue email: ${errorMsg}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getOccasionLabel(occasionType: string): string {
    const labels: Record<string, string> = {
      DOB_SELF: 'Birthday',
      DOB_SPOUSE: 'Birthday',
      DOB_CHILD: 'Birthday',
      ANNIVERSARY: 'Anniversary',
      DEATH_ANNIVERSARY: 'Memorial',
      OTHER: 'Special Day',
    };
    return labels[occasionType] || 'Special Day';
  }

  private getSpecialDayEmailBody(occasionType: string, personName: string, donorName: string, orgName: string): string {
    switch (occasionType) {
      case 'DOB_SELF':
        return `<p>Dear ${donorName},</p>
<p>Wishing you a wonderful Birthday! May this special day bring you joy, happiness, and all your heart's desires.</p>
<p>Thank you for being a part of the ${orgName} family. Your support continues to make a difference in the lives of many.</p>
<p>With warm wishes,<br/>${orgName}</p>`;
      
      case 'DOB_SPOUSE':
      case 'DOB_CHILD':
        return `<p>Dear ${donorName},</p>
<p>Wishing ${personName} a very Happy Birthday! May this special day be filled with joy and cherished moments.</p>
<p>Thank you for your continued support of ${orgName}.</p>
<p>With warm wishes,<br/>${orgName}</p>`;
      
      case 'ANNIVERSARY':
        return `<p>Dear ${donorName},</p>
<p>Wishing you a very Happy Anniversary! May your bond continue to grow stronger with each passing year.</p>
<p>Thank you for your continued support of ${orgName}.</p>
<p>With warm wishes,<br/>${orgName}</p>`;
      
      case 'DEATH_ANNIVERSARY':
        return `<p>Dear ${donorName},</p>
<p>On this day, we hold you and your family in our thoughts and prayers. May you find comfort in cherished memories.</p>
<p>With heartfelt condolences,<br/>${orgName}</p>`;
      
      default:
        return `<p>Dear ${donorName},</p>
<p>Wishing you a wonderful day from all of us at ${orgName}.</p>
<p>Thank you for your continued support.</p>
<p>With warm wishes,<br/>${orgName}</p>`;
    }
  }
}
