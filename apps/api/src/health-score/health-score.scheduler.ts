import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HealthScoreService } from './health-score.service';

@Injectable()
export class HealthScoreScheduler {
  private readonly logger = new Logger(HealthScoreScheduler.name);

  constructor(private healthScoreService: HealthScoreService) {}

  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async recalculateHealthScores() {
    this.logger.log('Running daily health score recalculation and insights cache refresh...');
    try {
      const result = await this.healthScoreService.recalculateAllHealthScores();
      this.logger.log(`Health score recalculation completed. Updated: ${result.updated}, Errors: ${result.errors}. Insight cards will reflect updated health data.`);
    } catch (error) {
      this.logger.error('Failed to recalculate health scores:', error);
    }
  }
}
