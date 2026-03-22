import { EmailJobsService } from './email-jobs.service';
import { EmailService } from '../email/email.service';
export declare class EmailSenderCron {
    private emailJobsService;
    private emailService;
    private readonly logger;
    constructor(emailJobsService: EmailJobsService, emailService: EmailService);
    sendPendingEmails(): Promise<void>;
}
