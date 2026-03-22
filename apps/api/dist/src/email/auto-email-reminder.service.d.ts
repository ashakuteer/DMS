import { SpecialDaysProcessor } from './processors/special-days.processor';
import { PledgeRemindersProcessor } from './processors/pledge-reminders.processor';
import { BeneficiaryBirthdayProcessor } from './processors/beneficiary-birthday.processor';
import { SponsorshipReminderProcessor } from './processors/sponsorship-reminder.processor';
export declare class AutoEmailReminderService {
    private specialDays;
    private pledges;
    private beneficiaryBirthdays;
    private sponsorships;
    private readonly logger;
    constructor(specialDays: SpecialDaysProcessor, pledges: PledgeRemindersProcessor, beneficiaryBirthdays: BeneficiaryBirthdayProcessor, sponsorships: SponsorshipReminderProcessor);
    runDailyReminderJob(): Promise<{
        specialDaysQueued: number;
        pledgesQueued: number;
        sponsorshipsQueued: number;
        sent: number;
        failed: number;
        errors: string[];
    }>;
}
