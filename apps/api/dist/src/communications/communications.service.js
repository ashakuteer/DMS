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
var CommunicationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const twilio_whatsapp_service_1 = require("./twilio-whatsapp.service");
const client_1 = require("@prisma/client");
let CommunicationsService = CommunicationsService_1 = class CommunicationsService {
    constructor(prisma, twilioWhatsApp) {
        this.prisma = prisma;
        this.twilioWhatsApp = twilioWhatsApp;
        this.logger = new common_1.Logger(CommunicationsService_1.name);
    }
    isWhatsAppConfigured() {
        return this.twilioWhatsApp.isConfigured();
    }
    getWhatsAppDisableReason() {
        return this.twilioWhatsApp.getDisableReason();
    }
    isTemplateConfigured(templateKey) {
        return this.twilioWhatsApp.isTemplateConfigured(templateKey);
    }
    getConfiguredTemplates() {
        return this.twilioWhatsApp.getConfiguredTemplates();
    }
    getContentSidForKey(templateKey) {
        return this.twilioWhatsApp.getContentSidForKey(templateKey);
    }
    mapTwilioStatusToCommStatus(twilioStatus) {
        if (!twilioStatus)
            return client_1.CommStatus.QUEUED;
        const map = {
            accepted: client_1.CommStatus.QUEUED,
            queued: client_1.CommStatus.QUEUED,
            sending: client_1.CommStatus.SENT,
            sent: client_1.CommStatus.SENT,
            delivered: client_1.CommStatus.DELIVERED,
            read: client_1.CommStatus.READ,
            failed: client_1.CommStatus.FAILED,
            undelivered: client_1.CommStatus.UNDELIVERED,
        };
        return map[twilioStatus.toLowerCase()] || client_1.CommStatus.QUEUED;
    }
    async sendWhatsAppTemplate(dto, userId) {
        let validDonorId = null;
        if (dto.donorId) {
            const donor = await this.prisma.donor.findUnique({ where: { id: dto.donorId }, select: { id: true } });
            if (donor)
                validDonorId = donor.id;
        }
        const row = await this.prisma.communicationMessage.create({
            data: {
                donorId: validDonorId,
                donationId: dto.donationId || null,
                channel: client_1.CommChannel.WHATSAPP,
                provider: client_1.CommProvider.TWILIO,
                to: dto.toE164,
                status: client_1.CommStatus.QUEUED,
                templateName: dto.contentSid,
                templateKey: dto.templateKey || null,
                templateVariables: dto.variables || {},
                createdByUserId: userId || null,
            },
        });
        const result = await this.twilioWhatsApp.sendTemplate(dto.toE164, dto.contentSid, dto.variables);
        if (result.success) {
            const mappedStatus = this.mapTwilioStatusToCommStatus(result.status);
            const updated = await this.prisma.communicationMessage.update({
                where: { id: row.id },
                data: {
                    status: mappedStatus,
                    providerMessageId: result.messageSid,
                    sentAt: new Date(),
                },
            });
            return updated;
        }
        else {
            const updated = await this.prisma.communicationMessage.update({
                where: { id: row.id },
                data: {
                    status: client_1.CommStatus.FAILED,
                    errorCode: result.errorCode,
                    errorMessage: result.errorMessage,
                },
            });
            return updated;
        }
    }
    async sendByTemplateKey(templateKey, donorId, toE164, variables, userId, donationId) {
        const contentSid = this.twilioWhatsApp.getContentSidForKey(templateKey);
        if (!contentSid) {
            this.logger.warn(`Template key ${templateKey} has no configured Content SID. Skipping WhatsApp send.`);
            return {
                success: false,
                status: "not_configured",
                templateKey,
            };
        }
        if (!this.twilioWhatsApp.isConfigured()) {
            return {
                success: false,
                status: "not_configured",
                templateKey,
            };
        }
        const result = await this.sendWhatsAppTemplate({
            donorId,
            donationId,
            toE164,
            contentSid,
            variables,
            templateKey,
        }, userId);
        return {
            success: result.status !== client_1.CommStatus.FAILED,
            status: result.status?.toLowerCase() || "queued",
            messageId: result.id,
            templateKey,
        };
    }
    async sendFreeform(donorId, toE164, message, type, userId) {
        let validDonorId = null;
        if (donorId) {
            const donor = await this.prisma.donor.findUnique({ where: { id: donorId }, select: { id: true } });
            if (donor)
                validDonorId = donor.id;
        }
        const row = await this.prisma.communicationMessage.create({
            data: {
                donorId: validDonorId,
                channel: client_1.CommChannel.WHATSAPP,
                provider: client_1.CommProvider.TWILIO,
                to: toE164,
                status: client_1.CommStatus.QUEUED,
                templateKey: type || 'FREEFORM',
                templateVariables: { message },
                createdByUserId: userId || null,
            },
        });
        const result = await this.twilioWhatsApp.sendFreeform(toE164, message);
        if (result.success) {
            const mappedStatus = this.mapTwilioStatusToCommStatus(result.status);
            const updated = await this.prisma.communicationMessage.update({
                where: { id: row.id },
                data: {
                    status: mappedStatus,
                    providerMessageId: result.messageSid,
                    sentAt: new Date(),
                },
            });
            return { success: true, status: updated.status?.toLowerCase(), messageId: updated.id };
        }
        else {
            await this.prisma.communicationMessage.update({
                where: { id: row.id },
                data: {
                    status: client_1.CommStatus.FAILED,
                    errorCode: result.errorCode,
                    errorMessage: result.errorMessage,
                },
            });
            return { success: false, error: result.errorMessage };
        }
    }
    async getWhatsAppStatusForDonor(donorId, limit = 1) {
        return this.prisma.communicationMessage.findMany({
            where: {
                donorId,
                channel: client_1.CommChannel.WHATSAPP,
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                status: true,
                to: true,
                providerMessageId: true,
                templateKey: true,
                errorCode: true,
                errorMessage: true,
                sentAt: true,
                deliveredAt: true,
                createdAt: true,
            },
        });
    }
    async updateStatusFromWebhook(providerMessageId, twilioStatus, errorCode, errorMessage) {
        const statusMap = {
            accepted: client_1.CommStatus.QUEUED,
            queued: client_1.CommStatus.QUEUED,
            sending: client_1.CommStatus.SENT,
            sent: client_1.CommStatus.SENT,
            delivered: client_1.CommStatus.DELIVERED,
            read: client_1.CommStatus.READ,
            failed: client_1.CommStatus.FAILED,
            undelivered: client_1.CommStatus.UNDELIVERED,
        };
        const newStatus = statusMap[twilioStatus.toLowerCase()];
        if (!newStatus) {
            this.logger.warn(`Unknown Twilio status: ${twilioStatus}`);
            return null;
        }
        const existing = await this.prisma.communicationMessage.findFirst({
            where: { providerMessageId },
        });
        if (!existing) {
            this.logger.warn(`No CommunicationMessage found for providerMessageId: ${providerMessageId}`);
            return null;
        }
        const updateData = { status: newStatus };
        if (newStatus === client_1.CommStatus.DELIVERED) {
            updateData.deliveredAt = new Date();
        }
        if (newStatus === client_1.CommStatus.READ) {
            updateData.readAt = new Date();
        }
        if (newStatus === client_1.CommStatus.FAILED ||
            newStatus === client_1.CommStatus.UNDELIVERED) {
            if (errorCode)
                updateData.errorCode = errorCode;
            if (errorMessage)
                updateData.errorMessage = errorMessage;
        }
        const updated = await this.prisma.communicationMessage.update({
            where: { id: existing.id },
            data: updateData,
        });
        this.logger.log(`Message ${providerMessageId} status updated to ${newStatus}`);
        return updated;
    }
};
exports.CommunicationsService = CommunicationsService;
exports.CommunicationsService = CommunicationsService = CommunicationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        twilio_whatsapp_service_1.TwilioWhatsAppService])
], CommunicationsService);
//# sourceMappingURL=communications.service.js.map