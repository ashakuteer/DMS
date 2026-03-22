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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const communications_service_1 = require("./communications.service");
const phone_utils_1 = require("../common/phone-utils");
let CommunicationsController = class CommunicationsController {
    constructor(service) {
        this.service = service;
    }
    async sendWhatsAppTemplate(body, req) {
        if (!body.toE164 || !body.contentSid) {
            throw new common_1.HttpException("toE164 and contentSid are required", common_1.HttpStatus.BAD_REQUEST);
        }
        const normalized = (0, phone_utils_1.normalizeToE164)(body.toE164) || body.toE164;
        if (!/^\+\d{10,15}$/.test(normalized)) {
            throw new common_1.HttpException("toE164 must be a valid E.164 phone number (e.g. +919876543210)", common_1.HttpStatus.BAD_REQUEST);
        }
        const result = await this.service.sendWhatsAppTemplate({
            donorId: body.donorId,
            toE164: normalized,
            contentSid: body.contentSid,
            variables: body.variables,
        }, req.user?.id);
        return result;
    }
    async sendByTemplateKey(body, req) {
        if (!body.donorId || !body.toE164 || !body.templateKey) {
            throw new common_1.HttpException("donorId, toE164 and templateKey are required", common_1.HttpStatus.BAD_REQUEST);
        }
        const validKeys = [
            "DONATION_THANK_YOU",
            "PLEDGE_DUE",
            "SPECIAL_DAY_WISH",
            "FOLLOWUP_REMINDER",
        ];
        if (!validKeys.includes(body.templateKey)) {
            throw new common_1.HttpException(`Invalid templateKey. Valid values: ${validKeys.join(", ")}`, common_1.HttpStatus.BAD_REQUEST);
        }
        const normalizedPhone = (0, phone_utils_1.normalizeToE164)(body.toE164) || body.toE164;
        if (!/^\+\d{10,15}$/.test(normalizedPhone)) {
            throw new common_1.HttpException("toE164 must be a valid E.164 phone number (e.g. +919876543210)", common_1.HttpStatus.BAD_REQUEST);
        }
        const result = await this.service.sendByTemplateKey(body.templateKey, body.donorId, normalizedPhone, body.variables, req.user?.id);
        return result;
    }
    async sendFreeform(body, req) {
        if (!body.toE164 || !body.message) {
            throw new common_1.HttpException("toE164 and message are required", common_1.HttpStatus.BAD_REQUEST);
        }
        const normalizedPhone = (0, phone_utils_1.normalizeToE164)(body.toE164) || body.toE164;
        if (!/^\+\d{10,15}$/.test(normalizedPhone)) {
            throw new common_1.HttpException("toE164 must be a valid E.164 phone number (e.g. +919876543210)", common_1.HttpStatus.BAD_REQUEST);
        }
        return this.service.sendFreeform(body.donorId || '', normalizedPhone, body.message, body.type, req.user?.id);
    }
    async getConfiguredTemplates() {
        return {
            configured: this.service.isWhatsAppConfigured(),
            templates: this.service.getConfiguredTemplates(),
        };
    }
};
exports.CommunicationsController = CommunicationsController;
__decorate([
    (0, common_1.Post)("whatsapp/send-template"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommunicationsController.prototype, "sendWhatsAppTemplate", null);
__decorate([
    (0, common_1.Post)("whatsapp/send-by-key"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommunicationsController.prototype, "sendByTemplateKey", null);
__decorate([
    (0, common_1.Post)("whatsapp/send-freeform"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommunicationsController.prototype, "sendFreeform", null);
__decorate([
    (0, common_1.Get)("whatsapp/templates"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommunicationsController.prototype, "getConfiguredTemplates", null);
exports.CommunicationsController = CommunicationsController = __decorate([
    (0, common_1.Controller)("communications"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [communications_service_1.CommunicationsService])
], CommunicationsController);
//# sourceMappingURL=communications.controller.js.map