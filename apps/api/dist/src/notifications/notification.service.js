"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const communications_service_1 = require("../communications/communications.service");
const communication_log_service_1 = require("../communication-log/communication-log.service");
const email_service_1 = require("../email/email.service");
const receipt_service_1 = require("../receipt/receipt.service");
const client_1 = require("@prisma/client");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(prisma, communicationsService, communicationLogService, emailService, receiptService) {
        this.prisma = prisma;
        this.communicationsService = communicationsService;
        this.communicationLogService = communicationLogService;
        this.emailService = emailService;
        this.receiptService = receiptService;
        this.logger = new common_1.Logger(NotificationService_1.name);
    }
    async hasDonationNotificationBeenSent(donationId, channel) {
        const existingMessage = await this.prisma.communicationMessage.findFirst({
            where: {
                donationId,
                channel: channel === 'WHATSAPP' ? client_1.CommChannel.WHATSAPP : client_1.CommChannel.EMAIL,
                status: { notIn: ['FAILED', 'UNDELIVERED'] },
            },
        });
        if (existingMessage)
            return true;
        const existingLog = await this.prisma.communicationLog.findFirst({
            where: {
                donationId,
                channel: channel === 'EMAIL' ? client_1.CommunicationChannel.EMAIL : client_1.CommunicationChannel.WHATSAPP,
                status: { notIn: ['FAILED'] },
            },
        });
        return !!existingLog;
    }
    async sendDonationEmail(params) {
        const already = await this.hasDonationNotificationBeenSent(params.donationId, 'EMAIL');
        if (already) {
            this.logger.log(`Donation email already sent for donationId=${params.donationId}, skipping`);
            return { status: 'already_sent', skipped: true };
        }
        const donor = await this.prisma.donor.findUnique({
            where: { id: params.donorId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                personalEmail: true,
                officialEmail: true,
            },
        });
        if (!donor)
            return { status: 'skipped_no_donor' };
        const donorEmail = donor.personalEmail || donor.officialEmail;
        if (!donorEmail)
            return { status: 'skipped_no_email' };
        const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ') || 'Valued Donor';
        try {
            const kindDonation = (0, receipt_service_1.isInKindDonation)(params.donationType);
            const effectiveEmailType = kindDonation ? 'KIND' : (params.emailType || 'GENERAL');
            let pdfBuffer;
            if (kindDonation) {
                pdfBuffer = await this.receiptService.generateAcknowledgementPDF({
                    ackNumber: params.receiptNumber,
                    donationDate: params.donationDate,
                    donorName,
                    donationType: params.donationType,
                    currency: params.currency,
                });
            }
            else {
                pdfBuffer = await this.receiptService.generateReceiptPDF({
                    receiptNumber: params.receiptNumber,
                    donationDate: params.donationDate,
                    donorName,
                    donationAmount: params.donationAmount,
                    currency: params.currency,
                    paymentMode: params.donationMode,
                    donationType: params.donationType,
                    donorPAN: params.donorPAN,
                    receiptType: effectiveEmailType === 'TAX' ? 'TAX' : 'GENERAL',
                });
            }
            const result = await this.emailService.sendDonationReceipt(donorEmail, donorName, params.receiptNumber, pdfBuffer, {
                emailType: effectiveEmailType,
                donationAmount: params.donationAmount,
                currency: params.currency,
                donationDate: params.donationDate,
                donationMode: params.donationMode,
                donationType: params.donationType,
                donorPAN: params.donorPAN,
            });
            await this.communicationLogService.logEmail({
                donorId: params.donorId,
                donationId: params.donationId,
                toEmail: donorEmail,
                subject: `Donation Receipt - ${params.receiptNumber}`,
                messagePreview: `Receipt email sent for ${params.receiptNumber}`,
                status: result.success ? 'SENT' : 'FAILED',
                errorMessage: result.error,
                sentById: params.userId,
                type: client_1.CommunicationType.RECEIPT,
            });
            return { status: result.success ? 'sent' : 'failed' };
        }
        catch (error) {
            this.logger.error(`Donation email error for ${params.donationId}: ${error?.message}`);
            return { status: 'failed' };
        }
    }
    async sendDonationWhatsApp(params) {
        const already = await this.hasDonationNotificationBeenSent(params.donationId, 'WHATSAPP');
        if (already) {
            this.logger.log(`Donation WhatsApp already sent for donationId=${params.donationId}, skipping`);
            return { status: 'already_sent', skipped: true };
        }
        const donor = await this.prisma.donor.findUnique({
            where: { id: params.donorId },
            select: {
                primaryPhone: true,
                primaryPhoneCode: true,
                whatsappPhone: true,
                firstName: true,
                lastName: true,
            },
        });
        if (!donor)
            return { status: 'skipped_no_donor' };
        const { normalizeToE164 } = await Promise.resolve().then(() => __importStar(require('../common/phone-utils')));
        const rawPhone = donor.whatsappPhone || donor.primaryPhone;
        if (!rawPhone)
            return { status: 'skipped_no_phone' };
        const e164 = normalizeToE164(rawPhone, donor.primaryPhoneCode);
        if (!e164)
            return { status: 'skipped_invalid_phone' };
        const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ') || 'Valued Donor';
        try {
            const result = await this.communicationsService.sendByTemplateKey('DONATION_THANK_YOU', params.donorId, e164, {
                '1': donorName,
                '2': params.donationType || 'General',
                '3': `${params.currency} ${params.donationAmount}`,
            }, params.userId, params.donationId);
            return {
                status: result.status || 'queued',
                messageId: result.messageId,
            };
        }
        catch (error) {
            this.logger.error(`Donation WhatsApp error for ${params.donationId}: ${error?.message}`);
            return { status: 'failed' };
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        communications_service_1.CommunicationsService,
        communication_log_service_1.CommunicationLogService,
        email_service_1.EmailService,
        receipt_service_1.ReceiptService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map