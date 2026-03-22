"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailSenderCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSenderCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const email_jobs_service_1 = require("./email-jobs.service");
const email_service_1 = require("../email/email.service");
let EmailSenderCron = EmailSenderCron_1 = class EmailSenderCron {
    constructor(emailJobsService, emailService) {
        this.emailJobsService = emailJobsService;
        this.emailService = emailService;
        this.logger = new common_1.Logger(EmailSenderCron_1.name);
    }
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
                    }
                    else {
                        await this.emailJobsService.markFailed(job.id, result.error || 'Unknown error');
                        this.logger.error(`Failed to send email ${job.id}: ${result.error}`);
                    }
                }
                catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    await this.emailJobsService.markFailed(job.id, errorMsg);
                    this.logger.error(`Failed to send email ${job.id}: ${errorMsg}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`Email sender cron error: ${error}`);
        }
    }
};
exports.EmailSenderCron = EmailSenderCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailSenderCron.prototype, "sendPendingEmails", null);
exports.EmailSenderCron = EmailSenderCron = EmailSenderCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_jobs_service_1.EmailJobsService,
        email_service_1.EmailService])
], EmailSenderCron);
//# sourceMappingURL=email-sender.cron.js.map