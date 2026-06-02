import { PrismaService } from '../prisma/prisma.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
interface UserContext {
    userId: string;
    role: string;
}
export interface DonorBirthdayResult {
    donorId: string;
    donorCode: string;
    donorName: string;
    firstName: string;
    lastName: string | null;
    dobDay: number;
    dobMonth: number;
    daysUntil: number;
    isToday: boolean;
    hasEmail: boolean;
    hasWhatsApp: boolean;
    personalEmail: string | null;
    officialEmail: string | null;
    whatsappPhone: string | null;
    beneficiaries: {
        id: string;
        name: string;
        homeType: string;
        privacyProtected: boolean;
    }[];
    whatsappText: string;
    emailSubject: string;
    emailHtml: string;
    imageUrl: string | null;
}
export declare class BirthdayWishService {
    private prisma;
    private emailJobsService;
    private communicationLogService;
    private orgProfileService;
    private readonly logger;
    constructor(prisma: PrismaService, emailJobsService: EmailJobsService, communicationLogService: CommunicationLogService, orgProfileService: OrganizationProfileService);
    getUpcomingBirthdays(range?: 'today' | 'next7'): Promise<DonorBirthdayResult[]>;
    getWishPreview(donorId: string): Promise<DonorBirthdayResult | null>;
    queueBirthdayEmail(donorId: string, user: UserContext): Promise<{
        success: boolean;
        message: string;
    }>;
    markSent(donorId: string, channel: 'EMAIL' | 'WHATSAPP', user: UserContext): Promise<{
        success: boolean;
    }>;
    getUpcomingBeneficiaryBirthdays(range?: 'today' | 'next7'): Promise<any[]>;
    sendBeneficiaryBirthdayWish(beneficiaryId: string, user: UserContext): Promise<{
        success: boolean;
        message: string;
        sent: number;
    }>;
    getSentLog(page?: number, limit?: number): Promise<{
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
    private buildBirthdayIntro;
    getTemplates(): Promise<{
        variables: string[];
        id: string;
        updatedAt: Date;
        subject: string | null;
        channel: import(".prisma/client").$Enums.MessageChannel;
        updatedById: string | null;
        body: string;
        key: string;
    }[]>;
    updateTemplate(id: string, data: {
        subject?: string;
        body: string;
    }, userId: string): Promise<{
        id: string;
        updatedAt: Date;
        subject: string | null;
        channel: import(".prisma/client").$Enums.MessageChannel;
        updatedById: string | null;
        body: string;
        key: string;
    }>;
    private calculateDaysUntil;
    private buildBeneficiaryLine;
    private formatHomeType;
    private findEligiblePhoto;
    private getTemplate;
    private renderTemplate;
    private ensureBirthdayTask;
}
export {};
