"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiariesModule = void 0;
const common_1 = require("@nestjs/common");
const beneficiaries_controller_1 = require("./beneficiaries.controller");
const beneficiaries_service_1 = require("./beneficiaries.service");
const sponsorship_reminder_scheduler_1 = require("./sponsorship-reminder.scheduler");
const prisma_module_1 = require("../prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
const email_module_1 = require("../email/email.module");
const email_jobs_module_1 = require("../email-jobs/email-jobs.module");
const storage_module_1 = require("../storage/storage.module");
const communications_module_1 = require("../communications/communications.module");
const communication_log_module_1 = require("../communication-log/communication-log.module");
const beneficiary_core_service_1 = require("./services/beneficiary-core.service");
const beneficiary_sponsorship_service_1 = require("./services/beneficiary-sponsorship.service");
const beneficiary_updates_service_1 = require("./services/beneficiary-updates.service");
const beneficiary_health_service_1 = require("./services/beneficiary-health.service");
const beneficiary_education_service_1 = require("./services/beneficiary-education.service");
const beneficiary_documents_service_1 = require("./services/beneficiary-documents.service");
const beneficiary_reports_service_1 = require("./services/beneficiary-reports.service");
const beneficiary_reminders_service_1 = require("./services/beneficiary-reminders.service");
let BeneficiariesModule = class BeneficiariesModule {
};
exports.BeneficiariesModule = BeneficiariesModule;
exports.BeneficiariesModule = BeneficiariesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            email_module_1.EmailModule,
            email_jobs_module_1.EmailJobsModule,
            storage_module_1.StorageModule,
            communications_module_1.CommunicationsModule,
            communication_log_module_1.CommunicationLogModule,
        ],
        controllers: [
            beneficiaries_controller_1.BeneficiariesController,
            beneficiaries_controller_1.SponsorshipsController,
            beneficiaries_controller_1.BeneficiaryUpdatesController,
            beneficiaries_controller_1.SponsorDispatchesController,
            beneficiaries_controller_1.ReportCampaignsController,
        ],
        providers: [
            beneficiaries_service_1.BeneficiariesService,
            sponsorship_reminder_scheduler_1.SponsorshipReminderScheduler,
            beneficiary_core_service_1.BeneficiaryCoreService,
            beneficiary_sponsorship_service_1.BeneficiarySponsorshipService,
            beneficiary_updates_service_1.BeneficiaryUpdatesService,
            beneficiary_health_service_1.BeneficiaryHealthService,
            beneficiary_education_service_1.BeneficiaryEducationService,
            beneficiary_documents_service_1.BeneficiaryDocumentsService,
            beneficiary_reports_service_1.BeneficiaryReportsService,
            beneficiary_reminders_service_1.BeneficiaryRemindersService,
        ],
        exports: [beneficiaries_service_1.BeneficiariesService],
    })
], BeneficiariesModule);
//# sourceMappingURL=beneficiaries.module.js.map