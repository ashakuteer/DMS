import { Module } from '@nestjs/common';
import { EmailJobsService } from './email-jobs.service';
import { EmailJobsController } from './email-jobs.controller';
import { EmailSenderCron } from './email-sender.cron';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationProfileModule } from '../organization-profile/organization-profile.module';
import { CommunicationLogModule } from '../communication-log/communication-log.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, OrganizationProfileModule, CommunicationLogModule, EmailModule],
  controllers: [EmailJobsController],
  providers: [EmailJobsService, EmailSenderCron],
  exports: [EmailJobsService],
})
export class EmailJobsModule {}
