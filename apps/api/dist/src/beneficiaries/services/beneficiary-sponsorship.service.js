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
var BeneficiarySponsorshipService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiarySponsorshipService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const communications_service_1 = require("../../communications/communications.service");
const email_service_1 = require("../../email/email.service");
const communication_log_service_1 = require("../../communication-log/communication-log.service");
const client_1 = require("@prisma/client");
let BeneficiarySponsorshipService = BeneficiarySponsorshipService_1 = class BeneficiarySponsorshipService {
    constructor(prisma, communicationsService, emailService, communicationLogService) {
        this.prisma = prisma;
        this.communicationsService = communicationsService;
        this.emailService = emailService;
        this.communicationLogService = communicationLogService;
        this.logger = new common_1.Logger(BeneficiarySponsorshipService_1.name);
    }
    async getSponsors(beneficiaryId) {
        const beneficiary = await this.prisma.beneficiary.findFirst({
            where: { id: beneficiaryId, isDeleted: false },
            select: { id: true },
        });
        if (!beneficiary) {
            throw new common_1.NotFoundException("Beneficiary not found");
        }
        return this.prisma.sponsorship.findMany({
            where: { beneficiaryId },
            include: {
                donor: {
                    select: {
                        id: true,
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        primaryPhone: true,
                        personalEmail: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async addSponsor(user, beneficiaryId, dto) {
        const { donorId, sponsorshipType, amount, inKindItem, frequency, startDate, status, notes, currency } = dto;
        this.logger.log(`addSponsor: beneficiaryId=${beneficiaryId}, donorId=${donorId}, type=${sponsorshipType}`);
        console.log("Saving sponsorship (from beneficiary side):", { beneficiaryId, ...dto });
        try {
            return await this.prisma.sponsorship.create({
                data: {
                    donorId,
                    beneficiaryId,
                    sponsorshipType: sponsorshipType,
                    amount: amount ? parseFloat(amount) : null,
                    inKindItem: inKindItem || null,
                    currency: currency || "INR",
                    frequency: (frequency || "ADHOC"),
                    startDate: startDate ? new Date(startDate) : null,
                    status: (status || "ACTIVE"),
                    isActive: (status || "ACTIVE") === "ACTIVE",
                    notes: notes || null,
                },
                include: {
                    donor: {
                        select: { id: true, donorCode: true, firstName: true, lastName: true, primaryPhone: true, personalEmail: true },
                    },
                },
            });
        }
        catch (err) {
            this.logger.error(`addSponsor failed: ${err?.message}`);
            if (err?.code === "P2002")
                throw new common_1.ConflictException(`A ${sponsorshipType} sponsorship already exists for this donor and beneficiary.`);
            if (err?.code === "P2003")
                throw new common_1.BadRequestException("Invalid donorId or beneficiaryId.");
            throw err;
        }
    }
    async getSponsorshipsByBeneficiary(beneficiaryId) {
        return this.prisma.sponsorship.findMany({
            where: { beneficiaryId },
            include: {
                donor: {
                    select: {
                        id: true,
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        primaryPhone: true,
                        personalEmail: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async updateSponsorship(user, id, dto) {
        return this.prisma.sponsorship.update({
            where: { id },
            data: dto,
        });
    }
    async deleteSponsorship(id) {
        return this.prisma.sponsorship.delete({
            where: { id },
        });
    }
    async getSponsorshipHistory(sponsorshipId) {
        return this.prisma.sponsorshipStatusHistory.findMany({
            where: { sponsorshipId },
            include: {
                changedBy: { select: { id: true, name: true } },
            },
            orderBy: { changedAt: "desc" },
        });
    }
    async getSponsorsByDonor(donorId) {
        return this.prisma.sponsorship.findMany({
            where: { donorId },
            include: {
                beneficiary: {
                    select: {
                        id: true,
                        code: true,
                        fullName: true,
                        homeType: true,
                        photoUrl: true,
                        status: true,
                        updates: {
                            select: { id: true, title: true, content: true, updateType: true, createdAt: true },
                            orderBy: { createdAt: "desc" },
                            take: 3,
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async createSponsorshipForDonor(user, dto) {
        console.log("Saving sponsorship:", JSON.stringify(dto, null, 2));
        this.logger.log(`Creating sponsorship: donorId=${dto.donorId}, beneficiaryId=${dto.beneficiaryId}, type=${dto.sponsorshipType}`);
        if (!dto.donorId)
            throw new common_1.BadRequestException("donorId is required");
        if (!dto.beneficiaryId)
            throw new common_1.BadRequestException("beneficiaryId is required");
        if (!dto.sponsorshipType)
            throw new common_1.BadRequestException("sponsorshipType is required");
        try {
            const result = await this.prisma.sponsorship.create({
                data: {
                    donorId: dto.donorId,
                    beneficiaryId: dto.beneficiaryId,
                    sponsorshipType: dto.sponsorshipType,
                    amount: dto.amount ?? null,
                    currency: dto.currency ?? "INR",
                    frequency: (dto.frequency ?? "MONTHLY"),
                    startDate: dto.startDate ? new Date(dto.startDate) : null,
                    status: (dto.status ?? "ACTIVE"),
                    notes: dto.notes ?? null,
                    isActive: (dto.status ?? "ACTIVE") === "ACTIVE",
                },
                include: {
                    beneficiary: {
                        select: {
                            id: true,
                            code: true,
                            fullName: true,
                            homeType: true,
                            photoUrl: true,
                            status: true,
                        },
                    },
                },
            });
            this.logger.log(`Sponsorship created successfully: id=${result.id}`);
            return result;
        }
        catch (err) {
            this.logger.error(`Failed to create sponsorship: ${err?.message}`, err?.stack);
            if (err?.code === "P2002") {
                throw new common_1.ConflictException(`A ${dto.sponsorshipType} sponsorship already exists for this donor and beneficiary. ` +
                    `Please choose a different sponsorship type or update the existing one.`);
            }
            if (err?.code === "P2003") {
                throw new common_1.BadRequestException("Invalid donorId or beneficiaryId — record not found.");
            }
            throw err;
        }
    }
    async getSponsorshipSummary() {
        return this.prisma.sponsorship.count();
    }
    async sendUpdateToSponsor(userId, sponsorshipId) {
        const sponsorship = await this.prisma.sponsorship.findUnique({
            where: { id: sponsorshipId },
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
                beneficiary: {
                    select: { id: true, fullName: true },
                },
            },
        });
        if (!sponsorship)
            throw new common_1.NotFoundException("Sponsorship not found");
        const latestUpdate = await this.prisma.beneficiaryUpdate.findFirst({
            where: { beneficiaryId: sponsorship.beneficiaryId, isPrivate: false },
            orderBy: { createdAt: "desc" },
            select: { title: true, content: true },
        });
        const { donor, beneficiary } = sponsorship;
        const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(" ") || "Valued Sponsor";
        const beneficiaryName = beneficiary.fullName;
        const updateBody = latestUpdate
            ? `*${latestUpdate.title}*\n${latestUpdate.content}`
            : `Thank you for your continued support for ${beneficiaryName}.`;
        const message = `Dear ${donorName},\n\nUpdate about ${beneficiaryName}:\n\n${updateBody}`;
        const emailSubject = `Update about ${beneficiaryName}`;
        const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d6a4f;">Update about ${beneficiaryName}</h2>
        <p>Dear ${donorName},</p>
        ${latestUpdate ? `<h3>${latestUpdate.title}</h3><p style="white-space: pre-wrap;">${latestUpdate.content}</p>` : `<p>Thank you for your continued support for ${beneficiaryName}.</p>`}
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px;">This message was sent from the Asha Kuteer Foundation.</p>
      </div>
    `;
        const results = {};
        const { normalizeToE164 } = await Promise.resolve().then(() => __importStar(require("../../common/phone-utils")));
        const rawPhone = donor.whatsappPhone || donor.primaryPhone;
        if (rawPhone) {
            const e164 = normalizeToE164(rawPhone, donor.primaryPhoneCode);
            if (e164) {
                try {
                    await this.communicationsService.sendFreeform(donor.id, e164, message, "UPDATE_NOTIFICATION", userId);
                    results.whatsapp = "sent";
                    this.logger.log(`WhatsApp sent to donor ${donor.id} for sponsorship ${sponsorshipId}`);
                }
                catch (err) {
                    results.whatsapp = "failed";
                    this.logger.warn(`WhatsApp failed for donor ${donor.id}: ${err?.message}`);
                }
            }
        }
        const donorEmail = donor.personalEmail || donor.officialEmail;
        if (donorEmail) {
            try {
                const result = await this.emailService.sendEmail({
                    to: donorEmail,
                    subject: emailSubject,
                    html: emailHtml,
                    text: message,
                    featureType: "MANUAL",
                });
                await this.communicationLogService.logEmail({
                    donorId: donor.id,
                    toEmail: donorEmail,
                    subject: emailSubject,
                    messagePreview: `Manual update notification: ${latestUpdate?.title ?? "(no update)"}`,
                    status: result.success ? "SENT" : "FAILED",
                    errorMessage: result.error,
                    sentById: userId,
                    type: client_1.CommunicationType.GENERAL,
                });
                results.email = result.success ? "sent" : "failed";
            }
            catch (err) {
                results.email = "failed";
                this.logger.warn(`Email failed for donor ${donor.id}: ${err?.message}`);
            }
        }
        return {
            success: true,
            donorName,
            beneficiaryName,
            results,
            latestUpdateTitle: latestUpdate?.title ?? null,
        };
    }
};
exports.BeneficiarySponsorshipService = BeneficiarySponsorshipService;
exports.BeneficiarySponsorshipService = BeneficiarySponsorshipService = BeneficiarySponsorshipService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        communications_service_1.CommunicationsService,
        email_service_1.EmailService,
        communication_log_service_1.CommunicationLogService])
], BeneficiarySponsorshipService);
//# sourceMappingURL=beneficiary-sponsorship.service.js.map