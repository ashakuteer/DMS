"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderTasksModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const reminder_tasks_controller_1 = require("./reminder-tasks.controller");
const reminder_tasks_service_1 = require("./reminder-tasks.service");
const reminder_tasks_scheduler_1 = require("./reminder-tasks.scheduler");
const prisma_module_1 = require("../prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
const email_module_1 = require("../email/email.module");
const communication_log_module_1 = require("../communication-log/communication-log.module");
const templates_module_1 = require("../templates/templates.module");
const organization_profile_module_1 = require("../organization-profile/organization-profile.module");
const email_jobs_module_1 = require("../email-jobs/email-jobs.module");
const communications_module_1 = require("../communications/communications.module");
let ReminderTasksModule = class ReminderTasksModule {
};
exports.ReminderTasksModule = ReminderTasksModule;
exports.ReminderTasksModule = ReminderTasksModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            schedule_1.ScheduleModule.forRoot(),
            email_module_1.EmailModule,
            communication_log_module_1.CommunicationLogModule,
            templates_module_1.TemplatesModule,
            organization_profile_module_1.OrganizationProfileModule,
            email_jobs_module_1.EmailJobsModule,
            communications_module_1.CommunicationsModule,
        ],
        controllers: [reminder_tasks_controller_1.ReminderTasksController],
        providers: [reminder_tasks_service_1.ReminderTasksService, reminder_tasks_scheduler_1.ReminderTasksScheduler],
        exports: [reminder_tasks_service_1.ReminderTasksService],
    })
], ReminderTasksModule);
//# sourceMappingURL=reminder-tasks.module.js.map