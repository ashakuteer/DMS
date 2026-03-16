import { Module } from '@nestjs/common';
import { PledgesController } from './pledges.controller';
import { PledgesService } from './pledges.service';
import { PledgesRemindersService } from './pledges.reminders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { CommunicationLogModule } from '../communication-log/communication-log.module';
import { EmailJobsModule } from '../email-jobs/email-jobs.module';
import { OrganizationProfileModule } from '../organization-profile/organization-profile.module';

@Module({
  imports: [PrismaModule, AuditModule, CommunicationLogModule, EmailJobsModule, OrganizationProfileModule],
  controllers: [PledgesController],
  providers: [PledgesService, PledgesRemindersService],
  exports: [PledgesService],
})
export class PledgesModule {}
