import { EmailService } from './email.service';
export declare class EmailRelayController {
    private readonly emailService;
    constructor(emailService: EmailService);
    relaySend(body: any, req: any): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
}
