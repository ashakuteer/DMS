import { Module } from '@nestjs/common';
import { DonorUpdatesController } from './donor-updates.controller';
import { DonorUpdatesService } from './donor-updates.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailJobsModule } from '../email-jobs/email-jobs.module';
import { CommunicationLogModule } from '../communication-log/communication-log.module';

@Module({
  imports: [PrismaModule, EmailJobsModule, CommunicationLogModule],
  controllers: [DonorUpdatesController],
  providers: [DonorUpdatesService],
  exports: [DonorUpdatesService],
})
export class DonorUpdatesModule {}
