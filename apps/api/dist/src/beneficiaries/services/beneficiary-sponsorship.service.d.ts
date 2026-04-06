import { PrismaService } from "../../prisma/prisma.service";
import { CommunicationsService } from "../../communications/communications.service";
import { EmailService } from "../../email/email.service";
import { CommunicationLogService } from "../../communication-log/communication-log.service";
export declare class BeneficiarySponsorshipService {
    private prisma;
    private communicationsService;
    private emailService;
    private communicationLogService;
    private readonly logger;
    constructor(prisma: PrismaService, communicationsService: CommunicationsService, emailService: EmailService, communicationLogService: CommunicationLogService);
    getSponsors(beneficiaryId: string): Promise<any>;
    addSponsor(user: any, beneficiaryId: string, dto: any): Promise<any>;
    getSponsorshipsByBeneficiary(beneficiaryId: string): Promise<any>;
    updateSponsorship(user: any, id: string, dto: any): Promise<any>;
    deleteSponsorship(id: string): Promise<any>;
    getSponsorshipHistory(sponsorshipId: string): Promise<any>;
    getSponsorsByDonor(donorId: string): Promise<any>;
    createSponsorshipForDonor(user: any, dto: {
        donorId: string;
        beneficiaryId: string;
        sponsorshipType: string;
        amount?: number;
        currency?: string;
        frequency?: string;
        startDate?: string;
        status?: string;
        notes?: string;
    }): Promise<any>;
    getSponsorshipSummary(): Promise<any>;
    sendUpdateToSponsor(userId: string, sponsorshipId: string): Promise<{
        success: boolean;
        donorName: string;
        beneficiaryName: any;
        results: {
            whatsapp?: string;
            email?: string;
        };
        latestUpdateTitle: any;
    }>;
}
