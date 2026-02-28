import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReceiptModule } from '../receipt/receipt.module';
import { CommunicationLogModule } from '../communication-log/communication-log.module';

@Module({
  imports: [PrismaModule, ReceiptModule, CommunicationLogModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
