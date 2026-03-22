"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TwilioWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioWebhookController = void 0;
const common_1 = require("@nestjs/common");
const communications_service_1 = require("./communications.service");
let TwilioWebhookController = TwilioWebhookController_1 = class TwilioWebhookController {
    constructor(service) {
        this.service = service;
        this.logger = new common_1.Logger(TwilioWebhookController_1.name);
    }
    async handleStatusCallback(body) {
        const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = body;
        if (!MessageSid || !MessageStatus) {
            this.logger.warn("Received webhook without MessageSid or MessageStatus");
            return { received: true };
        }
        this.logger.log(`Twilio status webhook: SID=${MessageSid} Status=${MessageStatus}`);
        await this.service.updateStatusFromWebhook(MessageSid, MessageStatus, ErrorCode, ErrorMessage);
        return { received: true };
    }
};
exports.TwilioWebhookController = TwilioWebhookController;
__decorate([
    (0, common_1.Post)("status"),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TwilioWebhookController.prototype, "handleStatusCallback", null);
exports.TwilioWebhookController = TwilioWebhookController = TwilioWebhookController_1 = __decorate([
    (0, common_1.Controller)("webhooks/twilio"),
    __metadata("design:paramtypes", [communications_service_1.CommunicationsService])
], TwilioWebhookController);
//# sourceMappingURL=twilio-webhook.controller.js.map