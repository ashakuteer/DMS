import { Module } from '@nestjs/common';
import { BeneficiariesController, SponsorshipsController, BeneficiaryUpdatesController, SponsorDispatchesController, ReportCampaignsController } from './beneficiaries.controller';
import { BeneficiariesService } from './beneficiaries.service';
import { SponsorshipReminderScheduler } from './sponsorship-reminder.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { EmailJobsModule } from '../email-jobs/email-jobs.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, AuditModule, EmailModule, EmailJobsModule, StorageModule],
  controllers: [BeneficiariesController, SponsorshipsController, BeneficiaryUpdatesController, SponsorDispatchesController, ReportCampaignsController],
  providers: [BeneficiariesService, SponsorshipReminderScheduler],
  exports: [BeneficiariesService],
})
export class BeneficiariesModule {}
