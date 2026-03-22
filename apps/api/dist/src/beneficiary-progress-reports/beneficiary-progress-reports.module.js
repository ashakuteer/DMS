"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiaryProgressReportsModule = void 0;
const common_1 = require("@nestjs/common");
const beneficiary_progress_reports_controller_1 = require("./beneficiary-progress-reports.controller");
const beneficiary_progress_reports_service_1 = require("./beneficiary-progress-reports.service");
const prisma_module_1 = require("../prisma/prisma.module");
const email_jobs_module_1 = require("../email-jobs/email-jobs.module");
const organization_profile_module_1 = require("../organization-profile/organization-profile.module");
let BeneficiaryProgressReportsModule = class BeneficiaryProgressReportsModule {
};
exports.BeneficiaryProgressReportsModule = BeneficiaryProgressReportsModule;
exports.BeneficiaryProgressReportsModule = BeneficiaryProgressReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, email_jobs_module_1.EmailJobsModule, organization_profile_module_1.OrganizationProfileModule],
        controllers: [beneficiary_progress_reports_controller_1.BeneficiaryProgressReportsController],
        providers: [beneficiary_progress_reports_service_1.BeneficiaryProgressReportsService],
    })
], BeneficiaryProgressReportsModule);
//# sourceMappingURL=beneficiary-progress-reports.module.js.map