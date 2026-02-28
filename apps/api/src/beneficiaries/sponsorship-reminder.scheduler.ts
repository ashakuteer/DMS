import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BeneficiariesService } from './beneficiaries.service';

@Injectable()
export class SponsorshipReminderScheduler {
  private readonly logger = new Logger(SponsorshipReminderScheduler.name);

  constructor(private beneficiariesService: BeneficiariesService) {}

  @Cron('0 9 * * *')
  async autoQueueSponsorshipReminders() {
    this.logger.log('Running daily sponsorship reminder auto-queue...');
    try {
      const dueSponsorships = await this.beneficiariesService.getDueSponsorships(3);
      let queued = 0;
      let skipped = 0;
      let failed = 0;

      for (const s of dueSponsorships) {
        try {
          const donorEmail = s.donor?.personalEmail || s.donor?.officialEmail;
          if (!donorEmail) {
            skipped++;
            continue;
          }

          await this.beneficiariesService.queueSponsorshipReminderEmail(s.sponsorshipId);
          queued++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown';
          if (msg.includes('already exists') || msg.includes('Unique constraint')) {
            skipped++;
          } else {
            failed++;
            this.logger.warn(`Failed to queue reminder for sponsorship ${s.sponsorshipId}: ${msg}`);
          }
        }
      }

      this.logger.log(`Sponsorship reminder auto-queue completed. Queued: ${queued}, Skipped: ${skipped}, Failed: ${failed}`);
    } catch (error) {
      this.logger.error('Failed to auto-queue sponsorship reminders:', error);
    }
  }
}
