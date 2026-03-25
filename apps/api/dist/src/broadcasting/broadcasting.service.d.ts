import { PrismaService } from '../prisma/prisma.service';
import { CommunicationsService } from '../communications/communications.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
export interface BroadcastFilters {
    gender?: string;
    religion?: string;
    city?: string;
    country?: string;
    category?: string;
    donationFrequency?: string;
    donationFrequencies?: string[];
    assignedToUserId?: string;
    supportPreferences?: string[];
    engagementLevel?: string;
    healthStatus?: string;
    ageMin?: number;
    ageMax?: number;
    professions?: string[];
    donationCategories?: string[];
    sponsorshipTypes?: string[];
    donationAmountMin?: number;
    donationAmountMax?: number;
}
export interface BroadcastRequest {
    channel: 'WHATSAPP' | 'EMAIL';
    filters: BroadcastFilters;
    contentSid?: string;
    contentVariables?: Record<string, string>;
    emailSubject?: string;
    emailBody?: string;
}
export interface BroadcastResult {
    total: number;
    sent: number;
    failed: number;
    skipped: number;
    details: {
        donorId: string;
        donorName: string;
        status: string;
        error?: string;
    }[];
}
export declare class BroadcastingService {
    private prisma;
    private communicationsService;
    private emailService;
    private auditService;
    private readonly logger;
    constructor(prisma: PrismaService, communicationsService: CommunicationsService, emailService: EmailService, auditService: AuditService);
    buildWhereClause(filters: BroadcastFilters): any;
    previewAudience(filters: BroadcastFilters, channel: 'WHATSAPP' | 'EMAIL'): Promise<{
        total: number;
        reachable: number;
        unreachable: number;
        sampleDonors: {
            id: string;
            name: string;
            contact: string;
        }[];
    }>;
    sendBroadcast(request: BroadcastRequest, userId: string): Promise<BroadcastResult>;
    getAvailableWhatsAppTemplates(): Promise<Record<import("../communications/twilio-whatsapp.service").WhatsAppTemplateKey, boolean>>;
    getAvailableEmailTemplates(): Promise<{
        name: string;
        id: string;
        type: import(".prisma/client").$Enums.TemplateType;
        description: string;
        emailSubject: string;
        emailBody: string;
    }[]>;
    getStaffList(): Promise<{
        name: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
    }[]>;
    getProfessionList(): Promise<string[]>;
}
