"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailJobsModule = void 0;
const common_1 = require("@nestjs/common");
const email_jobs_service_1 = require("./email-jobs.service");
const email_jobs_controller_1 = require("./email-jobs.controller");
const email_sender_cron_1 = require("./email-sender.cron");
const prisma_module_1 = require("../prisma/prisma.module");
const organization_profile_module_1 = require("../organization-profile/organization-profile.module");
const communication_log_module_1 = require("../communication-log/communication-log.module");
const email_module_1 = require("../email/email.module");
let EmailJobsModule = class EmailJobsModule {
};
exports.EmailJobsModule = EmailJobsModule;
exports.EmailJobsModule = EmailJobsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, organization_profile_module_1.OrganizationProfileModule, communication_log_module_1.CommunicationLogModule, email_module_1.EmailModule],
        controllers: [email_jobs_controller_1.EmailJobsController],
        providers: [email_jobs_service_1.EmailJobsService, email_sender_cron_1.EmailSenderCron],
        exports: [email_jobs_service_1.EmailJobsService],
    })
], EmailJobsModule);
//# sourceMappingURL=email-jobs.module.js.map