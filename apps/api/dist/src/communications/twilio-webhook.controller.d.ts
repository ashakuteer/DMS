import { CommunicationsService } from "./communications.service";
export declare class TwilioWebhookController {
    private readonly service;
    private readonly logger;
    constructor(service: CommunicationsService);
    handleStatusCallback(body: {
        MessageSid?: string;
        MessageStatus?: string;
        ErrorCode?: string;
        ErrorMessage?: string;
    }): Promise<{
        received: boolean;
    }>;
}
