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
exports.EmailController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const email_service_1 = require("./email.service");
const prisma_service_1 = require("../prisma/prisma.service");
const receipt_service_1 = require("../receipt/receipt.service");
const communication_log_service_1 = require("../communication-log/communication-log.service");
const audit_service_1 = require("../audit/audit.service");
let EmailController = class EmailController {
    constructor(emailService, prisma, receiptService, communicationLogService, auditService) {
        this.emailService = emailService;
        this.prisma = prisma;
        this.receiptService = receiptService;
        this.communicationLogService = communicationLogService;
        this.auditService = auditService;
    }
    getConfigStatus() {
        const status = this.emailService.getConfigStatus();
        return {
            configured: status.configured,
            smtpHost: status.smtpHost || 'NOT_SET',
            smtpUser: this.emailService.getMaskedSmtpUser(),
            fromEmail: status.fromEmail || 'NOT_SET',
            error: status.error || null,
        };
    }
    async testSend(body, req) {
        if (!body.toEmail) {
            throw new common_1.BadRequestException('toEmail is required');
        }
        const result = await this.emailService.sendEmail({
            to: body.toEmail,
            subject: 'DMS Email Test',
            html: '<h2>Email is working!</h2><p>This is a test email from your Donor Management System.</p>',
            text: 'Email is working! This is a test email from your Donor Management System.',
            featureType: 'TEST',
        });
        return result;
    }
    async sendEmail(dto, req) {
        const { donorId, donationId, templateId, toEmail, subject, body, attachReceipt } = dto;
        if (!toEmail) {
            throw new common_1.BadRequestException('Recipient email is required');
        }
        if (!subject || !body) {
            throw new common_1.BadRequestException('Subject and body are required');
        }
        const donor = await this.prisma.donor.findUnique({
            where: { id: donorId },
        });
        if (!donor) {
            throw new common_1.NotFoundException('Donor not found');
        }
        let pdfBuffer;
        let receiptNumber;
        if (attachReceipt && donationId) {
            const donation = await this.prisma.donation.findUnique({
                where: { id: donationId },
                include: { donor: true },
            });
            if (!donation) {
                throw new common_1.NotFoundException('Donation not found');
            }
            if (donation.receiptNumber) {
                receiptNumber = donation.receiptNumber;
                const donorName = [donation.donor.firstName, donation.donor.middleName, donation.donor.lastName]
                    .filter(Boolean)
                    .join(' ');
                pdfBuffer = await this.receiptService.generateReceiptPDF({
                    receiptNumber: donation.receiptNumber,
                    donationDate: donation.donationDate,
                    donorName,
                    donationAmount: Number(donation.donationAmount),
                    currency: donation.currency,
                    paymentMode: donation.donationMode,
                    donationType: donation.donationType,
                    remarks: donation.remarks || undefined,
                    donorAddress: [donation.donor.address, donation.donor.city, donation.donor.state, donation.donor.pincode]
                        .filter(Boolean)
                        .join(', ') || undefined,
                    donorEmail: donation.donor.personalEmail || donation.donor.officialEmail || undefined,
                    donorPAN: donation.donor.pan || undefined,
                    transactionRef: donation.transactionId || undefined,
                });
            }
        }
        const htmlBody = body.replace(/\n/g, '<br/>');
        const brandedHtml = await this.emailService.wrapWithBranding(htmlBody);
        const result = await this.emailService.sendEmail({
            to: toEmail,
            subject,
            html: brandedHtml,
            text: body,
            attachments: pdfBuffer && receiptNumber
                ? [
                    {
                        filename: `Receipt-${receiptNumber}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    },
                ]
                : undefined,
            featureType: attachReceipt ? 'RECEIPT' : 'MANUAL',
        });
        if (!result.success) {
            await this.prisma.emailLog.create({
                data: {
                    donorId,
                    donationId: donationId || null,
                    templateId: templateId || null,
                    toEmail,
                    subject,
                    status: 'FAILED',
                    messageId: null,
                    errorMessage: result.error || 'Unknown error',
                    sentById: req.user.id,
                },
            });
            await this.communicationLogService.logEmail({
                donorId,
                donationId: donationId || undefined,
                templateId: templateId || undefined,
                toEmail,
                subject,
                messagePreview: body.substring(0, 200),
                status: 'FAILED',
                errorMessage: result.error,
                sentById: req.user.id,
            });
            throw new common_1.BadRequestException(result.error || 'Email delivery failed. Please check SMTP settings.');
        }
        await this.prisma.emailLog.create({
            data: {
                donorId,
                donationId: donationId || null,
                templateId: templateId || null,
                toEmail,
                subject,
                status: 'SENT',
                messageId: result.messageId || null,
                errorMessage: null,
                sentById: req.user.id,
            },
        });
        await this.communicationLogService.logEmail({
            donorId,
            donationId: donationId || undefined,
            templateId: templateId || undefined,
            toEmail,
            subject,
            messagePreview: body.substring(0, 200),
            status: 'SENT',
            errorMessage: undefined,
            sentById: req.user.id,
        });
        await this.auditService.logEmailSend(req.user.id, 'Donor', donorId, {
            toEmail,
            subject,
            donationId,
            templateId,
            attachReceipt: !!attachReceipt,
        });
        return {
            success: true,
            messageId: result.messageId,
            message: 'Email sent successfully',
        };
    }
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Get)('config-status'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmailController.prototype, "getConfigStatus", null);
__decorate([
    (0, common_1.Post)('test-send'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "testSend", null);
__decorate([
    (0, common_1.Post)('send'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendEmail", null);
exports.EmailController = EmailController = __decorate([
    (0, common_1.Controller)('email'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [email_service_1.EmailService,
        prisma_service_1.PrismaService,
        receipt_service_1.ReceiptService,
        communication_log_service_1.CommunicationLogService,
        audit_service_1.AuditService])
], EmailController);
//# sourceMappingURL=email.controller.js.map