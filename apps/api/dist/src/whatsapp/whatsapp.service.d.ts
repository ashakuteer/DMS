export declare class WhatsappService {
    private readonly logger;
    private client;
    private disabled;
    constructor();
    private normalizeToE164;
    sendOtpTemplate(to: string, otp: string): Promise<boolean>;
    sendWhatsApp(to: string, message: string): Promise<boolean>;
}
