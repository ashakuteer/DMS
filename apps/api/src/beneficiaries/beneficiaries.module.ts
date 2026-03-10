import { Module } from "@nestjs/common";

import {
  BeneficiariesController,
  SponsorshipsController,
  BeneficiaryUpdatesController,
  SponsorDispatchesController,
  ReportCampaignsController,
} from "./beneficiaries.controller";

import { BeneficiariesService } from "./beneficiaries.service";
import { SponsorshipReminderScheduler } from "./sponsorship-reminder.scheduler";

import { PrismaModule } from "../prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { EmailModule } from "../email/email.module";
import { EmailJobsModule } from "../email-jobs/email-jobs.module";
import { StorageModule } from "../storage/storage.module";

import { BeneficiaryCoreService } from "./services/beneficiary-core.service";
import { BeneficiarySponsorshipService } from "./services/beneficiary-sponsorship.service";
import { BeneficiaryUpdatesService } from "./services/beneficiary-updates.service";
import { BeneficiaryHealthService } from "./services/beneficiary-health.service";
import { BeneficiaryEducationService } from "./services/beneficiary-education.service";
import { BeneficiaryDocumentsService } from "./services/beneficiary-documents.service";
import { BeneficiaryReportsService } from "./services/beneficiary-reports.service";
import { BeneficiaryRemindersService } from "./services/beneficiary-reminders.service";

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    EmailModule,
    EmailJobsModule,
    StorageModule,
  ],
  controllers: [
    BeneficiariesController,
    SponsorshipsController,
    BeneficiaryUpdatesController,
    SponsorDispatchesController,
    ReportCampaignsController,
  ],
  providers: [
    BeneficiariesService,
    SponsorshipReminderScheduler,
    BeneficiaryCoreService,
    BeneficiarySponsorshipService,
    BeneficiaryUpdatesService,
    BeneficiaryHealthService,
    BeneficiaryEducationService,
    BeneficiaryDocumentsService,
    BeneficiaryReportsService,
    BeneficiaryRemindersService,
  ],
  exports: [BeneficiariesService],
})
export class BeneficiariesModule {}
