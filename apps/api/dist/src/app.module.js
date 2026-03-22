"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const audit_module_1 = require("./audit/audit.module");
const donors_module_1 = require("./donors/donors.module");
const donations_module_1 = require("./donations/donations.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const reports_module_1 = require("./reports/reports.module");
const templates_module_1 = require("./templates/templates.module");
const communication_log_module_1 = require("./communication-log/communication-log.module");
const reminders_module_1 = require("./reminders/reminders.module");
const organization_profile_module_1 = require("./organization-profile/organization-profile.module");
const donor_relations_module_1 = require("./donor-relations/donor-relations.module");
const reminder_tasks_module_1 = require("./reminder-tasks/reminder-tasks.module");
const health_score_module_1 = require("./health-score/health-score.module");
const pledges_module_1 = require("./pledges/pledges.module");
const email_jobs_module_1 = require("./email-jobs/email-jobs.module");
const beneficiaries_module_1 = require("./beneficiaries/beneficiaries.module");
const analytics_module_1 = require("./analytics/analytics.module");
const birthday_wishes_module_1 = require("./birthday-wishes/birthday-wishes.module");
const report_campaigns_module_1 = require("./report-campaigns/report-campaigns.module");
const campaigns_module_1 = require("./campaigns/campaigns.module");
const milestones_module_1 = require("./milestones/milestones.module");
const backup_module_1 = require("./backup/backup.module");
const search_module_1 = require("./search/search.module");
const storage_module_1 = require("./storage/storage.module");
const donor_updates_module_1 = require("./donor-updates/donor-updates.module");
const donor_reports_module_1 = require("./donor-reports/donor-reports.module");
const beneficiary_progress_reports_module_1 = require("./beneficiary-progress-reports/beneficiary-progress-reports.module");
const home_summary_module_1 = require("./home-summary/home-summary.module");
const follow_ups_module_1 = require("./follow-ups/follow-ups.module");
const ngo_documents_module_1 = require("./ngo-documents/ngo-documents.module");
const role_permissions_module_1 = require("./role-permissions/role-permissions.module");
const staff_tasks_module_1 = require("./staff-tasks/staff-tasks.module");
const communications_module_1 = require("./communications/communications.module");
const broadcasting_module_1 = require("./broadcasting/broadcasting.module");
const time_machine_module_1 = require("./time-machine/time-machine.module");
const staff_profiles_module_1 = require("./staff-profiles/staff-profiles.module");
const staff_salary_module_1 = require("./staff-salary/staff-salary.module");
const staff_leaves_module_1 = require("./staff-leaves/staff-leaves.module");
const staff_attendance_module_1 = require("./staff-attendance/staff-attendance.module");
const task_templates_module_1 = require("./task-templates/task-templates.module");
const tasks_module_1 = require("./tasks/tasks.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            storage_module_1.StorageModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            donors_module_1.DonorsModule,
            donations_module_1.DonationsModule,
            dashboard_module_1.DashboardModule,
            reports_module_1.ReportsModule,
            templates_module_1.TemplatesModule,
            communication_log_module_1.CommunicationLogModule,
            reminders_module_1.RemindersModule,
            organization_profile_module_1.OrganizationProfileModule,
            donor_relations_module_1.DonorRelationsModule,
            reminder_tasks_module_1.ReminderTasksModule,
            health_score_module_1.HealthScoreModule,
            pledges_module_1.PledgesModule,
            email_jobs_module_1.EmailJobsModule,
            beneficiaries_module_1.BeneficiariesModule,
            analytics_module_1.AnalyticsModule,
            birthday_wishes_module_1.BirthdayWishModule,
            report_campaigns_module_1.ReportCampaignsModule,
            campaigns_module_1.CampaignsModule,
            milestones_module_1.MilestonesModule,
            backup_module_1.BackupModule,
            search_module_1.SearchModule,
            donor_updates_module_1.DonorUpdatesModule,
            donor_reports_module_1.DonorReportsModule,
            beneficiary_progress_reports_module_1.BeneficiaryProgressReportsModule,
            home_summary_module_1.HomeSummaryModule,
            follow_ups_module_1.FollowUpsModule,
            ngo_documents_module_1.NgoDocumentsModule,
            role_permissions_module_1.RolePermissionsModule,
            staff_tasks_module_1.StaffTasksModule,
            communications_module_1.CommunicationsModule,
            broadcasting_module_1.BroadcastingModule,
            time_machine_module_1.TimeMachineModule,
            staff_profiles_module_1.StaffProfilesModule,
            staff_salary_module_1.StaffSalaryModule,
            staff_leaves_module_1.StaffLeavesModule,
            staff_attendance_module_1.StaffAttendanceModule,
            task_templates_module_1.TaskTemplatesModule,
            tasks_module_1.TasksModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map