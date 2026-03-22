import { BeneficiariesService } from './beneficiaries.service';
export declare class SponsorshipReminderScheduler {
    private readonly beneficiariesService;
    private readonly logger;
    constructor(beneficiariesService: BeneficiariesService);
    autoQueueSponsorshipReminders(): Promise<void>;
}
