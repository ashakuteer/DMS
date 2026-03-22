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
var DonorUpdatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorUpdatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_jobs_service_1 = require("../email-jobs/email-jobs.service");
const communication_log_service_1 = require("../communication-log/communication-log.service");
const client_1 = require("@prisma/client");
let DonorUpdatesService = DonorUpdatesService_1 = class DonorUpdatesService {
    constructor(prisma, emailJobsService, communicationLogService) {
        this.prisma = prisma;
        this.emailJobsService = emailJobsService;
        this.communicationLogService = communicationLogService;
        this.logger = new common_1.Logger(DonorUpdatesService_1.name);
    }
    async create(dto, user) {
        const update = await this.prisma.donorUpdate.create({
            data: {
                title: dto.title,
                content: dto.content,
                photos: dto.photos || [],
                relatedBeneficiaryIds: dto.relatedBeneficiaryIds || [],
                relatedHomeTypes: dto.relatedHomeTypes || [],
                isDraft: dto.isDraft !== false,
                createdById: user.id,
            },
            include: {
                createdBy: { select: { name: true } },
            },
        });
        return update;
    }
    async update(id, dto) {
        const existing = await this.prisma.donorUpdate.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Update not found');
        return this.prisma.donorUpdate.update({
            where: { id },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.content !== undefined && { content: dto.content }),
                ...(dto.photos !== undefined && { photos: dto.photos }),
                ...(dto.relatedBeneficiaryIds !== undefined && { relatedBeneficiaryIds: dto.relatedBeneficiaryIds }),
                ...(dto.relatedHomeTypes !== undefined && { relatedHomeTypes: dto.relatedHomeTypes }),
                ...(dto.isDraft !== undefined && { isDraft: dto.isDraft }),
            },
            include: {
                createdBy: { select: { name: true } },
            },
        });
    }
    async findAll(page = 1, limit = 20, draftsOnly) {
        const where = {};
        if (draftsOnly !== undefined) {
            where.isDraft = draftsOnly;
        }
        const [items, total] = await Promise.all([
            this.prisma.donorUpdate.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    createdBy: { select: { name: true } },
                    _count: { select: { dispatches: true } },
                },
            }),
            this.prisma.donorUpdate.count({ where }),
        ]);
        const enriched = await Promise.all(items.map(async (item) => {
            let beneficiaries = [];
            if (item.relatedBeneficiaryIds.length > 0) {
                beneficiaries = await this.prisma.beneficiary.findMany({
                    where: { id: { in: item.relatedBeneficiaryIds } },
                    select: { id: true, fullName: true, homeType: true, code: true },
                });
            }
            return {
                ...item,
                beneficiaries,
                dispatchCount: item._count.dispatches,
            };
        }));
        return {
            items: enriched,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const update = await this.prisma.donorUpdate.findUnique({
            where: { id },
            include: {
                createdBy: { select: { name: true } },
                dispatches: {
                    include: {
                        donor: {
                            select: {
                                id: true,
                                donorCode: true,
                                firstName: true,
                                lastName: true,
                                personalEmail: true,
                                officialEmail: true,
                                whatsappPhone: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!update)
            throw new common_1.NotFoundException('Update not found');
        let beneficiaries = [];
        if (update.relatedBeneficiaryIds.length > 0) {
            beneficiaries = await this.prisma.beneficiary.findMany({
                where: { id: { in: update.relatedBeneficiaryIds } },
                select: { id: true, fullName: true, homeType: true, code: true, photoUrl: true },
            });
        }
        return { ...update, beneficiaries };
    }
    async delete(id) {
        const existing = await this.prisma.donorUpdate.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Update not found');
        await this.prisma.donorUpdate.delete({ where: { id } });
        return { message: 'Update deleted' };
    }
    async preview(id) {
        const update = await this.findOne(id);
        const org = await this.prisma.organizationProfile.findFirst();
        const orgName = org?.name || 'Our Organization';
        let beneficiarySection = '';
        if (update.beneficiaries.length > 0) {
            beneficiarySection = update.beneficiaries
                .map((b) => `${b.fullName} (${b.homeType.replace(/_/g, ' ')})`)
                .join(', ');
        }
        let homeSection = '';
        if (update.relatedHomeTypes.length > 0) {
            homeSection = update.relatedHomeTypes
                .map((h) => h.replace(/_/g, ' '))
                .join(', ');
        }
        const relatedInfo = [beneficiarySection, homeSection].filter(Boolean).join(' | ');
        const photosHtml = update.photos.length > 0
            ? update.photos.map((url) => `<img src="${url}" style="max-width: 400px; margin: 10px 0; border-radius: 8px;" />`).join('')
            : '';
        const emailHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<p>Dear <strong>{{donor_name}}</strong>,</p>
<h2 style="color: #333;">${update.title}</h2>
${relatedInfo ? `<p style="color: #666; font-size: 14px;">Related to: ${relatedInfo}</p>` : ''}
<div style="line-height: 1.6;">${update.content.replace(/\n/g, '<br/>')}</div>
${photosHtml}
<p style="margin-top: 20px;">Warm regards,<br/><strong>${orgName}</strong></p>
</div>`;
        const whatsappText = `Dear {{donor_name}},

*${update.title}*

${relatedInfo ? `_Related to: ${relatedInfo}_\n` : ''}${update.content}

Warm regards,
${orgName}`;
        return {
            update,
            emailHtml,
            whatsappText,
            emailSubject: `${update.title} - ${orgName}`,
        };
    }
    async searchDonors(search, limit = 20) {
        if (!search || search.length < 2)
            return [];
        return this.prisma.donor.findMany({
            where: {
                isDeleted: false,
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { donorCode: { contains: search, mode: 'insensitive' } },
                    { personalEmail: { contains: search, mode: 'insensitive' } },
                    { primaryPhone: { contains: search, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                donorCode: true,
                firstName: true,
                lastName: true,
                personalEmail: true,
                officialEmail: true,
                whatsappPhone: true,
                primaryPhone: true,
            },
            take: limit,
            orderBy: { firstName: 'asc' },
        });
    }
    async send(id, dto, user) {
        const update = await this.prisma.donorUpdate.findUnique({ where: { id } });
        if (!update)
            throw new common_1.NotFoundException('Update not found');
        if (dto.donorIds.length === 0)
            throw new common_1.BadRequestException('At least one donor must be selected');
        const donors = await this.prisma.donor.findMany({
            where: { id: { in: dto.donorIds }, isDeleted: false },
            select: {
                id: true,
                donorCode: true,
                firstName: true,
                lastName: true,
                personalEmail: true,
                officialEmail: true,
                whatsappPhone: true,
                whatsappPhoneCode: true,
            },
        });
        if (donors.length === 0)
            throw new common_1.BadRequestException('No valid donors found');
        await this.prisma.donorUpdate.update({
            where: { id },
            data: { isDraft: false },
        });
        const previewData = await this.preview(id);
        const results = { sent: 0, failed: 0, errors: [] };
        for (const donor of donors) {
            const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
            const email = donor.personalEmail || donor.officialEmail;
            try {
                await this.prisma.donorUpdateDispatch.create({
                    data: {
                        updateId: id,
                        donorId: donor.id,
                        channel: dto.channel,
                        status: 'QUEUED',
                    },
                });
                if (dto.channel === 'EMAIL' && email) {
                    const personalizedHtml = previewData.emailHtml.replace(/\{\{donor_name\}\}/g, donorName);
                    const personalizedSubject = previewData.emailSubject;
                    await this.emailJobsService.create({
                        donorId: donor.id,
                        toEmail: email,
                        subject: personalizedSubject,
                        body: personalizedHtml,
                        type: client_1.EmailJobType.DONOR_UPDATE,
                        relatedId: id,
                        scheduledAt: new Date(),
                    });
                    await this.communicationLogService.create({
                        donorId: donor.id,
                        channel: 'EMAIL',
                        type: client_1.CommunicationType.GENERAL,
                        status: 'SENT',
                        recipient: email,
                        subject: personalizedSubject,
                        messagePreview: update.content.substring(0, 200),
                        sentById: user.id,
                    });
                    await this.prisma.donorUpdateDispatch.updateMany({
                        where: { updateId: id, donorId: donor.id },
                        data: { status: 'SENT', sentAt: new Date() },
                    });
                    results.sent++;
                }
                else if (dto.channel === 'WHATSAPP') {
                    const personalizedText = previewData.whatsappText.replace(/\{\{donor_name\}\}/g, donorName);
                    if (donor.whatsappPhone) {
                        await this.communicationLogService.create({
                            donorId: donor.id,
                            channel: 'WHATSAPP',
                            type: client_1.CommunicationType.GENERAL,
                            status: 'TRIGGERED',
                            recipient: donor.whatsappPhone,
                            messagePreview: personalizedText.substring(0, 200),
                            sentById: user.id,
                        });
                    }
                    await this.prisma.donorUpdateDispatch.updateMany({
                        where: { updateId: id, donorId: donor.id },
                        data: { status: 'COPIED', sentAt: new Date() },
                    });
                    results.sent++;
                }
                else {
                    results.failed++;
                    results.errors.push(`${donorName}: No ${dto.channel === 'EMAIL' ? 'email' : 'WhatsApp'} available`);
                }
            }
            catch (error) {
                this.logger.error(`Failed to send update to donor ${donor.id}: ${error.message}`);
                results.failed++;
                results.errors.push(`${donorName}: ${error.message}`);
            }
        }
        return {
            message: `Update sent to ${results.sent} donor(s)`,
            ...results,
        };
    }
    async getHistory(page = 1, limit = 20) {
        const [items, total] = await Promise.all([
            this.prisma.donorUpdateDispatch.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    update: {
                        select: { id: true, title: true, content: true },
                    },
                    donor: {
                        select: { id: true, donorCode: true, firstName: true, lastName: true },
                    },
                },
            }),
            this.prisma.donorUpdateDispatch.count(),
        ]);
        return {
            items: items.map((d) => ({
                id: d.id,
                updateTitle: d.update.title,
                updateId: d.update.id,
                donorName: [d.donor.firstName, d.donor.lastName].filter(Boolean).join(' '),
                donorCode: d.donor.donorCode,
                donorId: d.donor.id,
                channel: d.channel,
                status: d.status,
                sentAt: d.sentAt,
                createdAt: d.createdAt,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getDonorsByHome(homeTypes) {
        const sponsorships = await this.prisma.sponsorship.findMany({
            where: {
                status: 'ACTIVE',
                beneficiary: {
                    homeType: { in: homeTypes },
                },
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        personalEmail: true,
                        officialEmail: true,
                        whatsappPhone: true,
                    },
                },
            },
        });
        const uniqueDonors = new Map();
        for (const s of sponsorships) {
            if (!uniqueDonors.has(s.donor.id)) {
                uniqueDonors.set(s.donor.id, s.donor);
            }
        }
        return Array.from(uniqueDonors.values());
    }
    async getDonorsByBeneficiaries(beneficiaryIds) {
        const sponsorships = await this.prisma.sponsorship.findMany({
            where: {
                status: 'ACTIVE',
                beneficiaryId: { in: beneficiaryIds },
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        personalEmail: true,
                        officialEmail: true,
                        whatsappPhone: true,
                    },
                },
            },
        });
        const uniqueDonors = new Map();
        for (const s of sponsorships) {
            if (!uniqueDonors.has(s.donor.id)) {
                uniqueDonors.set(s.donor.id, s.donor);
            }
        }
        return Array.from(uniqueDonors.values());
    }
};
exports.DonorUpdatesService = DonorUpdatesService;
exports.DonorUpdatesService = DonorUpdatesService = DonorUpdatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_jobs_service_1.EmailJobsService,
        communication_log_service_1.CommunicationLogService])
], DonorUpdatesService);
//# sourceMappingURL=donor-updates.service.js.map