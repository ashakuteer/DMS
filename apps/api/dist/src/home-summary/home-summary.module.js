"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeSummaryModule = void 0;
const common_1 = require("@nestjs/common");
const home_summary_service_1 = require("./home-summary.service");
const home_summary_controller_1 = require("./home-summary.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const organization_profile_module_1 = require("../organization-profile/organization-profile.module");
let HomeSummaryModule = class HomeSummaryModule {
};
exports.HomeSummaryModule = HomeSummaryModule;
exports.HomeSummaryModule = HomeSummaryModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, organization_profile_module_1.OrganizationProfileModule],
        controllers: [home_summary_controller_1.HomeSummaryController],
        providers: [home_summary_service_1.HomeSummaryService],
    })
], HomeSummaryModule);
//# sourceMappingURL=home-summary.module.js.map