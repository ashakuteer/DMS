"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const twilio_whatsapp_service_1 = require("./twilio-whatsapp.service");
const communications_service_1 = require("./communications.service");
const communications_controller_1 = require("./communications.controller");
const twilio_webhook_controller_1 = require("./twilio-webhook.controller");
let CommunicationsModule = class CommunicationsModule {
};
exports.CommunicationsModule = CommunicationsModule;
exports.CommunicationsModule = CommunicationsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [communications_controller_1.CommunicationsController, twilio_webhook_controller_1.TwilioWebhookController],
        providers: [twilio_whatsapp_service_1.TwilioWhatsAppService, communications_service_1.CommunicationsService],
        exports: [communications_service_1.CommunicationsService, twilio_whatsapp_service_1.TwilioWhatsAppService],
    })
], CommunicationsModule);
//# sourceMappingURL=communications.module.js.map