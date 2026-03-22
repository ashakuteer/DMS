"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorUpdatesModule = void 0;
const common_1 = require("@nestjs/common");
const donor_updates_controller_1 = require("./donor-updates.controller");
const donor_updates_service_1 = require("./donor-updates.service");
const prisma_module_1 = require("../prisma/prisma.module");
const email_jobs_module_1 = require("../email-jobs/email-jobs.module");
const communication_log_module_1 = require("../communication-log/communication-log.module");
let DonorUpdatesModule = class DonorUpdatesModule {
};
exports.DonorUpdatesModule = DonorUpdatesModule;
exports.DonorUpdatesModule = DonorUpdatesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, email_jobs_module_1.EmailJobsModule, communication_log_module_1.CommunicationLogModule],
        controllers: [donor_updates_controller_1.DonorUpdatesController],
        providers: [donor_updates_service_1.DonorUpdatesService],
        exports: [donor_updates_service_1.DonorUpdatesService],
    })
], DonorUpdatesModule);
//# sourceMappingURL=donor-updates.module.js.map