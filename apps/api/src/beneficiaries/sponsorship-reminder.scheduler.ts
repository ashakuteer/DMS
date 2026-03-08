import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BeneficiariesService } from './beneficiaries.service';

@Injectable()
export class SponsorshipReminderScheduler {
  private readonly logger = new Logger(SponsorshipReminderScheduler.name);

  constructor(
    private readonly beneficiariesService: BeneficiariesService,
  ) {}

  // Runs every day at 9 AM
  @Cron('0 9 * * *')
  async autoQueueSponsorshipReminders() {

    this.logger.log('Running daily sponsorship reminder auto-queue...');

    try {

      const dueSponsorships =
        await this.beneficiariesService.getDueSponsorships();

      let queued = 0;
      let skipped = 0;
      let failed = 0;

      for (const s of dueSponsorships) {

        try {

          const donorEmail =
            s?.donor?.personalEmail || s?.donor?.officialEmail;

          if (!donorEmail) {
            skipped++;
            continue;
          }

          // queue reminder
          await this.beneficiariesService.queueSponsorshipReminderEmail(
            s.id,
          );

          queued++;

        } catch (err) {

          const msg =
            err instanceof Error ? err.message : 'Unknown error';

          if (
            msg.includes('already exists') ||
            msg.includes('Unique constraint')
          ) {
            skipped++;
          } else {
            failed++;
            this.logger.warn(
              `Failed to queue reminder for sponsorship ${s.id}: ${msg}`,
            );
          }
        }
      }

      this.logger.log(
        `Sponsorship reminders finished. Queued=${queued}, Skipped=${skipped}, Failed=${failed}`,
      );

    } catch (error) {

      this.logger.error(
        'Failed to auto-queue sponsorship reminders',
        error,
      );

    }
  }
}
