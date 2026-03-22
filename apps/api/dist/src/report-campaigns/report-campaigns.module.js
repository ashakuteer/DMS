"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportCampaignsModule = void 0;
const common_1 = require("@nestjs/common");
const report_campaigns_controller_1 = require("./report-campaigns.controller");
const report_campaigns_service_1 = require("./report-campaigns.service");
const prisma_module_1 = require("../prisma/prisma.module");
const storage_module_1 = require("../storage/storage.module");
const email_jobs_module_1 = require("../email-jobs/email-jobs.module");
const organization_profile_module_1 = require("../organization-profile/organization-profile.module");
let ReportCampaignsModule = class ReportCampaignsModule {
};
exports.ReportCampaignsModule = ReportCampaignsModule;
exports.ReportCampaignsModule = ReportCampaignsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            storage_module_1.StorageModule,
            email_jobs_module_1.EmailJobsModule,
            organization_profile_module_1.OrganizationProfileModule,
        ],
        controllers: [report_campaigns_controller_1.ReportCampaignsController],
        providers: [report_campaigns_service_1.ReportCampaignsService],
        exports: [report_campaigns_service_1.ReportCampaignsService],
    })
], ReportCampaignsModule);
//# sourceMappingURL=report-campaigns.module.js.map