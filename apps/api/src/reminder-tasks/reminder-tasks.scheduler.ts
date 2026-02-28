import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReminderTasksService } from './reminder-tasks.service';

@Injectable()
export class ReminderTasksScheduler {
  private readonly logger = new Logger(ReminderTasksScheduler.name);

  constructor(private reminderTasksService: ReminderTasksService) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async generateDailyReminders() {
    this.logger.log('Running daily reminder generation...');
    try {
      const count = await this.reminderTasksService.generateSpecialDayReminders();
      this.logger.log(`Daily reminder generation completed. Generated ${count} tasks.`);
    } catch (error) {
      this.logger.error('Failed to generate daily reminders:', error);
    }
  }

  @Cron('0 8 * * *')
  async processDailyAutoEmails() {
    this.logger.log('Processing daily auto emails for due reminders...');
    try {
      const result = await this.reminderTasksService.processAutoEmails();
      this.logger.log(`Auto email processing completed. Sent: ${result.sent}, Failed: ${result.failed}`);
    } catch (error) {
      this.logger.error('Failed to process auto emails:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupSnoozedReminders() {
    this.logger.log('Checking for unsnoozed reminders...');
  }
}
