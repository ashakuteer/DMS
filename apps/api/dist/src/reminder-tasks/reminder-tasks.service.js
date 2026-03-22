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
var ReminderTasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderTasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const email_service_1 = require("../email/email.service");
const communication_log_service_1 = require("../communication-log/communication-log.service");
const templates_service_1 = require("../templates/templates.service");
const organization_profile_service_1 = require("../organization-profile/organization-profile.service");
const email_jobs_service_1 = require("../email-jobs/email-jobs.service");
const communications_service_1 = require("../communications/communications.service");
const phone_utils_1 = require("../common/phone-utils");
const client_1 = require("@prisma/client");
let ReminderTasksService = ReminderTasksService_1 = class ReminderTasksService {
    constructor(prisma, auditService, emailService, communicationLogService, templatesService, orgProfileService, emailJobsService, communicationsService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.emailService = emailService;
        this.communicationLogService = communicationLogService;
        this.templatesService = templatesService;
        this.orgProfileService = orgProfileService;
        this.emailJobsService = emailJobsService;
        this.communicationsService = communicationsService;
        this.logger = new common_1.Logger(ReminderTasksService_1.name);
    }
    mapOccasionTypeToReminderType(occasionType) {
        switch (occasionType) {
            case client_1.OccasionType.DOB_SELF:
            case client_1.OccasionType.DOB_SPOUSE:
            case client_1.OccasionType.DOB_CHILD:
                return client_1.ReminderTaskType.BIRTHDAY;
            case client_1.OccasionType.ANNIVERSARY:
                return client_1.ReminderTaskType.ANNIVERSARY;
            case client_1.OccasionType.DEATH_ANNIVERSARY:
                return client_1.ReminderTaskType.MEMORIAL;
            default:
                return client_1.ReminderTaskType.FOLLOW_UP;
        }
    }
    getOffsetText(offset) {
        switch (offset) {
            case 30: return 'in 30 days';
            case 15: return 'in 15 days';
            case 7: return 'in 7 days';
            case 2: return 'in 2 days';
            case 0: return 'Today';
            default: return `in ${offset} days`;
        }
    }
    getOccasionTitle(occasion, offset) {
        const offsetText = this.getOffsetText(offset);
        const isSameDay = offset === 0;
        switch (occasion.type) {
            case client_1.OccasionType.DOB_SELF:
                return isSameDay ? 'Birthday Today' : `Birthday ${offsetText}`;
            case client_1.OccasionType.DOB_SPOUSE:
                return isSameDay
                    ? `${occasion.relatedPersonName || 'Spouse'}'s Birthday Today`
                    : `${occasion.relatedPersonName || 'Spouse'}'s Birthday ${offsetText}`;
            case client_1.OccasionType.DOB_CHILD:
                return isSameDay
                    ? `${occasion.relatedPersonName || 'Child'}'s Birthday Today`
                    : `${occasion.relatedPersonName || 'Child'}'s Birthday ${offsetText}`;
            case client_1.OccasionType.ANNIVERSARY:
                return isSameDay ? 'Anniversary Today' : `Anniversary ${offsetText}`;
            case client_1.OccasionType.DEATH_ANNIVERSARY:
                return isSameDay ? 'Memorial Today' : `Memorial ${offsetText}`;
            default:
                return isSameDay ? 'Special Occasion Today' : `Special Occasion ${offsetText}`;
        }
    }
    getFamilyBirthdayTitle(familyMember, offset) {
        const offsetText = this.getOffsetText(offset);
        const isSameDay = offset === 0;
        return isSameDay
            ? `${familyMember.name}'s Birthday Today`
            : `${familyMember.name}'s Birthday ${offsetText}`;
    }
    calculateNextOccurrence(month, day, targetYear) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const year = targetYear || today.getFullYear();
        let nextDate = new Date(year, month - 1, day);
        nextDate.setHours(0, 0, 0, 0);
        if (nextDate < today && !targetYear) {
            nextDate = new Date(year + 1, month - 1, day);
            nextDate.setHours(0, 0, 0, 0);
        }
        return nextDate;
    }
    subtractDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() - days);
        return result;
    }
    async queueEmailJob(donor, type, title, dueDate, relatedId) {
        const org = await this.orgProfileService.getProfile();
        if (!org.enableAutoEmail)
            return;
        const email = donor.personalEmail || donor.officialEmail;
        if (!email)
            return;
        const donorName = `${donor.firstName}${donor.lastName ? ' ' + donor.lastName : ''}`;
        let subject = '';
        let body = '';
        switch (type) {
            case 'SPECIAL_DAY':
                subject = `Warm wishes from ${org.name}`;
                body = `<p>Dear ${donorName},</p><p>We hope this message finds you well. Wishing you a wonderful day!</p><p>With warm regards,<br/>${org.name}</p>`;
                break;
            case 'PLEDGE_REMINDER':
                subject = `Gentle reminder of your pledge – ${org.name}`;
                body = `<p>Dear ${donorName},</p><p>This is a gentle reminder about your pledge to ${org.name}. We truly appreciate your commitment to our mission.</p><p>With heartfelt gratitude,<br/>${org.name}</p>`;
                break;
            case 'FOLLOW_UP':
            default:
                subject = `Greetings from ${org.name}`;
                body = `<p>Dear ${donorName},</p><p>We hope this message finds you well. Thank you for your continued support of ${org.name}.</p><p>With warm regards,<br/>${org.name}</p>`;
        }
        const scheduledAt = new Date(dueDate);
        scheduledAt.setHours(9, 0, 0, 0);
        try {
            await this.emailJobsService.create({
                donorId: donor.id,
                toEmail: email,
                subject,
                body,
                type,
                relatedId,
                scheduledAt,
            });
        }
        catch (error) {
            this.logger.warn(`Could not queue email job for donor ${donor.id}: ${error}`);
        }
    }
    async sendAutoWhatsApp(donor, templateKey, variables) {
        try {
            const org = await this.orgProfileService.getProfile();
            if (templateKey === 'SPECIAL_DAY_WISH' && !org.enableSpecialDayWhatsApp)
                return;
            if (templateKey === 'PLEDGE_DUE' && !org.enablePledgeWhatsApp)
                return;
            if (templateKey === 'FOLLOWUP_REMINDER' && !org.enableFollowUpWhatsApp)
                return;
            const rawPhone = donor.whatsappPhone || donor.primaryPhone;
            if (!rawPhone)
                return;
            const e164 = (0, phone_utils_1.normalizeToE164)(rawPhone, donor.primaryPhoneCode);
            if (!e164)
                return;
            const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ') || 'Valued Donor';
            const vars = {
                '1': donorName,
                ...variables,
            };
            const result = await this.communicationsService.sendByTemplateKey(templateKey, donor.id, e164, vars);
            this.logger.log(`Auto WhatsApp ${templateKey} for donor ${donor.id}: ${result.status}`);
        }
        catch (err) {
            this.logger.warn(`Auto WhatsApp ${templateKey} for donor ${donor.id} failed: ${err?.message || err}`);
        }
    }
    async generateSpecialDayReminders() {
        this.logger.log('Starting special day reminder generation...');
        const donors = await this.prisma.donor.findMany({
            where: { isDeleted: false, prefReminders: true },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                primaryPhone: true,
                primaryPhoneCode: true,
                whatsappPhone: true,
                personalEmail: true,
                officialEmail: true,
                prefReminders: true,
                specialOccasions: true,
                familyMembers: {
                    where: {
                        birthMonth: { not: null },
                        birthDay: { not: null },
                    },
                },
            },
        });
        let createdCount = 0;
        const offsets = [30, 15, 7, 2, 0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (const donor of donors) {
            for (const occasion of donor.specialOccasions) {
                const nextOccurrence = this.calculateNextOccurrence(occasion.month, occasion.day);
                const reminderType = this.mapOccasionTypeToReminderType(occasion.type);
                for (const offset of offsets) {
                    const dueDate = this.subtractDays(nextOccurrence, offset);
                    if (dueDate < today)
                        continue;
                    const thirtyDaysFromNow = new Date(today);
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 35);
                    if (dueDate > thirtyDaysFromNow)
                        continue;
                    try {
                        const reminderTask = await this.prisma.reminderTask.upsert({
                            where: {
                                unique_occasion_reminder: {
                                    donorId: donor.id,
                                    sourceOccasionId: occasion.id,
                                    offsetDays: offset,
                                },
                            },
                            update: {
                                title: this.getOccasionTitle(occasion, offset),
                                dueDate: dueDate,
                            },
                            create: {
                                donorId: donor.id,
                                type: reminderType,
                                title: this.getOccasionTitle(occasion, offset),
                                dueDate: dueDate,
                                status: client_1.ReminderTaskStatus.OPEN,
                                sourceOccasionId: occasion.id,
                                offsetDays: offset,
                            },
                        });
                        createdCount++;
                        if (offset === 0) {
                            await this.queueEmailJob(donor, client_1.EmailJobType.SPECIAL_DAY, this.getOccasionTitle(occasion, offset), dueDate, reminderTask.id);
                            await this.sendAutoWhatsApp(donor, 'SPECIAL_DAY_WISH', {
                                '2': this.getOccasionTitle(occasion, offset),
                            });
                        }
                    }
                    catch (error) {
                        if (error.code !== 'P2002') {
                            this.logger.error(`Error creating reminder for donor ${donor.id}: ${error.message}`);
                        }
                    }
                }
            }
            for (const familyMember of donor.familyMembers) {
                if (!familyMember.birthMonth || !familyMember.birthDay)
                    continue;
                const nextOccurrence = this.calculateNextOccurrence(familyMember.birthMonth, familyMember.birthDay);
                for (const offset of offsets) {
                    const dueDate = this.subtractDays(nextOccurrence, offset);
                    if (dueDate < today)
                        continue;
                    const thirtyDaysFromNow = new Date(today);
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 35);
                    if (dueDate > thirtyDaysFromNow)
                        continue;
                    try {
                        const reminderTask = await this.prisma.reminderTask.upsert({
                            where: {
                                unique_family_reminder: {
                                    donorId: donor.id,
                                    sourceFamilyId: familyMember.id,
                                    offsetDays: offset,
                                },
                            },
                            update: {
                                title: this.getFamilyBirthdayTitle(familyMember, offset),
                                dueDate: dueDate,
                            },
                            create: {
                                donorId: donor.id,
                                type: client_1.ReminderTaskType.FAMILY_BIRTHDAY,
                                title: this.getFamilyBirthdayTitle(familyMember, offset),
                                dueDate: dueDate,
                                status: client_1.ReminderTaskStatus.OPEN,
                                sourceFamilyId: familyMember.id,
                                offsetDays: offset,
                            },
                        });
                        createdCount++;
                        if (offset === 0) {
                            await this.queueEmailJob(donor, client_1.EmailJobType.SPECIAL_DAY, this.getFamilyBirthdayTitle(familyMember, offset), dueDate, reminderTask.id);
                            await this.sendAutoWhatsApp(donor, 'SPECIAL_DAY_WISH', {
                                '2': this.getFamilyBirthdayTitle(familyMember, offset),
                            });
                        }
                    }
                    catch (error) {
                        if (error.code !== 'P2002') {
                            this.logger.error(`Error creating family reminder for donor ${donor.id}: ${error.message}`);
                        }
                    }
                }
            }
        }
        this.logger.log(`Generated ${createdCount} reminder tasks`);
        return createdCount;
    }
    async getReminders(user, filter) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        let dateFilter = {};
        switch (filter) {
            case 'today':
                dateFilter = {
                    dueDate: {
                        gte: today,
                        lte: endOfToday,
                    },
                };
                break;
            case 'week':
                const weekFromNow = new Date(today);
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                dateFilter = {
                    dueDate: {
                        gte: today,
                        lte: weekFromNow,
                    },
                };
                break;
            case 'month':
                const monthFromNow = new Date(today);
                monthFromNow.setDate(monthFromNow.getDate() + 30);
                dateFilter = {
                    dueDate: {
                        gte: today,
                        lte: monthFromNow,
                    },
                };
                break;
            case 'overdue':
                dateFilter = {
                    dueDate: {
                        lt: today,
                    },
                };
                break;
        }
        const statusFilter = filter === 'overdue'
            ? { status: client_1.ReminderTaskStatus.OPEN }
            : { status: { in: [client_1.ReminderTaskStatus.OPEN, client_1.ReminderTaskStatus.SNOOZED] } };
        const whereClause = {
            ...dateFilter,
            ...statusFilter,
            OR: filter === 'overdue' ? undefined : [
                { snoozedUntil: null },
                { snoozedUntil: { lte: today } },
            ],
        };
        if (filter === 'overdue') {
            delete whereClause.OR;
        }
        return this.prisma.reminderTask.findMany({
            where: whereClause,
            include: {
                donor: {
                    select: {
                        id: true,
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        primaryPhone: true,
                        primaryPhoneCode: true,
                        whatsappPhone: true,
                        whatsappPhoneCode: true,
                        personalEmail: true,
                        officialEmail: true,
                    },
                },
                sourceOccasion: {
                    select: {
                        relatedPersonName: true,
                    },
                },
                sourceFamilyMember: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: [
                { dueDate: 'asc' },
                { type: 'asc' },
            ],
        });
    }
    async markDone(user, id) {
        const task = await this.prisma.reminderTask.findUnique({
            where: { id },
        });
        if (!task) {
            throw new common_1.NotFoundException('Reminder task not found');
        }
        const updated = await this.prisma.reminderTask.update({
            where: { id },
            data: {
                status: client_1.ReminderTaskStatus.DONE,
                completedAt: new Date(),
            },
        });
        await this.auditService.log({
            userId: user.id,
            action: client_1.AuditAction.DONOR_UPDATE,
            entityType: 'ReminderTask',
            entityId: id,
            newValue: { status: 'DONE', completedBy: user.id },
            metadata: { action: 'mark_done' },
        });
        return updated;
    }
    async snooze(user, id, days) {
        if (![7, 30].includes(days)) {
            throw new Error('Snooze days must be 7 or 30');
        }
        const task = await this.prisma.reminderTask.findUnique({
            where: { id },
        });
        if (!task) {
            throw new common_1.NotFoundException('Reminder task not found');
        }
        const snoozedUntil = new Date();
        snoozedUntil.setDate(snoozedUntil.getDate() + days);
        const updated = await this.prisma.reminderTask.update({
            where: { id },
            data: {
                status: client_1.ReminderTaskStatus.SNOOZED,
                snoozedUntil: snoozedUntil,
            },
        });
        await this.auditService.log({
            userId: user.id,
            action: client_1.AuditAction.DONOR_UPDATE,
            entityType: 'ReminderTask',
            entityId: id,
            newValue: { status: 'SNOOZED', snoozedUntil, snoozedBy: user.id },
            metadata: { action: 'snooze', days },
        });
        return updated;
    }
    async processAutoEmails() {
        this.logger.log('Processing auto emails for due reminders...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        const autoEmailOffsets = [7, 2, 0];
        const dueReminders = await this.prisma.reminderTask.findMany({
            where: {
                dueDate: {
                    gte: today,
                    lte: endOfToday,
                },
                status: client_1.ReminderTaskStatus.OPEN,
                autoEmailSent: false,
                offsetDays: { in: autoEmailOffsets },
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        personalEmail: true,
                        officialEmail: true,
                        prefEmail: true,
                    },
                },
                sourceOccasion: {
                    select: {
                        relatedPersonName: true,
                    },
                },
                sourceFamilyMember: {
                    select: {
                        name: true,
                    },
                },
                sourcePledge: {
                    select: {
                        quantity: true,
                        amount: true,
                        expectedFulfillmentDate: true,
                        pledgeType: true,
                    },
                },
            },
        });
        let sent = 0;
        let failed = 0;
        const org = await this.orgProfileService.getProfile();
        const phoneDisplay = org.phone2 ? `${org.phone1} / ${org.phone2}` : org.phone1;
        for (const reminder of dueReminders) {
            const donorEmail = reminder.donor.prefEmail
                ? (reminder.donor.personalEmail || reminder.donor.officialEmail)
                : (reminder.donor.officialEmail || reminder.donor.personalEmail);
            if (!donorEmail) {
                this.logger.warn(`No email found for donor ${reminder.donorId}, skipping auto email`);
                continue;
            }
            const donorName = `${reminder.donor.firstName} ${reminder.donor.lastName || ''}`.trim();
            const relatedPersonName = reminder.sourceFamilyMember?.name || reminder.sourceOccasion?.relatedPersonName;
            const templateType = this.mapReminderTypeToTemplateType(reminder.type);
            const template = await this.templatesService.findByType(templateType);
            let emailSubject;
            let emailBody;
            if (template && template.emailBody && template.emailSubject) {
                const pledgeDescription = reminder.sourcePledge
                    ? (reminder.sourcePledge.pledgeType === 'MONEY'
                        ? `Monetary donation`
                        : reminder.sourcePledge.quantity || 'your pledge')
                    : 'your pledge';
                const pledgeAmountStr = reminder.sourcePledge?.amount
                    ? `Rs. ${Number(reminder.sourcePledge.amount).toLocaleString('en-IN')}`
                    : '';
                const resolvedSubject = await this.resolveTemplatePlaceholders(template.emailSubject, {
                    donorName,
                    relatedPerson: relatedPersonName || undefined,
                    pledgeItem: pledgeDescription,
                    pledgeAmount: pledgeAmountStr || undefined,
                    dueDate: reminder.sourcePledge?.expectedFulfillmentDate
                        ? new Date(reminder.sourcePledge.expectedFulfillmentDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })
                        : undefined,
                });
                const resolvedBody = await this.resolveTemplatePlaceholders(template.emailBody, {
                    donorName,
                    relatedPerson: relatedPersonName || undefined,
                    pledgeItem: pledgeDescription,
                    pledgeAmount: pledgeAmountStr || undefined,
                    dueDate: reminder.sourcePledge?.expectedFulfillmentDate
                        ? new Date(reminder.sourcePledge.expectedFulfillmentDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })
                        : undefined,
                });
                if (resolvedSubject.trim() && resolvedBody.trim().length > 20) {
                    emailSubject = resolvedSubject;
                    emailBody = resolvedBody;
                }
                else {
                    emailSubject = await this.getEmailSubject(reminder.type);
                    emailBody = await this.getFallbackEmailBody(reminder.type, donorName, relatedPersonName || undefined);
                }
            }
            else {
                emailSubject = await this.getEmailSubject(reminder.type);
                emailBody = await this.getFallbackEmailBody(reminder.type, donorName, relatedPersonName || undefined);
            }
            const fullEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          ${emailBody.split('\n').map(line => `<p style="margin: 0 0 10px 0;">${line}</p>`).join('')}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #cccccc; font-size: 13px; color: #666666;">
            <p style="margin: 0;">With heartfelt gratitude,</p>
            <p style="margin: 5px 0 15px 0;"><strong>${org.name}</strong></p>
            <p style="margin: 0;">Phone: ${phoneDisplay}</p>
            <p style="margin: 0;">Email: ${org.email}</p>
            <p style="margin: 0;">Website: ${org.website}</p>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #999999; font-style: italic;">
            (This is an automated email. Please do not reply.)
          </p>
        </div>
      `;
            try {
                const result = await this.emailService.sendEmail({
                    to: donorEmail,
                    subject: emailSubject,
                    html: fullEmailHtml,
                    text: emailBody,
                    featureType: 'AUTO',
                });
                if (result.success) {
                    await this.prisma.reminderTask.update({
                        where: { id: reminder.id },
                        data: {
                            autoEmailSent: true,
                            autoEmailSentAt: new Date(),
                            status: client_1.ReminderTaskStatus.DONE,
                            completedAt: new Date(),
                        },
                    });
                    await this.communicationLogService.logEmail({
                        donorId: reminder.donorId,
                        toEmail: donorEmail,
                        subject: emailSubject,
                        messagePreview: emailBody.substring(0, 200),
                        status: 'SENT',
                        type: client_1.CommunicationType.GREETING,
                    });
                    sent++;
                    this.logger.log(`Auto email sent for reminder ${reminder.id} to ${donorEmail}`);
                }
                else {
                    await this.communicationLogService.logEmail({
                        donorId: reminder.donorId,
                        toEmail: donorEmail,
                        subject: emailSubject,
                        messagePreview: emailBody.substring(0, 200),
                        status: 'FAILED',
                        errorMessage: result.error,
                        type: client_1.CommunicationType.GREETING,
                    });
                    failed++;
                    this.logger.error(`Failed to send auto email for reminder ${reminder.id}: ${result.error}`);
                }
            }
            catch (error) {
                failed++;
                this.logger.error(`Error processing auto email for reminder ${reminder.id}: ${error.message}`);
            }
        }
        this.logger.log(`Auto email processing complete: ${sent} sent, ${failed} failed`);
        return { sent, failed };
    }
    async getEmailSubject(type) {
        const org = await this.orgProfileService.getProfile();
        switch (type) {
            case client_1.ReminderTaskType.BIRTHDAY:
            case client_1.ReminderTaskType.FAMILY_BIRTHDAY:
            case client_1.ReminderTaskType.ANNIVERSARY:
                return `Warm wishes from ${org.name}`;
            case client_1.ReminderTaskType.MEMORIAL:
                return `Remembering with gratitude – ${org.name}`;
            case client_1.ReminderTaskType.PLEDGE:
                return `Gentle reminder of your pledge – ${org.name}`;
            default:
                return `Greetings from ${org.name}`;
        }
    }
    mapReminderTypeToTemplateType(type) {
        switch (type) {
            case client_1.ReminderTaskType.BIRTHDAY:
            case client_1.ReminderTaskType.FAMILY_BIRTHDAY:
                return client_1.TemplateType.BIRTHDAY;
            case client_1.ReminderTaskType.ANNIVERSARY:
                return client_1.TemplateType.ANNIVERSARY;
            case client_1.ReminderTaskType.MEMORIAL:
                return client_1.TemplateType.MEMORIAL;
            case client_1.ReminderTaskType.PLEDGE:
                return client_1.TemplateType.PLEDGE_DUE;
            case client_1.ReminderTaskType.FOLLOW_UP:
            default:
                return client_1.TemplateType.FOLLOWUP;
        }
    }
    async resolveTemplatePlaceholders(template, data) {
        const org = await this.orgProfileService.getProfile();
        let result = template;
        result = result.replace(/\{\{donor_name\}\}/g, data.donorName || '');
        result = result.replace(/\{\{related_person\}\}/g, data.relatedPerson || 'your loved one');
        result = result.replace(/\{\{pledge_item\}\}/g, data.pledgeItem || 'your pledge');
        result = result.replace(/\{\{pledge_amount\}\}/g, data.pledgeAmount || '');
        result = result.replace(/\{\{due_date\}\}/g, data.dueDate || '');
        result = result.replace(/\{\{org_name\}\}/g, org.name);
        result = result.replace(/\{\{org_phone\}\}/g, `${org.phone1}${org.phone2 ? ' / ' + org.phone2 : ''}`);
        result = result.replace(/\{\{org_email\}\}/g, org.email);
        result = result.replace(/\{\{org_website\}\}/g, org.website);
        result = result.replace(/\{\{homes\}\}/g, org.tagline1 || '');
        return result;
    }
    async getFallbackWhatsAppMessage(type, donorName, relatedPersonName) {
        const org = await this.orgProfileService.getProfile();
        switch (type) {
            case client_1.ReminderTaskType.BIRTHDAY:
                return `Dear ${donorName}, warm birthday wishes from ${org.name}! May this special day bring you joy, happiness, and all the blessings you deserve. We are grateful for your continued support.`;
            case client_1.ReminderTaskType.FAMILY_BIRTHDAY:
                return `Dear ${donorName}, warm birthday wishes to ${relatedPersonName || 'your loved one'} from ${org.name}! May this special day be filled with joy and happiness.`;
            case client_1.ReminderTaskType.ANNIVERSARY:
                return `Dear ${donorName}, warm anniversary wishes from ${org.name}! May your journey together continue to be blessed with love and happiness.`;
            case client_1.ReminderTaskType.MEMORIAL:
                return `Dear ${donorName}, remembering ${relatedPersonName || 'your loved one'} with respect and prayers. Our thoughts are with you and your family. - ${org.name}`;
            case client_1.ReminderTaskType.PLEDGE:
                return `Dear ${donorName}, this is a gentle reminder about your pledge to support ${org.name}. Your commitment means the world to us. Please reach out when you are ready to fulfill your pledge.`;
            default:
                return `Dear ${donorName}, greetings from ${org.name}! We hope this message finds you well. Thank you for your continued support and generosity.`;
        }
    }
    async logWhatsAppClick(user, reminderId) {
        const reminder = await this.prisma.reminderTask.findUnique({
            where: { id: reminderId },
            include: {
                donor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        whatsappPhone: true,
                        whatsappPhoneCode: true,
                        primaryPhone: true,
                        primaryPhoneCode: true,
                    },
                },
                sourceOccasion: {
                    select: {
                        relatedPersonName: true,
                    },
                },
                sourceFamilyMember: {
                    select: {
                        name: true,
                    },
                },
                sourcePledge: {
                    select: {
                        quantity: true,
                        amount: true,
                        expectedFulfillmentDate: true,
                        pledgeType: true,
                    },
                },
            },
        });
        if (!reminder) {
            throw new common_1.NotFoundException('Reminder task not found');
        }
        const phone = reminder.donor.whatsappPhone || reminder.donor.primaryPhone;
        const phoneCode = reminder.donor.whatsappPhoneCode || reminder.donor.primaryPhoneCode || '91';
        const donorName = `${reminder.donor.firstName} ${reminder.donor.lastName || ''}`.trim();
        const relatedPersonName = reminder.sourceFamilyMember?.name || reminder.sourceOccasion?.relatedPersonName;
        const templateType = this.mapReminderTypeToTemplateType(reminder.type);
        const template = await this.templatesService.findByType(templateType);
        let message;
        if (template && template.whatsappMessage) {
            const pledgeDescription = reminder.sourcePledge
                ? (reminder.sourcePledge.pledgeType === 'MONEY'
                    ? `Monetary donation`
                    : reminder.sourcePledge.quantity || 'your pledge')
                : 'your pledge';
            const pledgeAmountStr = reminder.sourcePledge?.amount
                ? `Rs. ${Number(reminder.sourcePledge.amount).toLocaleString('en-IN')}`
                : '';
            message = await this.resolveTemplatePlaceholders(template.whatsappMessage, {
                donorName,
                relatedPerson: relatedPersonName || undefined,
                pledgeItem: pledgeDescription,
                pledgeAmount: pledgeAmountStr || undefined,
                dueDate: reminder.sourcePledge?.expectedFulfillmentDate
                    ? new Date(reminder.sourcePledge.expectedFulfillmentDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })
                    : undefined,
            });
        }
        else {
            message = await this.getFallbackWhatsAppMessage(reminder.type, donorName, relatedPersonName || undefined);
        }
        await this.communicationLogService.logWhatsApp({
            donorId: reminder.donorId,
            phoneNumber: `+${phoneCode}${phone}`,
            messagePreview: message.substring(0, 200),
            sentById: user.id,
            type: client_1.CommunicationType.GREETING,
        });
        await this.auditService.log({
            userId: user.id,
            action: client_1.AuditAction.DONOR_UPDATE,
            entityType: 'ReminderTask',
            entityId: reminderId,
            newValue: { action: 'whatsapp_sent' },
            metadata: { phone: `+${phoneCode}${phone}`, reminderType: reminder.type },
        });
        return {
            phone: `${phoneCode}${phone}`,
            message,
            donorName,
        };
    }
    async sendManualEmail(user, reminderId) {
        const reminder = await this.prisma.reminderTask.findUnique({
            where: { id: reminderId },
            include: {
                donor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        personalEmail: true,
                        officialEmail: true,
                        prefEmail: true,
                    },
                },
                sourceOccasion: {
                    select: {
                        relatedPersonName: true,
                    },
                },
                sourceFamilyMember: {
                    select: {
                        name: true,
                    },
                },
                sourcePledge: {
                    select: {
                        quantity: true,
                        amount: true,
                        expectedFulfillmentDate: true,
                        pledgeType: true,
                    },
                },
            },
        });
        if (!reminder) {
            throw new common_1.NotFoundException('Reminder task not found');
        }
        const emailEligibleOffsets = [7, 2, 0];
        if (!emailEligibleOffsets.includes(reminder.offsetDays || -1)) {
            return {
                success: false,
                message: `Email not available for ${reminder.offsetDays}-day reminders. Only 7-day, 2-day, and same-day reminders support email.`
            };
        }
        const donorEmail = reminder.donor.prefEmail
            ? (reminder.donor.personalEmail || reminder.donor.officialEmail)
            : (reminder.donor.officialEmail || reminder.donor.personalEmail);
        if (!donorEmail) {
            return { success: false, message: 'Donor has no email address on file' };
        }
        const donorName = `${reminder.donor.firstName} ${reminder.donor.lastName || ''}`.trim();
        const relatedPersonName = reminder.sourceFamilyMember?.name || reminder.sourceOccasion?.relatedPersonName;
        const templateType = this.mapReminderTypeToTemplateType(reminder.type);
        const template = await this.templatesService.findByType(templateType);
        let emailSubject;
        let emailBody;
        if (template && template.emailBody && template.emailSubject) {
            const pledgeDescription = reminder.sourcePledge
                ? (reminder.sourcePledge.pledgeType === 'MONEY'
                    ? `Monetary donation`
                    : reminder.sourcePledge.quantity || 'your pledge')
                : 'your pledge';
            const pledgeAmountStr = reminder.sourcePledge?.amount
                ? `Rs. ${Number(reminder.sourcePledge.amount).toLocaleString('en-IN')}`
                : '';
            const resolvedSubject = await this.resolveTemplatePlaceholders(template.emailSubject, {
                donorName,
                relatedPerson: relatedPersonName || undefined,
                pledgeItem: pledgeDescription,
                pledgeAmount: pledgeAmountStr || undefined,
                dueDate: reminder.sourcePledge?.expectedFulfillmentDate
                    ? new Date(reminder.sourcePledge.expectedFulfillmentDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })
                    : undefined,
            });
            const resolvedBody = await this.resolveTemplatePlaceholders(template.emailBody, {
                donorName,
                relatedPerson: relatedPersonName || undefined,
                pledgeItem: pledgeDescription,
                pledgeAmount: pledgeAmountStr || undefined,
                dueDate: reminder.sourcePledge?.expectedFulfillmentDate
                    ? new Date(reminder.sourcePledge.expectedFulfillmentDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })
                    : undefined,
            });
            if (resolvedSubject.trim() && resolvedBody.trim().length > 20) {
                emailSubject = resolvedSubject;
                emailBody = resolvedBody;
            }
            else {
                emailSubject = await this.getEmailSubject(reminder.type);
                emailBody = await this.getFallbackEmailBody(reminder.type, donorName, relatedPersonName || undefined);
            }
        }
        else {
            emailSubject = await this.getEmailSubject(reminder.type);
            emailBody = await this.getFallbackEmailBody(reminder.type, donorName, relatedPersonName || undefined);
        }
        const org = await this.orgProfileService.getProfile();
        const phoneDisplay = org.phone2 ? `${org.phone1} / ${org.phone2}` : org.phone1;
        const fullEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        ${emailBody.split('\n').map(line => `<p style="margin: 0 0 10px 0;">${line}</p>`).join('')}
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #cccccc; font-size: 13px; color: #666666;">
          <p style="margin: 0;">With heartfelt gratitude,</p>
          <p style="margin: 5px 0 15px 0;"><strong>${org.name}</strong></p>
          <p style="margin: 0;">Phone: ${phoneDisplay}</p>
          <p style="margin: 0;">Email: ${org.email}</p>
          <p style="margin: 0;">Website: ${org.website}</p>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #999999; font-style: italic;">
          (This is an automated email. Please do not reply.)
        </p>
      </div>
    `;
        try {
            const result = await this.emailService.sendEmail({
                to: donorEmail,
                subject: emailSubject,
                html: fullEmailHtml,
                text: emailBody,
            });
            if (result.success) {
                await this.prisma.reminderTask.update({
                    where: { id: reminder.id },
                    data: {
                        autoEmailSent: true,
                        autoEmailSentAt: new Date(),
                        status: client_1.ReminderTaskStatus.DONE,
                        completedAt: new Date(),
                    },
                });
                await this.communicationLogService.logEmail({
                    donorId: reminder.donorId,
                    toEmail: donorEmail,
                    subject: emailSubject,
                    messagePreview: emailBody.substring(0, 200),
                    status: 'SENT',
                    sentById: user.id,
                    type: client_1.CommunicationType.GREETING,
                });
                await this.auditService.log({
                    userId: user.id,
                    action: client_1.AuditAction.DONOR_UPDATE,
                    entityType: 'ReminderTask',
                    entityId: reminderId,
                    newValue: { action: 'email_sent_manual', toEmail: donorEmail },
                    metadata: { reminderType: reminder.type },
                });
                this.logger.log(`Manual email sent for reminder ${reminderId} to ${donorEmail}`);
                return { success: true, message: `Email sent successfully to ${donorEmail}` };
            }
            else {
                await this.communicationLogService.logEmail({
                    donorId: reminder.donorId,
                    toEmail: donorEmail,
                    subject: emailSubject,
                    messagePreview: emailBody.substring(0, 200),
                    status: 'FAILED',
                    errorMessage: result.error,
                    sentById: user.id,
                    type: client_1.CommunicationType.GREETING,
                });
                this.logger.error(`Failed to send manual email for reminder ${reminderId}: ${result.error}`);
                return { success: false, message: `Failed to send email: ${result.error}` };
            }
        }
        catch (error) {
            this.logger.error(`Error sending manual email for reminder ${reminderId}: ${error.message}`);
            return { success: false, message: `Error sending email: ${error.message}` };
        }
    }
    async getFallbackEmailBody(type, donorName, relatedPersonName) {
        const org = await this.orgProfileService.getProfile();
        switch (type) {
            case client_1.ReminderTaskType.BIRTHDAY:
                return `Dear ${donorName},

On behalf of everyone at ${org.name}, we wish you a very Happy Birthday!

Your generous support has touched countless lives, and we are truly grateful for your partnership in our mission.

May your special day be filled with joy, love, and all the happiness you deserve.`;
            case client_1.ReminderTaskType.FAMILY_BIRTHDAY:
                return `Dear ${donorName},

Wishing ${relatedPersonName || 'your loved one'} a very Happy Birthday from all of us at ${org.name}!

May this special day be filled with joy, laughter, and wonderful memories.`;
            case client_1.ReminderTaskType.ANNIVERSARY:
                return `Dear ${donorName},

Warmest wishes on your Anniversary from all of us at ${org.name}!

Your support and partnership mean so much to us. We hope this special day brings you wonderful memories and continued happiness.`;
            case client_1.ReminderTaskType.MEMORIAL:
                return `Dear ${donorName},

On this day, we pause to remember ${relatedPersonName || 'your loved one'} and send you our thoughts and prayers.

We are honored that you continue to be part of the ${org.name} family, and we hope our work together brings some comfort and meaning.`;
            case client_1.ReminderTaskType.PLEDGE:
                return `Dear ${donorName},

We hope this message finds you well.

This is a friendly reminder about your pledge to ${org.name}.

Your continued support is vital to our mission. If you have any questions or need assistance, please do not hesitate to reach out.`;
            default:
                return `Dear ${donorName},

Greetings from ${org.name}!

It has been a while since we last connected, and we wanted to reach out and share how your past support has made a difference.

We would love the opportunity to reconnect and update you on our latest initiatives. Please feel free to reach out at your convenience.`;
        }
    }
    async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const monthFromNow = new Date(today);
        monthFromNow.setDate(monthFromNow.getDate() + 30);
        const [todayCount, weekCount, monthCount, overdueCount] = await Promise.all([
            this.prisma.reminderTask.count({
                where: {
                    status: { in: [client_1.ReminderTaskStatus.OPEN, client_1.ReminderTaskStatus.SNOOZED] },
                    dueDate: { gte: today, lte: endOfToday },
                    OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: today } }],
                },
            }),
            this.prisma.reminderTask.count({
                where: {
                    status: { in: [client_1.ReminderTaskStatus.OPEN, client_1.ReminderTaskStatus.SNOOZED] },
                    dueDate: { gte: today, lte: weekFromNow },
                    OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: today } }],
                },
            }),
            this.prisma.reminderTask.count({
                where: {
                    status: { in: [client_1.ReminderTaskStatus.OPEN, client_1.ReminderTaskStatus.SNOOZED] },
                    dueDate: { gte: today, lte: monthFromNow },
                    OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: today } }],
                },
            }),
            this.prisma.reminderTask.count({
                where: {
                    status: client_1.ReminderTaskStatus.OPEN,
                    dueDate: { lt: today },
                },
            }),
        ]);
        return { today: todayCount, week: weekCount, month: monthCount, overdue: overdueCount };
    }
};
exports.ReminderTasksService = ReminderTasksService;
exports.ReminderTasksService = ReminderTasksService = ReminderTasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        email_service_1.EmailService,
        communication_log_service_1.CommunicationLogService,
        templates_service_1.TemplatesService,
        organization_profile_service_1.OrganizationProfileService,
        email_jobs_service_1.EmailJobsService,
        communications_service_1.CommunicationsService])
], ReminderTasksService);
//# sourceMappingURL=reminder-tasks.service.js.map