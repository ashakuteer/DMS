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
        logs: {
            id: string;
            type: import(".prisma/client").$Enums.OutboundMessageType;
            channel: import(".prisma/client").$Enums.MessageChannel;
            donorId: string;
            donorName: string;
            donorCode: string;
            beneficiaryIds: string[];
            status: import(".prisma/client").$Enums.OutboundMessageStatus;
            createdAt: Date;
            createdBy: string;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getTemplates(): Promise<{
        variables: string[];
        id: string;
        updatedAt: Date;
        subject: string | null;
        body: string;
        channel: import(".prisma/client").$Enums.MessageChannel;
        updatedById: string | null;
        key: string;
    }[]>;
    updateTemplate(id: string, body: {
        subject?: string;
        body: string;
    }, user: any): Promise<{
        id: string;
        updatedAt: Date;
        subject: string | null;
        body: string;
        channel: import(".prisma/client").$Enums.MessageChannel;
        updatedById: string | null;
        key: string;
    }>;
}
