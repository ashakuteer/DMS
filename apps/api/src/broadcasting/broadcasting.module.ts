import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationsModule } from '../communications/communications.module';
import { EmailModule } from '../email/email.module';
import { AuditModule } from '../audit/audit.module';
import { BroadcastingService } from './broadcasting.service';
import { BroadcastingController } from './broadcasting.controller';

@Module({
  imports: [PrismaModule, CommunicationsModule, EmailModule, AuditModule],
  controllers: [BroadcastingController],
  providers: [BroadcastingService],
  exports: [BroadcastingService],
})
export class BroadcastingModule {}
