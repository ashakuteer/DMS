import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailJobsService } from './email-jobs.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class EmailSenderCron {
  private readonly logger = new Logger(EmailSenderCron.name);

  constructor(
    private emailJobsService: EmailJobsService,
    private emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendPendingEmails() {
    this.logger.log('Checking for pending email jobs...');
    
    try {
      if (!this.emailService.isConfigured()) {
        this.logger.warn('Email not configured (missing SMTP_HOST, SMTP_USER, SMTP_PASS). Skipping email queue processing.');
        return;
      }

      const smtpUser = this.emailService.getSmtpUser();
      this.logger.log(`Email queue processing using SMTP_USER: ${smtpUser}`);

      const pendingJobs = await this.emailJobsService.findPendingJobs(20);
      this.logger.log(`Found ${pendingJobs.length} pending email jobs`);

      for (const job of pendingJobs) {
        try {
          // Determine feature type from job type
          const featureType = job.type === 'PLEDGE_REMINDER' ? 'PLEDGE' : 
                              job.type === 'SPECIAL_DAY' ? 'SPECIALDAY' : 'QUEUE';
          
          this.logger.log(`[${featureType}] Sending queued email ${job.id} to ${job.toEmail}`);
          
          const result = await this.emailService.sendEmail({
            to: job.toEmail,
            subject: job.subject,
            html: job.body,
            text: job.body.replace(/<[^>]*>/g, ''),
            featureType,
          });

          if (result.success) {
            await this.emailJobsService.markSent(job.id);
            this.logger.log(`Email sent successfully: ${job.id} to ${job.toEmail}`);
          } else {
            await this.emailJobsService.markFailed(job.id, result.error || 'Unknown error');
            this.logger.error(`Failed to send email ${job.id}: ${result.error}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          await this.emailJobsService.markFailed(job.id, errorMsg);
          this.logger.error(`Failed to send email ${job.id}: ${errorMsg}`);
        }
      }
    } catch (error) {
      this.logger.error(`Email sender cron error: ${error}`);
    }
  }
}
