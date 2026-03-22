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
var CommunicationLogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationLogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CommunicationLogService = CommunicationLogService_1 = class CommunicationLogService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(CommunicationLogService_1.name);
    }
    async create(data) {
        return this.prisma.communicationLog.create({
            data: {
                donorId: data.donorId,
                donationId: data.donationId || null,
                templateId: data.templateId || null,
                channel: data.channel,
                type: data.type,
                status: data.status,
                recipient: data.recipient || null,
                subject: data.subject || null,
                messagePreview: data.messagePreview || null,
                errorMessage: data.errorMessage || null,
                metadata: data.metadata || undefined,
                sentById: data.sentById || null,
            },
        });
    }
    async findByDonorId(donorId) {
        return this.prisma.communicationLog.findMany({
            where: { donorId },
            include: {
                sentBy: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                template: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
                donation: {
                    select: {
                        id: true,
                        receiptNumber: true,
                        donationAmount: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findByDonationId(donationId) {
        return this.prisma.communicationLog.findMany({
            where: { donationId },
            include: {
                sentBy: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                template: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async delete(id) {
        return this.prisma.communicationLog.delete({
            where: { id },
        });
    }
    async logEmail(params) {
        const commType = params.type || this.inferEmailType(params.subject);
        return this.create({
            donorId: params.donorId,
            donationId: params.donationId,
            templateId: params.templateId,
            channel: client_1.CommunicationChannel.EMAIL,
            type: commType,
            status: params.status === 'SENT' ? client_1.CommunicationStatus.SENT : client_1.CommunicationStatus.FAILED,
            recipient: params.toEmail,
            subject: params.subject,
            messagePreview: params.messagePreview?.substring(0, 200),
            errorMessage: params.errorMessage,
            sentById: params.sentById,
        });
    }
    async logWhatsApp(params) {
        const commType = params.type || client_1.CommunicationType.GENERAL;
        return this.create({
            donorId: params.donorId,
            donationId: params.donationId,
            templateId: params.templateId,
            channel: client_1.CommunicationChannel.WHATSAPP,
            type: commType,
            status: client_1.CommunicationStatus.TRIGGERED,
            recipient: params.phoneNumber,
            messagePreview: params.messagePreview?.substring(0, 200),
            sentById: params.sentById,
        });
    }
    async logPostDonationAction(params) {
        const actionDescriptions = {
            send_email: 'Sent thank-you email with receipt',
            send_whatsapp: 'Opened WhatsApp with thank-you message',
            remind_later: 'Set 60-day follow-up reminder',
            skip: 'Skipped post-donation action',
        };
        const channelMap = {
            send_email: client_1.CommunicationChannel.EMAIL,
            send_whatsapp: client_1.CommunicationChannel.WHATSAPP,
            remind_later: client_1.CommunicationChannel.EMAIL,
            skip: client_1.CommunicationChannel.EMAIL,
        };
        if (params.action === 'remind_later') {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 60);
            await this.prisma.reminder.create({
                data: {
                    donorId: params.donorId,
                    donationId: params.donationId || null,
                    type: 'FOLLOW_UP',
                    title: 'Post-donation follow-up',
                    description: `60-day follow-up reminder set after donation`,
                    dueDate,
                    status: 'PENDING',
                    createdById: params.sentById,
                },
            });
        }
        return this.create({
            donorId: params.donorId,
            donationId: params.donationId,
            channel: channelMap[params.action],
            type: client_1.CommunicationType.GENERAL,
            status: client_1.CommunicationStatus.TRIGGERED,
            messagePreview: `Post-donation action (${params.userRole}): ${actionDescriptions[params.action]}`,
            sentById: params.sentById,
            metadata: { action: params.action, userRole: params.userRole },
        });
    }
    inferEmailType(subject) {
        const lowerSubject = subject.toLowerCase();
        if (lowerSubject.includes('thank') || lowerSubject.includes('appreciation')) {
            return client_1.CommunicationType.THANK_YOU;
        }
        if (lowerSubject.includes('receipt')) {
            return client_1.CommunicationType.RECEIPT;
        }
        if (lowerSubject.includes('follow') || lowerSubject.includes('reminder')) {
            return client_1.CommunicationType.FOLLOW_UP;
        }
        if (lowerSubject.includes('greeting') || lowerSubject.includes('birthday') || lowerSubject.includes('anniversary') || lowerSubject.includes('festival')) {
            return client_1.CommunicationType.GREETING;
        }
        return client_1.CommunicationType.GENERAL;
    }
};
exports.CommunicationLogService = CommunicationLogService;
exports.CommunicationLogService = CommunicationLogService = CommunicationLogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommunicationLogService);
//# sourceMappingURL=communication-log.service.js.map