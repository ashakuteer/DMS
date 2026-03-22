"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonationsModule = void 0;
const common_1 = require("@nestjs/common");
const donations_controller_1 = require("./donations.controller");
const donations_service_1 = require("./donations.service");
const prisma_module_1 = require("../prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
const receipt_module_1 = require("../receipt/receipt.module");
const email_module_1 = require("../email/email.module");
const communication_log_module_1 = require("../communication-log/communication-log.module");
const organization_profile_module_1 = require("../organization-profile/organization-profile.module");
const communications_module_1 = require("../communications/communications.module");
const notification_module_1 = require("../notifications/notification.module");
let DonationsModule = class DonationsModule {
};
exports.DonationsModule = DonationsModule;
exports.DonationsModule = DonationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            receipt_module_1.ReceiptModule,
            email_module_1.EmailModule,
            communication_log_module_1.CommunicationLogModule,
            organization_profile_module_1.OrganizationProfileModule,
            communications_module_1.CommunicationsModule,
            notification_module_1.NotificationModule,
        ],
        controllers: [donations_controller_1.DonationsController],
        providers: [donations_service_1.DonationsService],
        exports: [donations_service_1.DonationsService],
    })
], DonationsModule);
//# sourceMappingURL=donations.module.js.map