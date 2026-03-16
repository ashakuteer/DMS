import { Module } from '@nestjs/common';
import { PledgesController } from './pledges.controller';
import { PledgesService } from './pledges.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { CommunicationLogModule } from '../communication-log/communication-log.module';
import { EmailJobsModule } from '../email-jobs/email-jobs.module';

@Module({
  imports: [PrismaModule, AuditModule, CommunicationLogModule, EmailJobsModule],
  controllers: [PledgesController],
  providers: [PledgesService],
  exports: [PledgesService],
})
export class PledgesModule {}
