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
var BirthdayWishService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BirthdayWishService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_jobs_service_1 = require("../email-jobs/email-jobs.service");
const communication_log_service_1 = require("../communication-log/communication-log.service");
const organization_profile_service_1 = require("../organization-profile/organization-profile.service");
const client_1 = require("@prisma/client");
let BirthdayWishService = BirthdayWishService_1 = class BirthdayWishService {
    constructor(prisma, emailJobsService, communicationLogService, orgProfileService) {
        this.prisma = prisma;
        this.emailJobsService = emailJobsService;
        this.communicationLogService = communicationLogService;
        this.orgProfileService = orgProfileService;
        this.logger = new common_1.Logger(BirthdayWishService_1.name);
    }
    async getUpcomingBirthdays(range = 'next7') {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        const donors = await this.prisma.donor.findMany({
            where: {
                isDeleted: false,
                dobDay: { not: null },
                dobMonth: { not: null },
            },
            select: {
                id: true,
                donorCode: true,
                firstName: true,
                lastName: true,
                dobDay: true,
                dobMonth: true,
                personalEmail: true,
                officialEmail: true,
                whatsappPhone: true,
                whatsappPhoneCode: true,
                sponsorships: {
                    where: { isActive: true, status: 'ACTIVE' },
                    select: {
                        beneficiary: {
                            select: {
                                id: true,
                                fullName: true,
                                homeType: true,
                                protectPrivacy: true,
                                photoUrl: true,
                            },
                        },
                    },
                },
            },
        });
        const orgProfile = await this.orgProfileService.getProfile();
        const orgName = orgProfile.name;
        const results = [];
        for (const donor of donors) {
            if (!donor.dobDay || !donor.dobMonth)
                continue;
            const daysUntil = this.calculateDaysUntil(donor.dobMonth, donor.dobDay, currentMonth, currentDay, now);
            if (range === 'today' && daysUntil !== 0)
                continue;
            if (range === 'next7' && (daysUntil < 0 || daysUntil > 7))
                continue;
            const beneficiaries = donor.sponsorships.map((s) => ({
                id: s.beneficiary.id,
                fullName: s.beneficiary.fullName,
                homeType: s.beneficiary.homeType,
                protectPrivacy: s.beneficiary.protectPrivacy,
                photoUrl: s.beneficiary.photoUrl,
            }));
            const visibleBeneficiaries = beneficiaries.filter((b) => !b.protectPrivacy);
            const beneficiaryLine = await this.buildBeneficiaryLine(visibleBeneficiaries, beneficiaries);
            const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
            const imageUrl = await this.findEligiblePhoto(donor.id, beneficiaries);
            const whatsappTemplate = await this.getTemplate('DONOR_BIRTHDAY_WISH', 'WHATSAPP');
            const emailTemplate = await this.getTemplate('DONOR_BIRTHDAY_WISH', 'EMAIL');
            const variables = {
                donor_name: donorName,
                org_name: orgName,
                beneficiary_line: beneficiaryLine,
                image_block: imageUrl
                    ? `<div style="text-align:center;margin:16px 0;"><img src="${imageUrl}" alt="Beneficiary" style="max-width:400px;border-radius:8px;" /></div>`
                    : '',
            };
            const whatsappText = this.renderTemplate(whatsappTemplate.body, variables);
            const emailSubject = this.renderTemplate(emailTemplate.subject || '', variables);
            const emailHtml = this.renderTemplate(emailTemplate.body, variables);
            results.push({
                donorId: donor.id,
                donorCode: donor.donorCode,
                donorName,
                firstName: donor.firstName,
                lastName: donor.lastName,
                dobDay: donor.dobDay,
                dobMonth: donor.dobMonth,
                daysUntil,
                isToday: daysUntil === 0,
                hasEmail: !!(donor.personalEmail || donor.officialEmail),
                hasWhatsApp: !!donor.whatsappPhone,
                personalEmail: donor.personalEmail,
                officialEmail: donor.officialEmail,
                whatsappPhone: donor.whatsappPhone,
                beneficiaries: beneficiaries.map((b) => ({
                    id: b.id,
                    name: b.protectPrivacy ? `(Privacy Protected)` : b.fullName,
                    homeType: b.homeType,
                    privacyProtected: b.protectPrivacy,
                })),
                whatsappText,
                emailSubject,
                emailHtml,
                imageUrl,
            });
            if (daysUntil === 0) {
                await this.ensureBirthdayTask(donor.id, donorName);
            }
        }
        results.sort((a, b) => a.daysUntil - b.daysUntil);
        return results;
    }
    async getWishPreview(donorId) {
        const donor = await this.prisma.donor.findUnique({
            where: { id: donorId },
            select: {
                id: true,
                donorCode: true,
                firstName: true,
                lastName: true,
                dobDay: true,
                dobMonth: true,
                personalEmail: true,
                officialEmail: true,
                whatsappPhone: true,
                sponsorships: {
                    where: { isActive: true, status: 'ACTIVE' },
                    select: {
                        beneficiary: {
                            select: {
                                id: true,
                                fullName: true,
                                homeType: true,
                                protectPrivacy: true,
                                photoUrl: true,
                            },
                        },
                    },
                },
            },
        });
        if (!donor || !donor.dobDay || !donor.dobMonth)
            return null;
        const orgProfile = await this.orgProfileService.getProfile();
        const orgName = orgProfile.name;
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        const daysUntil = this.calculateDaysUntil(donor.dobMonth, donor.dobDay, currentMonth, currentDay, now);
        const beneficiaries = donor.sponsorships.map((s) => ({
            id: s.beneficiary.id,
            fullName: s.beneficiary.fullName,
            homeType: s.beneficiary.homeType,
            protectPrivacy: s.beneficiary.protectPrivacy,
            photoUrl: s.beneficiary.photoUrl,
        }));
        const visibleBeneficiaries = beneficiaries.filter((b) => !b.protectPrivacy);
        const beneficiaryLine = await this.buildBeneficiaryLine(visibleBeneficiaries, beneficiaries);
        const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
        const imageUrl = await this.findEligiblePhoto(donorId, beneficiaries);
        const whatsappTemplate = await this.getTemplate('DONOR_BIRTHDAY_WISH', 'WHATSAPP');
        const emailTemplate = await this.getTemplate('DONOR_BIRTHDAY_WISH', 'EMAIL');
        const variables = {
            donor_name: donorName,
            org_name: orgName,
            beneficiary_line: beneficiaryLine,
            image_block: imageUrl
                ? `<div style="text-align:center;margin:16px 0;"><img src="${imageUrl}" alt="Beneficiary" style="max-width:400px;border-radius:8px;" /></div>`
                : '',
        };
        return {
            donorId: donor.id,
            donorCode: donor.donorCode,
            donorName,
            firstName: donor.firstName,
            lastName: donor.lastName,
            dobDay: donor.dobDay,
            dobMonth: donor.dobMonth,
            daysUntil,
            isToday: daysUntil === 0,
            hasEmail: !!(donor.personalEmail || donor.officialEmail),
            hasWhatsApp: !!donor.whatsappPhone,
            personalEmail: donor.personalEmail,
            officialEmail: donor.officialEmail,
            whatsappPhone: donor.whatsappPhone,
            beneficiaries: beneficiaries.map((b) => ({
                id: b.id,
                name: b.protectPrivacy ? `(Privacy Protected)` : b.fullName,
                homeType: b.homeType,
                privacyProtected: b.protectPrivacy,
            })),
            whatsappText: this.renderTemplate(whatsappTemplate.body, variables),
            emailSubject: this.renderTemplate(emailTemplate.subject || '', variables),
            emailHtml: this.renderTemplate(emailTemplate.body, variables),
            imageUrl,
        };
    }
    async queueBirthdayEmail(donorId, user) {
        const donor = await this.prisma.donor.findUnique({
            where: { id: donorId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                personalEmail: true,
                officialEmail: true,
                dobDay: true,
                dobMonth: true,
                sponsorships: {
                    where: { isActive: true, status: 'ACTIVE' },
                    select: {
                        beneficiary: {
                            select: {
                                id: true,
                                fullName: true,
                                homeType: true,
                                protectPrivacy: true,
                                photoUrl: true,
                            },
                        },
                    },
                },
            },
        });
        if (!donor)
            throw new common_1.NotFoundException('Donor not found');
        const toEmail = donor.personalEmail || donor.officialEmail;
        if (!toEmail)
            throw new common_1.BadRequestException('Donor has no email address on file');
        const orgProfile = await this.orgProfileService.getProfile();
        const orgName = orgProfile.name;
        const beneficiaries = donor.sponsorships.map((s) => ({
            id: s.beneficiary.id,
            fullName: s.beneficiary.fullName,
            homeType: s.beneficiary.homeType,
            protectPrivacy: s.beneficiary.protectPrivacy,
            photoUrl: s.beneficiary.photoUrl,
        }));
        const visibleBeneficiaries = beneficiaries.filter((b) => !b.protectPrivacy);
        const beneficiaryLine = await this.buildBeneficiaryLine(visibleBeneficiaries, beneficiaries);
        const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
        const imageUrl = await this.findEligiblePhoto(donorId, beneficiaries);
        const emailTemplate = await this.getTemplate('DONOR_BIRTHDAY_WISH', 'EMAIL');
        const variables = {
            donor_name: donorName,
            org_name: orgName,
            beneficiary_line: beneficiaryLine,
            image_block: imageUrl
                ? `<div style="text-align:center;margin:16px 0;"><img src="${imageUrl}" alt="Beneficiary" style="max-width:400px;border-radius:8px;" /></div>`
                : '',
        };
        const emailSubject = this.renderTemplate(emailTemplate.subject || `Happy Birthday, ${donorName}!`, variables);
        const emailHtml = this.renderTemplate(emailTemplate.body, variables);
        const now = new Date();
        const scheduledAt = new Date(now.getFullYear(), (donor.dobMonth || now.getMonth() + 1) - 1, donor.dobDay || now.getDate(), 8, 0, 0);
        if (scheduledAt < now) {
            scheduledAt.setTime(now.getTime() + 60000);
        }
        const emailJobDto = {
            donorId: donor.id,
            toEmail,
            subject: emailSubject,
            body: emailHtml,
            type: 'DONOR_BIRTHDAY',
            relatedId: `birthday-${donor.dobMonth}-${donor.dobDay}-${now.getFullYear()}`,
            scheduledAt,
        };
        await this.emailJobsService.create(emailJobDto);
        await this.prisma.outboundMessageLog.create({
            data: {
                type: 'DONOR_BIRTHDAY',
                channel: 'EMAIL',
                donorId: donor.id,
                beneficiaryIds: beneficiaries.map((b) => b.id),
                status: 'QUEUED',
                createdById: user.userId,
            },
        });
        await this.communicationLogService.logEmail({
            donorId: donor.id,
            toEmail,
            subject: emailSubject,
            messagePreview: `Birthday wish email queued for ${donorName}`,
            status: 'SENT',
            sentById: user.userId,
            type: client_1.CommunicationType.GREETING,
        });
        this.logger.log(`Birthday email queued for donor ${donorId} (${donorName}) to ${toEmail}`);
        return { success: true, message: `Birthday email queued for ${donorName}` };
    }
    async markSent(donorId, channel, user) {
        const donor = await this.prisma.donor.findUnique({
            where: { id: donorId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                whatsappPhone: true,
                personalEmail: true,
                officialEmail: true,
                sponsorships: {
                    where: { isActive: true, status: 'ACTIVE' },
                    select: { beneficiaryId: true },
                },
            },
        });
        if (!donor)
            throw new common_1.NotFoundException('Donor not found');
        const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
        await this.prisma.outboundMessageLog.create({
            data: {
                type: 'DONOR_BIRTHDAY',
                channel: channel === 'EMAIL' ? 'EMAIL' : 'WHATSAPP',
                donorId: donor.id,
                beneficiaryIds: donor.sponsorships.map((s) => s.beneficiaryId),
                status: channel === 'WHATSAPP' ? 'COPIED' : 'SENT',
                createdById: user.userId,
            },
        });
        if (channel === 'WHATSAPP' && donor.whatsappPhone) {
            await this.communicationLogService.logWhatsApp({
                donorId: donor.id,
                phoneNumber: donor.whatsappPhone,
                messagePreview: `Birthday wish sent via WhatsApp to ${donorName}`,
                sentById: user.userId,
                type: client_1.CommunicationType.GREETING,
            });
        }
        return { success: true };
    }
    async getUpcomingBeneficiaryBirthdays(range = 'next7') {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        const beneficiaries = await this.prisma.beneficiary.findMany({
            where: {
                isDeleted: false,
                dobMonth: { not: null },
                dobDay: { not: null },
            },
            select: {
                id: true,
                code: true,
                fullName: true,
                homeType: true,
                dobDay: true,
                dobMonth: true,
                protectPrivacy: true,
                photoUrl: true,
                sponsorships: {
                    where: { isActive: true, status: 'ACTIVE' },
                    select: {
                        id: true,
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
                },
                updates: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { title: true },
                },
            },
        });
        const results = [];
        for (const b of beneficiaries) {
            if (!b.dobDay || !b.dobMonth)
                continue;
            const daysUntil = this.calculateDaysUntil(b.dobMonth, b.dobDay, currentMonth, currentDay, now);
            if (range === 'today' && daysUntil !== 0)
                continue;
            if (range === 'next7' && (daysUntil < 0 || daysUntil > 7))
                continue;
            results.push({
                beneficiaryId: b.id,
                beneficiaryCode: b.code,
                beneficiaryName: b.fullName,
                homeType: b.homeType,
                dobDay: b.dobDay,
                dobMonth: b.dobMonth,
                daysUntil,
                isToday: daysUntil === 0,
                photoUrl: b.protectPrivacy ? null : b.photoUrl,
                latestUpdate: b.updates[0]?.title || null,
                sponsors: b.sponsorships.map((s) => ({
                    donorId: s.donor.id,
                    donorCode: s.donor.donorCode,
                    donorName: [s.donor.firstName, s.donor.lastName].filter(Boolean).join(' '),
                    hasEmail: !!(s.donor.personalEmail || s.donor.officialEmail),
                    hasWhatsApp: !!s.donor.whatsappPhone,
                })),
            });
        }
        results.sort((a, b) => a.daysUntil - b.daysUntil);
        return results;
    }
    async sendBeneficiaryBirthdayWish(beneficiaryId, user) {
        const beneficiary = await this.prisma.beneficiary.findUnique({
            where: { id: beneficiaryId },
            select: {
                id: true,
                fullName: true,
                homeType: true,
                dobDay: true,
                dobMonth: true,
                protectPrivacy: true,
                photoUrl: true,
                sponsorships: {
                    where: { isActive: true, status: 'ACTIVE' },
                    select: {
                        donor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                personalEmail: true,
                                officialEmail: true,
                            },
                        },
                    },
                },
                updates: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { title: true },
                },
            },
        });
        if (!beneficiary)
            throw new common_1.NotFoundException('Beneficiary not found');
        const orgProfile = await this.orgProfileService.getProfile();
        const orgName = orgProfile.name;
        const homeName = await this.formatHomeType(beneficiary.homeType);
        const updateSnippet = beneficiary.updates[0]?.title || 'is doing well at the home';
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        const daysUntil = beneficiary.dobMonth && beneficiary.dobDay
            ? this.calculateDaysUntil(beneficiary.dobMonth, beneficiary.dobDay, currentMonth, currentDay, now)
            : 0;
        const birthdayIntro = this.buildBirthdayIntro(beneficiary.fullName, homeName, daysUntil);
        const emailTemplate = await this.getTemplate('BENEFICIARY_BIRTHDAY_WISH', 'EMAIL');
        let sentCount = 0;
        for (const sponsorship of beneficiary.sponsorships) {
            const donor = sponsorship.donor;
            const toEmail = donor.personalEmail || donor.officialEmail;
            if (!toEmail)
                continue;
            const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
            const variables = {
                donor_name: donorName,
                beneficiary_name: beneficiary.fullName,
                home_name: homeName,
                update_snippet: updateSnippet,
                birthday_intro: birthdayIntro,
                org_name: orgName,
            };
            const subject = this.renderTemplate(emailTemplate.subject || `${beneficiary.fullName}'s Birthday - ${orgName}`, variables);
            const body = this.renderTemplate(emailTemplate.body, variables);
            const emailJobDto = {
                donorId: donor.id,
                toEmail,
                subject,
                body,
                type: 'BENEFICIARY_BIRTHDAY',
                relatedId: `benef-birthday-${beneficiary.id}-${now.getFullYear()}`,
                scheduledAt: new Date(now.getTime() + 60000),
            };
            await this.emailJobsService.create(emailJobDto);
            await this.prisma.outboundMessageLog.create({
                data: {
                    type: 'BENEFICIARY_BIRTHDAY',
                    channel: 'EMAIL',
                    donorId: donor.id,
                    beneficiaryIds: [beneficiary.id],
                    status: 'QUEUED',
                    createdById: user.userId,
                },
            });
            await this.communicationLogService.logEmail({
                donorId: donor.id,
                toEmail,
                subject,
                messagePreview: `Birthday greeting for ${beneficiary.fullName} sent to sponsor ${donorName}`,
                status: 'SENT',
                sentById: user.userId,
                type: client_1.CommunicationType.GREETING,
            });
            sentCount++;
        }
        return {
            success: true,
            message: `Birthday wish emails queued for ${sentCount} sponsor(s) of ${beneficiary.fullName}`,
            sent: sentCount,
        };
    }
    async getSentLog(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            this.prisma.outboundMessageLog.findMany({
                where: { type: { in: ['DONOR_BIRTHDAY', 'BENEFICIARY_BIRTHDAY'] } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    donor: { select: { id: true, firstName: true, lastName: true, donorCode: true } },
                    createdBy: { select: { id: true, name: true } },
                },
            }),
            this.prisma.outboundMessageLog.count({
                where: { type: { in: ['DONOR_BIRTHDAY', 'BENEFICIARY_BIRTHDAY'] } },
            }),
        ]);
        return {
            logs: logs.map((l) => ({
                id: l.id,
                type: l.type,
                channel: l.channel,
                donorId: l.donorId,
                donorName: [l.donor.firstName, l.donor.lastName].filter(Boolean).join(' '),
                donorCode: l.donor.donorCode,
                beneficiaryIds: l.beneficiaryIds,
                status: l.status,
                createdAt: l.createdAt,
                createdBy: l.createdBy?.name || 'System',
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    buildBirthdayIntro(beneficiaryName, homeName, daysUntil) {
        if (daysUntil === 0) {
            return `<p>Today is a special day! <strong>${beneficiaryName}</strong> from ${homeName} is celebrating their birthday.</p>`;
        }
        else if (daysUntil <= 2) {
            return `<p>${beneficiaryName} from ${homeName} will be celebrating their birthday in just ${daysUntil} day${daysUntil > 1 ? 's' : ''}!</p>`;
        }
        else if (daysUntil <= 7) {
            return `<p>${beneficiaryName} from ${homeName} has a birthday coming up in ${daysUntil} days!</p>`;
        }
        return `<p>${beneficiaryName} from ${homeName} has a birthday coming up in ${daysUntil} days.</p>`;
    }
    async getTemplates() {
        const templates = await this.prisma.messageTemplate.findMany({
            where: { key: { in: ['DONOR_BIRTHDAY_WISH', 'BENEFICIARY_BIRTHDAY_WISH'] } },
            orderBy: [{ key: 'asc' }, { channel: 'asc' }],
        });
        return templates.map((t) => {
            const variableMatches = t.body.match(/\{\{(\w+)\}\}/g);
            const variables = variableMatches
                ? [...new Set(variableMatches.map((v) => v.replace(/\{\{|\}\}/g, '')))]
                : [];
            return { ...t, variables };
        });
    }
    async updateTemplate(id, data, userId) {
        return this.prisma.messageTemplate.update({
            where: { id },
            data: {
                subject: data.subject,
                body: data.body,
                updatedById: userId,
            },
        });
    }
    calculateDaysUntil(dobMonth, dobDay, currentMonth, currentDay, now) {
        let birthdayThisYear = new Date(now.getFullYear(), dobMonth - 1, dobDay);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (birthdayThisYear.getMonth() + 1 === currentMonth && birthdayThisYear.getDate() === currentDay) {
            return 0;
        }
        if (birthdayThisYear < todayStart) {
            birthdayThisYear = new Date(now.getFullYear() + 1, dobMonth - 1, dobDay);
        }
        return Math.ceil((birthdayThisYear.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
    }
    async buildBeneficiaryLine(visibleBeneficiaries, allBeneficiaries) {
        if (visibleBeneficiaries.length === 0) {
            if (allBeneficiaries.length > 0) {
                const homeTypeResults = await Promise.all(allBeneficiaries.map((b) => this.formatHomeType(b.homeType)));
                const homeTypes = [...new Set(homeTypeResults)];
                return `Our children and elders at ${homeTypes.join(' and ')} send warm wishes.`;
            }
            return 'Our children and elders send warm wishes.';
        }
        if (visibleBeneficiaries.length === 1) {
            return `Your sponsored beneficiary ${visibleBeneficiaries[0].fullName} sends warm wishes.`;
        }
        const names = visibleBeneficiaries.map((b) => b.fullName);
        const lastTwo = names.slice(-2).join(' and ');
        const rest = names.slice(0, -2);
        const nameStr = rest.length > 0 ? `${rest.join(', ')}, ${lastTwo}` : lastTwo;
        return `Your sponsored beneficiaries ${nameStr} send warm wishes.`;
    }
    async formatHomeType(homeType) {
        const orgName = (await this.orgProfileService.getProfile()).name;
        const map = {
            ORPHAN_GIRLS: `${orgName} Girls Home`,
            BLIND_BOYS: `${orgName} Blind Boys Home`,
            OLD_AGE: `${orgName} Old Age Home`,
        };
        return map[homeType] || homeType;
    }
    async findEligiblePhoto(donorId, beneficiaries) {
        const visibleBeneficiaries = beneficiaries.filter((b) => !b.protectPrivacy);
        if (visibleBeneficiaries.length > 0) {
            const beneficiaryIds = visibleBeneficiaries.map((b) => b.id);
            const photo = await this.prisma.document.findFirst({
                where: {
                    ownerId: { in: beneficiaryIds },
                    ownerType: 'BENEFICIARY',
                    docType: { in: ['BENEFICIARY_PHOTO', 'PHOTO'] },
                    isSensitive: false,
                    shareWithDonor: true,
                },
                select: { storagePath: true },
                orderBy: { createdAt: 'desc' },
            });
            if (photo)
                return photo.storagePath;
        }
        const homePhoto = await this.prisma.document.findFirst({
            where: {
                ownerType: 'ORGANIZATION',
                docType: { in: ['HOME_PHOTO', 'PHOTO'] },
                isSensitive: false,
                shareWithDonor: true,
            },
            select: { storagePath: true },
            orderBy: { createdAt: 'desc' },
        });
        if (homePhoto)
            return homePhoto.storagePath;
        return null;
    }
    async getTemplate(key, channel) {
        const template = await this.prisma.messageTemplate.findUnique({
            where: { key_channel: { key, channel } },
        });
        if (template) {
            return { subject: template.subject, body: template.body };
        }
        if (channel === 'WHATSAPP') {
            return {
                subject: null,
                body: `Dear {{donor_name}},\n\nHappy Birthday! On this special day, {{org_name}} thanks you for your generous support.\n{{beneficiary_line}}\nWishing you a wonderful year ahead.\n\nWith gratitude,\n{{org_name}}`,
            };
        }
        return {
            subject: 'Happy Birthday, {{donor_name}}! - {{org_name}}',
            body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><p>Dear <strong>{{donor_name}}</strong>,</p><p>Wishing you a very <strong>Happy Birthday!</strong></p><p>On this special day, <strong>{{org_name}}</strong> wants to express our heartfelt gratitude for your support.</p><p>{{beneficiary_line}}</p>{{image_block}}<p>May this new year of your life bring you joy and happiness.</p><p>With warm regards,<br/><strong>{{org_name}}</strong></p></div>`,
        };
    }
    renderTemplate(template, variables) {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        }
        return result;
    }
    async ensureBirthdayTask(donorId, donorName) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const existing = await this.prisma.task.findFirst({
            where: {
                type: client_1.TaskType.BIRTHDAY,
                donorId,
                dueDate: { gte: today, lt: tomorrow },
            },
        });
        if (existing)
            return;
        await this.prisma.task.create({
            data: {
                title: `Wish ${donorName} happy birthday`,
                type: client_1.TaskType.BIRTHDAY,
                status: client_1.TaskStatus.PENDING,
                priority: client_1.TaskPriority.HIGH,
                dueDate: today,
                donorId,
            },
        });
        this.logger.log(`Birthday task created for donor ${donorId} (${donorName})`);
    }
};
exports.BirthdayWishService = BirthdayWishService;
exports.BirthdayWishService = BirthdayWishService = BirthdayWishService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_jobs_service_1.EmailJobsService,
        communication_log_service_1.CommunicationLogService,
        organization_profile_service_1.OrganizationProfileService])
], BirthdayWishService);
//# sourceMappingURL=birthday-wishes.service.js.map