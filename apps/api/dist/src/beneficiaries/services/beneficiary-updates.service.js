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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BeneficiaryUpdatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiaryUpdatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const communications_service_1 = require("../../communications/communications.service");
const communication_log_service_1 = require("../../communication-log/communication-log.service");
const email_service_1 = require("../../email/email.service");
const client_1 = require("@prisma/client");
let BeneficiaryUpdatesService = BeneficiaryUpdatesService_1 = class BeneficiaryUpdatesService {
    constructor(prisma, communicationsService, communicationLogService, emailService) {
        this.prisma = prisma;
        this.communicationsService = communicationsService;
        this.communicationLogService = communicationLogService;
        this.emailService = emailService;
        this.logger = new common_1.Logger(BeneficiaryUpdatesService_1.name);
    }
    async getUpdates(beneficiaryId) {
        return this.prisma.beneficiaryUpdate.findMany({
            where: { beneficiaryId },
            include: {
                createdBy: { select: { id: true, name: true } },
                attachments: {
                    include: {
                        document: {
                            select: { id: true, title: true, storagePath: true, mimeType: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async addUpdate(user, beneficiaryId, dto) {
        const beneficiary = await this.prisma.beneficiary.findFirst({
            where: { id: beneficiaryId, isDeleted: false },
            select: { id: true, fullName: true },
        });
        if (!beneficiary)
            throw new common_1.NotFoundException("Beneficiary not found");
        const update = await this.prisma.beneficiaryUpdate.create({
            data: {
                beneficiaryId,
                title: dto.title,
                content: dto.content,
                updateType: dto.updateType || "GENERAL",
                isPrivate: dto.isPrivate ?? false,
                createdById: user.id,
            },
            include: {
                createdBy: { select: { id: true, name: true } },
            },
        });
        if (!dto.isPrivate) {
            this.notifySponsors(beneficiary.fullName, beneficiaryId, dto.title, dto.content, user.id).catch((err) => this.logger.error(`Sponsor notification failed for beneficiary ${beneficiaryId}: ${err?.message}`));
        }
        return update;
    }
    async notifySponsors(beneficiaryName, beneficiaryId, title, content, userId) {
        const sponsorships = await this.prisma.sponsorship.findMany({
            where: { beneficiaryId, isActive: true, status: "ACTIVE" },
            include: {
                donor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        personalEmail: true,
                        officialEmail: true,
                        whatsappPhone: true,
                        primaryPhone: true,
                        primaryPhoneCode: true,
                    },
                },
            },
        });
        if (sponsorships.length === 0) {
            this.logger.log(`No active sponsors for beneficiary ${beneficiaryId}, skipping notifications`);
            return;
        }
        const { normalizeToE164 } = await Promise.resolve().then(() => __importStar(require("../../common/phone-utils")));
        const emailSubject = `Update about ${beneficiaryName}: ${title}`;
        for (const { donor } of sponsorships) {
            const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(" ") || "Valued Sponsor";
            const personalizedMessage = `Dear ${donorName},\n\nUpdate about ${beneficiaryName}:\n\n*${title}*\n${content}`;
            const personalizedHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d6a4f;">Update about ${beneficiaryName}</h2>
        <p>Dear ${donorName},</p>
        <h3>${title}</h3>
        <p style="white-space: pre-wrap;">${content}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px;">This is an automated notification from the Asha Kuteer Foundation.</p>
      </div>
    `;
            const whatsappPhone = donor.whatsappPhone || donor.primaryPhone;
            if (whatsappPhone) {
                const e164 = normalizeToE164(whatsappPhone, donor.primaryPhoneCode);
                if (e164) {
                    try {
                        await this.communicationsService.sendFreeform(donor.id, e164, personalizedMessage, "UPDATE_NOTIFICATION", userId);
                        this.logger.log(`WhatsApp notification sent to donor ${donor.id} for beneficiary ${beneficiaryId}`);
                    }
                    catch (err) {
                        this.logger.warn(`WhatsApp notification failed for donor ${donor.id}: ${err?.message}`);
                    }
                }
            }
            const donorEmail = donor.personalEmail || donor.officialEmail;
            if (donorEmail) {
                try {
                    const result = await this.emailService.sendEmail({
                        to: donorEmail,
                        subject: emailSubject,
                        html: personalizedHtml,
                        text: personalizedMessage,
                        featureType: "AUTO",
                    });
                    await this.communicationLogService.logEmail({
                        donorId: donor.id,
                        toEmail: donorEmail,
                        subject: emailSubject,
                        messagePreview: `Update notification: ${title}`,
                        status: result.success ? "SENT" : "FAILED",
                        errorMessage: result.error,
                        sentById: userId,
                        type: client_1.CommunicationType.GENERAL,
                    });
                    this.logger.log(`Email notification sent to donor ${donor.id} (${donorEmail}) for beneficiary ${beneficiaryId}`);
                }
                catch (err) {
                    this.logger.warn(`Email notification failed for donor ${donor.id}: ${err?.message}`);
                }
            }
            if (!whatsappPhone && !donorEmail) {
                this.logger.warn(`Donor ${donor.id} has no contact info — notification skipped`);
            }
        }
        this.logger.log(`Sponsor notifications dispatched for beneficiary ${beneficiaryId}: ${sponsorships.length} sponsor(s)`);
    }
    async getUpdateWithBeneficiary(updateId) {
        const update = await this.prisma.beneficiaryUpdate.findUnique({
            where: { id: updateId },
            include: {
                beneficiary: { select: { id: true, fullName: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });
        if (!update)
            throw new common_1.NotFoundException("Update not found");
        return update;
    }
    async sendUpdateToSponsors(user, updateId) {
        const update = await this.prisma.beneficiaryUpdate.findUnique({
            where: { id: updateId },
        });
        if (!update)
            throw new common_1.NotFoundException("Update not found");
        const sponsorships = await this.prisma.sponsorship.findMany({
            where: {
                beneficiaryId: update.beneficiaryId,
                isActive: true,
                status: "ACTIVE",
            },
            select: { donorId: true },
        });
        if (sponsorships.length === 0) {
            return { success: true, dispatchCount: 0 };
        }
        const dispatches = await this.prisma.sponsorUpdateDispatch.createMany({
            data: sponsorships.map((s) => ({
                updateId,
                donorId: s.donorId,
                channel: "EMAIL",
                status: "QUEUED",
            })),
            skipDuplicates: true,
        });
        return { success: true, dispatchCount: dispatches.count };
    }
    async deleteUpdate(updateId) {
        const existing = await this.prisma.beneficiaryUpdate.findUnique({
            where: { id: updateId },
        });
        if (!existing) {
            throw new common_1.NotFoundException("Update not found");
        }
        await this.prisma.beneficiaryUpdate.delete({
            where: { id: updateId },
        });
        return { success: true };
    }
    async markDispatchCopied(id) {
        return this.prisma.sponsorUpdateDispatch.update({
            where: { id },
            data: { status: "SENT" },
        });
    }
};
exports.BeneficiaryUpdatesService = BeneficiaryUpdatesService;
exports.BeneficiaryUpdatesService = BeneficiaryUpdatesService = BeneficiaryUpdatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        communications_service_1.CommunicationsService,
        communication_log_service_1.CommunicationLogService,
        email_service_1.EmailService])
], BeneficiaryUpdatesService);
//# sourceMappingURL=beneficiary-updates.service.js.map