import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationsModule } from '../communications/communications.module';
import { CommunicationLogModule } from '../communication-log/communication-log.module';
import { EmailModule } from '../email/email.module';
import { ReceiptModule } from '../receipt/receipt.module';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    PrismaModule,
    CommunicationsModule,
    CommunicationLogModule,
    EmailModule,
    ReceiptModule,
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
