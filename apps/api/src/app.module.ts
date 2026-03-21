import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { AuditModule } from "./audit/audit.module";
import { DonorsModule } from "./donors/donors.module";
import { DonationsModule } from "./donations/donations.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { ReportsModule } from "./reports/reports.module";
import { TemplatesModule } from "./templates/templates.module";
import { CommunicationLogModule } from "./communication-log/communication-log.module";
import { RemindersModule } from "./reminders/reminders.module";
import { OrganizationProfileModule } from "./organization-profile/organization-profile.module";
import { DonorRelationsModule } from "./donor-relations/donor-relations.module";
import { ReminderTasksModule } from "./reminder-tasks/reminder-tasks.module";
import { HealthScoreModule } from "./health-score/health-score.module";
import { PledgesModule } from "./pledges/pledges.module";
import { EmailJobsModule } from "./email-jobs/email-jobs.module";
import { BeneficiariesModule } from "./beneficiaries/beneficiaries.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { BirthdayWishModule } from "./birthday-wishes/birthday-wishes.module";
import { ReportCampaignsModule } from "./report-campaigns/report-campaigns.module";
import { CampaignsModule } from "./campaigns/campaigns.module";
import { MilestonesModule } from "./milestones/milestones.module";
import { BackupModule } from "./backup/backup.module";
import { SearchModule } from "./search/search.module";
import { StorageModule } from "./storage/storage.module";
import { DonorUpdatesModule } from "./donor-updates/donor-updates.module";
import { DonorReportsModule } from "./donor-reports/donor-reports.module";
import { BeneficiaryProgressReportsModule } from "./beneficiary-progress-reports/beneficiary-progress-reports.module";
import { HomeSummaryModule } from "./home-summary/home-summary.module";
import { FollowUpsModule } from "./follow-ups/follow-ups.module";
import { NgoDocumentsModule } from "./ngo-documents/ngo-documents.module";
import { RolePermissionsModule } from "./role-permissions/role-permissions.module";
import { StaffTasksModule } from "./staff-tasks/staff-tasks.module";
import { CommunicationsModule } from "./communications/communications.module";
import { BroadcastingModule } from "./broadcasting/broadcasting.module";
import { TimeMachineModule } from "./time-machine/time-machine.module";
import { StaffProfilesModule } from "./staff-profiles/staff-profiles.module";
import { StaffSalaryModule } from "./staff-salary/staff-salary.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    PrismaModule,
    StorageModule,
    AuditModule,
    AuthModule,
    UsersModule,
    DonorsModule,
    DonationsModule,
    DashboardModule,
    ReportsModule,
    TemplatesModule,
    CommunicationLogModule,
    RemindersModule,
    OrganizationProfileModule,
    DonorRelationsModule,
    ReminderTasksModule,
    HealthScoreModule,
    PledgesModule,
    EmailJobsModule,
    BeneficiariesModule,
    AnalyticsModule,
    BirthdayWishModule,
    ReportCampaignsModule,
    CampaignsModule,
    MilestonesModule,
    BackupModule,
    SearchModule,
    DonorUpdatesModule,
    DonorReportsModule,
    BeneficiaryProgressReportsModule,
    HomeSummaryModule,
    FollowUpsModule,
    NgoDocumentsModule,
    RolePermissionsModule,
    StaffTasksModule,

    CommunicationsModule,
    BroadcastingModule,
    TimeMachineModule,
    StaffProfilesModule,
    StaffSalaryModule,
  ],
})
export class AppModule {}
