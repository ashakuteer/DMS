import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReminderTasksController } from './reminder-tasks.controller';
import { ReminderTasksService } from './reminder-tasks.service';
import { ReminderTasksScheduler } from './reminder-tasks.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { CommunicationLogModule } from '../communication-log/communication-log.module';
import { TemplatesModule } from '../templates/templates.module';
import { OrganizationProfileModule } from '../organization-profile/organization-profile.module';
import { EmailJobsModule } from '../email-jobs/email-jobs.module';
import { CommunicationsModule } from '../communications/communications.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    ScheduleModule.forRoot(),
    EmailModule,
    CommunicationLogModule,
    TemplatesModule,
    OrganizationProfileModule,
    EmailJobsModule,
    CommunicationsModule,
  ],
  controllers: [ReminderTasksController],
  providers: [ReminderTasksService, ReminderTasksScheduler],
  exports: [ReminderTasksService],
})
export class ReminderTasksModule {}
