import { RemindersService } from './reminders.service';
export declare class RemindersController {
    private remindersService;
    constructor(remindersService: RemindersService);
    getDueReminders(): Promise<any>;
    markComplete(id: string, req: any): Promise<any>;
    snooze(id: string, req: any): Promise<any>;
    logAction(id: string, body: {
        donorId: string;
        donationId?: string;
        action: 'send_email' | 'send_whatsapp';
    }, req: any): Promise<any>;
}
