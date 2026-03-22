"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BirthdayWishModule = void 0;
const common_1 = require("@nestjs/common");
const birthday_wishes_controller_1 = require("./birthday-wishes.controller");
const birthday_wishes_service_1 = require("./birthday-wishes.service");
const prisma_module_1 = require("../prisma/prisma.module");
const email_jobs_module_1 = require("../email-jobs/email-jobs.module");
const communication_log_module_1 = require("../communication-log/communication-log.module");
let BirthdayWishModule = class BirthdayWishModule {
};
exports.BirthdayWishModule = BirthdayWishModule;
exports.BirthdayWishModule = BirthdayWishModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, email_jobs_module_1.EmailJobsModule, communication_log_module_1.CommunicationLogModule],
        controllers: [birthday_wishes_controller_1.BirthdayWishController],
        providers: [birthday_wishes_service_1.BirthdayWishService],
        exports: [birthday_wishes_service_1.BirthdayWishService],
    })
], BirthdayWishModule);
//# sourceMappingURL=birthday-wishes.module.js.map