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
    getSponsors(beneficiaryId: string): Promise<({
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    })[]>;
    addSponsor(user: any, beneficiaryId: string, dto: any): Promise<{
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    }>;
    getSponsorshipsByBeneficiary(beneficiaryId: string): Promise<({
        donor: {
            id: string;
            donorCode: string;
            firstName: string;
            lastName: string;
            primaryPhone: string;
            personalEmail: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    })[]>;
    updateSponsorship(user: any, id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    }>;
    deleteSponsorship(id: string): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    }>;
    getSponsorshipHistory(sponsorshipId: string): Promise<({
        changedBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        sponsorshipId: string;
        oldStatus: import(".prisma/client").$Enums.SponsorshipStatus;
        newStatus: import(".prisma/client").$Enums.SponsorshipStatus;
        oldAmount: import("@prisma/client/runtime/library").Decimal | null;
        newAmount: import("@prisma/client/runtime/library").Decimal | null;
        note: string | null;
        changedAt: Date;
        changedById: string;
    })[]>;
    getSponsorsByDonor(donorId: string): Promise<({
        beneficiary: {
            code: string;
            id: string;
            status: import(".prisma/client").$Enums.BeneficiaryStatus;
            fullName: string;
            homeType: import(".prisma/client").$Enums.HomeType;
            photoUrl: string;
            updates: {
                id: string;
                createdAt: Date;
                content: string;
                title: string;
                updateType: import(".prisma/client").$Enums.BeneficiaryUpdateType;
            }[];
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    })[]>;
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
    }): Promise<{
        beneficiary: {
            code: string;
            id: string;
            status: import(".prisma/client").$Enums.BeneficiaryStatus;
            fullName: string;
            homeType: import(".prisma/client").$Enums.HomeType;
            photoUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        currency: string;
        startDate: Date | null;
        endDate: Date | null;
        donorId: string;
        status: import(".prisma/client").$Enums.SponsorshipStatus;
        notes: string | null;
        beneficiaryId: string;
        sponsorshipType: import(".prisma/client").$Enums.SponsorshipType;
        amount: import("@prisma/client/runtime/library").Decimal | null;
        inKindItem: string | null;
        frequency: import(".prisma/client").$Enums.SponsorshipFrequency;
        dueDayOfMonth: number | null;
        nextDueDate: Date | null;
    }>;
    getSponsorshipSummary(): Promise<number>;
    sendUpdateToSponsor(userId: string, sponsorshipId: string): Promise<{
        success: boolean;
        donorName: string;
        beneficiaryName: string;
        results: {
            whatsapp?: string;
            email?: string;
        };
        latestUpdateTitle: string;
    }>;
}
