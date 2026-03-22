import { PrismaService } from "../../prisma/prisma.service";
import { CommunicationsService } from "../../communications/communications.service";
import { CommunicationLogService } from "../../communication-log/communication-log.service";
import { EmailService } from "../../email/email.service";
export declare class BeneficiaryUpdatesService {
    private prisma;
    private communicationsService;
    private communicationLogService;
    private emailService;
    private readonly logger;
    constructor(prisma: PrismaService, communicationsService: CommunicationsService, communicationLogService: CommunicationLogService, emailService: EmailService);
    getUpdates(beneficiaryId: string): Promise<({
        attachments: ({
            document: {
                id: string;
                title: string;
                storagePath: string;
                mimeType: string;
            };
        } & {
            id: string;
            updateId: string;
            documentId: string;
        })[];
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        createdById: string;
        title: string;
        beneficiaryId: string;
        updateType: import(".prisma/client").$Enums.BeneficiaryUpdateType;
        mediaUrls: string[];
        isPrivate: boolean;
        shareWithDonor: boolean;
    })[]>;
    addUpdate(user: any, beneficiaryId: string, dto: any): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        createdById: string;
        title: string;
        beneficiaryId: string;
        updateType: import(".prisma/client").$Enums.BeneficiaryUpdateType;
        mediaUrls: string[];
        isPrivate: boolean;
        shareWithDonor: boolean;
    }>;
    private notifySponsors;
    getUpdateWithBeneficiary(updateId: string): Promise<{
        beneficiary: {
            id: string;
            fullName: string;
        };
        createdBy: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        createdById: string;
        title: string;
        beneficiaryId: string;
        updateType: import(".prisma/client").$Enums.BeneficiaryUpdateType;
        mediaUrls: string[];
        isPrivate: boolean;
        shareWithDonor: boolean;
    }>;
    sendUpdateToSponsors(user: any, updateId: string): Promise<{
        success: boolean;
        dispatchCount: number;
    }>;
    deleteUpdate(updateId: string): Promise<{
        success: boolean;
    }>;
    markDispatchCopied(id: string): Promise<{
        error: string | null;
        id: string;
        createdAt: Date;
        channel: import(".prisma/client").$Enums.SponsorDispatchChannel;
        status: import(".prisma/client").$Enums.SponsorDispatchStatus;
        donorId: string;
        sentAt: Date | null;
        updateId: string;
    }>;
}
