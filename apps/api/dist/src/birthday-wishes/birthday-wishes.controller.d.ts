import { BirthdayWishService } from './birthday-wishes.service';
export declare class BirthdayWishController {
    private readonly birthdayWishService;
    constructor(birthdayWishService: BirthdayWishService);
    getUpcoming(range?: string): Promise<import("./birthday-wishes.service").DonorBirthdayResult[]>;
    getUpcomingBeneficiaries(range?: string): Promise<any[]>;
    getPreview(donorId: string): Promise<import("./birthday-wishes.service").DonorBirthdayResult>;
    queueEmail(donorId: string, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    sendBeneficiaryWish(beneficiaryId: string, user: any): Promise<{
        success: boolean;
        message: string;
        sent: number;
    }>;
    markSent(donorId: string, channel: 'EMAIL' | 'WHATSAPP', user: any): Promise<{
        success: boolean;
    }>;
    getSentLog(page?: string, limit?: string): Promise<{
        logs: any;
        total: any;
        page: number;
        totalPages: number;
    }>;
    getTemplates(): Promise<any>;
    updateTemplate(id: string, body: {
        subject?: string;
        body: string;
    }, user: any): Promise<any>;
}
