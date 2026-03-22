"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastingModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const communications_module_1 = require("../communications/communications.module");
const email_module_1 = require("../email/email.module");
const audit_module_1 = require("../audit/audit.module");
const broadcasting_service_1 = require("./broadcasting.service");
const broadcasting_controller_1 = require("./broadcasting.controller");
let BroadcastingModule = class BroadcastingModule {
};
exports.BroadcastingModule = BroadcastingModule;
exports.BroadcastingModule = BroadcastingModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, communications_module_1.CommunicationsModule, email_module_1.EmailModule, audit_module_1.AuditModule],
        controllers: [broadcasting_controller_1.BroadcastingController],
        providers: [broadcasting_service_1.BroadcastingService],
        exports: [broadcasting_service_1.BroadcastingService],
    })
], BroadcastingModule);
//# sourceMappingURL=broadcasting.module.js.map