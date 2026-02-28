import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NgoDocumentsService } from './ngo-documents.service';

@Injectable()
export class NgoDocumentsScheduler {
  private readonly logger = new Logger(NgoDocumentsScheduler.name);

  constructor(private ngoDocumentsService: NgoDocumentsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExpiringDocuments() {
    try {
      const expiring = await this.ngoDocumentsService.getExpiringDocuments(30);
      const expired = await this.ngoDocumentsService.getExpiredDocuments();

      if (expiring.length > 0) {
        this.logger.warn(
          `${expiring.length} NGO document(s) expiring within 30 days:`,
        );
        expiring.forEach((doc) => {
          this.logger.warn(
            `  - "${doc.title}" (${doc.category}) expires on ${doc.expiryDate?.toISOString().split('T')[0]}`,
          );
        });
      }

      if (expired.length > 0) {
        this.logger.error(
          `${expired.length} NGO document(s) have EXPIRED:`,
        );
        expired.forEach((doc) => {
          this.logger.error(
            `  - "${doc.title}" (${doc.category}) expired on ${doc.expiryDate?.toISOString().split('T')[0]}`,
          );
        });
      }

      if (expiring.length === 0 && expired.length === 0) {
        this.logger.log('No expiring or expired NGO documents found.');
      }
    } catch (error) {
      this.logger.error('Error checking document expiry', error);
    }
  }
}
