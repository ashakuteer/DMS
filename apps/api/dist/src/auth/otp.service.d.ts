import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
export declare class OtpService {
    private prisma;
    private whatsappService;
    private readonly logger;
    constructor(prisma: PrismaService, whatsappService: WhatsappService);
    sendOtp(phone: string): Promise<{
        message: string;
    }>;
    verifyOtp(phone: string, code: string): Promise<{
        id: string;
        email: string;
        role: string;
        name: string;
    }>;
    private normalizePhone;
}
