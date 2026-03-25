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
    getUpdates(beneficiaryId: string): Promise<any>;
    addUpdate(user: any, beneficiaryId: string, dto: any): Promise<any>;
    private notifySponsors;
    getUpdateWithBeneficiary(updateId: string): Promise<any>;
    sendUpdateToSponsors(user: any, updateId: string): Promise<{
        success: boolean;
        dispatchCount: any;
    }>;
    deleteUpdate(updateId: string): Promise<{
        success: boolean;
    }>;
    markDispatchCopied(id: string): Promise<any>;
}
