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
var BroadcastingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const communications_service_1 = require("../communications/communications.service");
const email_service_1 = require("../email/email.service");
const audit_service_1 = require("../audit/audit.service");
const phone_utils_1 = require("../common/phone-utils");
const client_1 = require("@prisma/client");
let BroadcastingService = BroadcastingService_1 = class BroadcastingService {
    constructor(prisma, communicationsService, emailService, auditService) {
        this.prisma = prisma;
        this.communicationsService = communicationsService;
        this.emailService = emailService;
        this.auditService = auditService;
        this.logger = new common_1.Logger(BroadcastingService_1.name);
    }
    buildWhereClause(filters) {
        const where = { isDeleted: false };
        if (filters.gender)
            where.gender = filters.gender;
        if (filters.religion)
            where.religion = { contains: filters.religion, mode: 'insensitive' };
        if (filters.city)
            where.city = { contains: filters.city, mode: 'insensitive' };
        if (filters.country)
            where.country = { contains: filters.country, mode: 'insensitive' };
        if (filters.category)
            where.category = filters.category;
        if (filters.assignedToUserId)
            where.assignedToUserId = filters.assignedToUserId;
        if (filters.engagementLevel)
            where.engagementLevel = filters.engagementLevel;
        if (filters.healthStatus)
            where.healthStatus = filters.healthStatus;
        if (filters.supportPreferences && filters.supportPreferences.length > 0) {
            where.supportPreferences = { hasSome: filters.supportPreferences };
        }
        if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
            where.approximateAge = {};
            if (filters.ageMin !== undefined)
                where.approximateAge.gte = filters.ageMin;
            if (filters.ageMax !== undefined)
                where.approximateAge.lte = filters.ageMax;
        }
        if (filters.donationFrequencies && filters.donationFrequencies.length > 0) {
            where.donationFrequency = { in: filters.donationFrequencies };
        }
        else if (filters.donationFrequency) {
            where.donationFrequency = filters.donationFrequency;
        }
        if (filters.professions && filters.professions.length > 0) {
            where.profession = { in: filters.professions };
        }
        const andConditions = [];
        if (filters.donationCategories && filters.donationCategories.length > 0) {
            andConditions.push({
                donations: {
                    some: {
                        donationType: { in: filters.donationCategories },
                        isDeleted: false,
                    },
                },
            });
        }
        if (filters.sponsorshipTypes && filters.sponsorshipTypes.length > 0) {
            andConditions.push({
                sponsorships: {
                    some: {
                        sponsorshipType: { in: filters.sponsorshipTypes },
                    },
                },
            });
        }
        if (filters.donationAmountMin !== undefined || filters.donationAmountMax !== undefined) {
            const amountFilter = {};
            if (filters.donationAmountMin !== undefined)
                amountFilter.gte = filters.donationAmountMin;
            if (filters.donationAmountMax !== undefined)
                amountFilter.lte = filters.donationAmountMax;
            andConditions.push({
                donations: {
                    some: {
                        donationAmount: amountFilter,
                        isDeleted: false,
                    },
                },
            });
        }
        if (andConditions.length > 0) {
            where.AND = andConditions;
        }
        return where;
    }
    async previewAudience(filters, channel) {
        const where = this.buildWhereClause(filters);
        const donors = await this.prisma.donor.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                primaryPhone: true,
                primaryPhoneCode: true,
                whatsappPhone: true,
                whatsappPhoneCode: true,
                personalEmail: true,
                officialEmail: true,
                prefWhatsapp: true,
                prefEmail: true,
            },
        });
        let reachable = 0;
        let unreachable = 0;
        for (const donor of donors) {
            if (channel === 'WHATSAPP') {
                const phone = donor.whatsappPhone || donor.primaryPhone;
                const code = donor.whatsappPhoneCode || donor.primaryPhoneCode;
                const e164 = (0, phone_utils_1.normalizeToE164)(phone, code);
                if (e164)
                    reachable++;
                else
                    unreachable++;
            }
            else {
                const email = donor.personalEmail || donor.officialEmail;
                if (email)
                    reachable++;
                else
                    unreachable++;
            }
        }
        return {
            total: donors.length,
            reachable,
            unreachable,
            sampleDonors: donors.slice(0, 10).map(d => ({
                id: d.id,
                name: `${d.firstName} ${d.lastName || ''}`.trim(),
                contact: channel === 'WHATSAPP'
                    ? (d.whatsappPhone || d.primaryPhone || 'No phone')
                    : (d.personalEmail || d.officialEmail || 'No email'),
            })),
        };
    }
    async sendBroadcast(request, userId) {
        const where = this.buildWhereClause(request.filters);
        const donors = await this.prisma.donor.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                primaryPhone: true,
                primaryPhoneCode: true,
                whatsappPhone: true,
                whatsappPhoneCode: true,
                personalEmail: true,
                officialEmail: true,
                prefWhatsapp: true,
                prefEmail: true,
            },
        });
        const result = {
            total: donors.length,
            sent: 0,
            failed: 0,
            skipped: 0,
            details: [],
        };
        if (request.channel === 'WHATSAPP') {
            if (!request.contentSid) {
                throw new common_1.BadRequestException('contentSid is required for WhatsApp broadcasts');
            }
            if (!this.communicationsService.isWhatsAppConfigured()) {
                throw new common_1.BadRequestException('WhatsApp is not configured. Check Twilio credentials.');
            }
            for (const donor of donors) {
                const donorName = `${donor.firstName} ${donor.lastName || ''}`.trim();
                const phone = donor.whatsappPhone || donor.primaryPhone;
                const code = donor.whatsappPhoneCode || donor.primaryPhoneCode;
                const e164 = (0, phone_utils_1.normalizeToE164)(phone, code);
                if (!e164) {
                    result.skipped++;
                    result.details.push({ donorId: donor.id, donorName, status: 'skipped', error: 'No valid phone number' });
                    continue;
                }
                try {
                    const variables = {
                        ...request.contentVariables,
                        '1': donorName,
                    };
                    const msg = await this.communicationsService.sendWhatsAppTemplate({ donorId: donor.id, toE164: e164, contentSid: request.contentSid, variables }, userId);
                    if (msg.status === client_1.CommStatus.FAILED) {
                        result.failed++;
                        result.details.push({ donorId: donor.id, donorName, status: 'failed', error: msg.errorMessage || 'Send failed' });
                    }
                    else {
                        result.sent++;
                        result.details.push({ donorId: donor.id, donorName, status: 'sent' });
                    }
                }
                catch (err) {
                    result.failed++;
                    result.details.push({ donorId: donor.id, donorName, status: 'failed', error: err.message });
                }
            }
        }
        else {
            if (!request.emailSubject || !request.emailBody) {
                throw new common_1.BadRequestException('emailSubject and emailBody are required for Email broadcasts');
            }
            for (const donor of donors) {
                const donorName = `${donor.firstName} ${donor.lastName || ''}`.trim();
                const email = donor.personalEmail || donor.officialEmail;
                if (!email) {
                    result.skipped++;
                    result.details.push({ donorId: donor.id, donorName, status: 'skipped', error: 'No email address' });
                    continue;
                }
                try {
                    let body = request.emailBody;
                    body = body.replace(/{{donorName}}/g, donorName);
                    body = body.replace(/{{date}}/g, new Date().toLocaleDateString('en-IN'));
                    let subject = request.emailSubject;
                    subject = subject.replace(/{{donorName}}/g, donorName);
                    await this.prisma.communicationMessage.create({
                        data: {
                            donorId: donor.id,
                            channel: client_1.CommChannel.EMAIL,
                            provider: client_1.CommProvider.SMTP,
                            to: email,
                            status: client_1.CommStatus.QUEUED,
                            templateName: 'broadcast',
                            createdByUserId: userId,
                        },
                    });
                    const emailResult = await this.emailService.sendEmail({
                        to: email,
                        subject,
                        html: body,
                        featureType: 'MANUAL',
                    });
                    if (emailResult.success) {
                        result.sent++;
                        result.details.push({ donorId: donor.id, donorName, status: 'sent' });
                    }
                    else {
                        result.failed++;
                        result.details.push({ donorId: donor.id, donorName, status: 'failed', error: emailResult.error || 'Send failed' });
                    }
                }
                catch (err) {
                    result.failed++;
                    result.details.push({ donorId: donor.id, donorName, status: 'failed', error: err.message });
                }
            }
        }
        await this.auditService.log({
            userId,
            action: 'BROADCAST_SENT',
            entityType: 'Broadcast',
            entityId: `broadcast-${Date.now()}`,
            metadata: {
                channel: request.channel,
                filters: request.filters,
                total: result.total,
                sent: result.sent,
                failed: result.failed,
                skipped: result.skipped,
            },
        });
        this.logger.log(`Broadcast complete: channel=${request.channel}, total=${result.total}, sent=${result.sent}, failed=${result.failed}, skipped=${result.skipped}`);
        return result;
    }
    async getAvailableWhatsAppTemplates() {
        return this.communicationsService.getConfiguredTemplates();
    }
    async getAvailableEmailTemplates() {
        return this.prisma.communicationTemplate.findMany({
            where: { isActive: true },
            select: {
                id: true,
                type: true,
                name: true,
                description: true,
                emailSubject: true,
                emailBody: true,
            },
        });
    }
    async getStaffList() {
        return this.prisma.user.findMany({
            where: { isActive: true },
            select: { id: true, name: true, role: true },
            orderBy: { name: 'asc' },
        });
    }
    async getProfessionList() {
        const results = await this.prisma.donor.findMany({
            where: { isDeleted: false, profession: { not: null } },
            select: { profession: true },
            distinct: ['profession'],
            orderBy: { profession: 'asc' },
        });
        return results.map(r => r.profession).filter(Boolean);
    }
};
exports.BroadcastingService = BroadcastingService;
exports.BroadcastingService = BroadcastingService = BroadcastingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        communications_service_1.CommunicationsService,
        email_service_1.EmailService,
        audit_service_1.AuditService])
], BroadcastingService);
//# sourceMappingURL=broadcasting.service.js.map