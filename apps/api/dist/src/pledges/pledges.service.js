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
var PledgesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PledgesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const communication_log_service_1 = require("../communication-log/communication-log.service");
const email_jobs_service_1 = require("../email-jobs/email-jobs.service");
const organization_profile_service_1 = require("../organization-profile/organization-profile.service");
const client_1 = require("@prisma/client");
const pledgeTypeLabels = {
    MONEY: 'Money',
    RICE: 'Rice',
    GROCERIES: 'Groceries',
    MEDICINES: 'Medicines',
    MEAL_SPONSOR: 'Meal Sponsor',
    VISIT: 'Visit',
    OTHER: 'Other',
};
const pledgeTypeToDonationType = {
    MONEY: 'CASH',
    RICE: 'RICE_BAGS',
    GROCERIES: 'GROCERIES',
    MEDICINES: 'MEDICINES',
    MEAL_SPONSOR: 'ANNADANAM',
    VISIT: 'OTHER',
    OTHER: 'OTHER',
};
let PledgesService = PledgesService_1 = class PledgesService {
    constructor(prisma, auditService, communicationLogService, emailJobsService, orgProfileService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.communicationLogService = communicationLogService;
        this.emailJobsService = emailJobsService;
        this.orgProfileService = orgProfileService;
        this.logger = new common_1.Logger(PledgesService_1.name);
    }
    getDonorAccessFilter(_user) {
        return {};
    }
    async findAll(user, options = {}) {
        const { page = 1, limit = 20, donorId, status, sortBy = 'expectedFulfillmentDate', sortOrder = 'asc' } = options;
        const accessFilter = this.getDonorAccessFilter(user);
        const where = {
            isDeleted: false,
            ...accessFilter,
        };
        if (donorId) {
            where.donorId = donorId;
        }
        if (status) {
            where.status = status;
        }
        const [pledges, total] = await Promise.all([
            this.prisma.pledge.findMany({
                where,
                include: {
                    donor: {
                        select: {
                            id: true,
                            donorCode: true,
                            firstName: true,
                            lastName: true,
                            primaryPhone: true,
                            whatsappPhone: true,
                            personalEmail: true,
                        },
                    },
                    createdBy: { select: { id: true, name: true } },
                    fulfilledDonation: {
                        select: { id: true, donationAmount: true, donationDate: true, receiptNumber: true },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.pledge.count({ where }),
        ]);
        return {
            items: pledges.map(p => ({
                ...p,
                pledgeTypeLabel: pledgeTypeLabels[p.pledgeType],
                amount: p.amount ? p.amount.toNumber() : null,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(user, id) {
        const accessFilter = this.getDonorAccessFilter(user);
        const pledge = await this.prisma.pledge.findFirst({
            where: { id, isDeleted: false, ...accessFilter },
            include: {
                donor: {
                    select: {
                        id: true,
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        primaryPhone: true,
                        whatsappPhone: true,
                        personalEmail: true,
                    },
                },
                createdBy: { select: { id: true, name: true } },
                fulfilledDonation: true,
            },
        });
        if (!pledge) {
            throw new common_1.NotFoundException('Pledge not found');
        }
        return {
            ...pledge,
            pledgeTypeLabel: pledgeTypeLabels[pledge.pledgeType],
            amount: pledge.amount ? pledge.amount.toNumber() : null,
        };
    }
    async create(user, data, ipAddress, userAgent) {
        const donor = await this.prisma.donor.findFirst({
            where: { id: data.donorId, isDeleted: false },
            select: { id: true, donorCode: true },
        });
        if (!donor) {
            throw new common_1.NotFoundException('Donor not found');
        }
        if (!data.expectedFulfillmentDate) {
            throw new common_1.BadRequestException('Expected fulfillment date is required');
        }
        const pledge = await this.prisma.pledge.create({
            data: {
                donorId: data.donorId,
                pledgeType: data.pledgeType || client_1.PledgeType.MONEY,
                amount: data.amount ? parseFloat(data.amount) : null,
                quantity: data.quantity || null,
                currency: data.currency || 'INR',
                promisedDate: data.promisedDate ? new Date(data.promisedDate) : null,
                promisedMonth: data.promisedMonth || null,
                promisedDay: data.promisedDay || null,
                expectedFulfillmentDate: new Date(data.expectedFulfillmentDate),
                notes: data.notes || null,
                createdById: user.id,
            },
            include: {
                donor: {
                    select: { id: true, donorCode: true, firstName: true, lastName: true },
                },
            },
        });
        await this.auditService.logPledgeCreate(user.id, pledge.id, { donorId: data.donorId, pledgeType: pledge.pledgeType, amount: pledge.amount }, ipAddress, userAgent);
        await this.generatePledgeReminders(pledge.id, pledge.donorId, pledge.expectedFulfillmentDate, pledge.pledgeType);
        this.logger.log(`Pledge ${pledge.id} created for donor ${donor.donorCode}`);
        return {
            ...pledge,
            pledgeTypeLabel: pledgeTypeLabels[pledge.pledgeType],
            amount: pledge.amount ? pledge.amount.toNumber() : null,
        };
    }
    async update(user, id, data, ipAddress, userAgent) {
        const existing = await this.prisma.pledge.findFirst({
            where: { id, isDeleted: false },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Pledge not found');
        }
        const updateData = {};
        if (data.pledgeType !== undefined)
            updateData.pledgeType = data.pledgeType;
        if (data.amount !== undefined)
            updateData.amount = data.amount ? parseFloat(data.amount) : null;
        if (data.quantity !== undefined)
            updateData.quantity = data.quantity;
        if (data.expectedFulfillmentDate !== undefined) {
            updateData.expectedFulfillmentDate = new Date(data.expectedFulfillmentDate);
        }
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        if (data.promisedDate !== undefined)
            updateData.promisedDate = data.promisedDate ? new Date(data.promisedDate) : null;
        if (data.promisedMonth !== undefined)
            updateData.promisedMonth = data.promisedMonth;
        if (data.promisedDay !== undefined)
            updateData.promisedDay = data.promisedDay;
        const pledge = await this.prisma.pledge.update({
            where: { id },
            data: updateData,
            include: {
                donor: {
                    select: { id: true, donorCode: true, firstName: true, lastName: true },
                },
            },
        });
        await this.auditService.logPledgeUpdate(user.id, pledge.id, { status: existing.status, amount: existing.amount }, updateData, ipAddress, userAgent);
        if (updateData.expectedFulfillmentDate) {
            await this.prisma.reminderTask.deleteMany({
                where: { sourcePledgeId: id, status: 'OPEN' },
            });
            await this.generatePledgeReminders(pledge.id, pledge.donorId, pledge.expectedFulfillmentDate, pledge.pledgeType);
        }
        return {
            ...pledge,
            pledgeTypeLabel: pledgeTypeLabels[pledge.pledgeType],
            amount: pledge.amount ? pledge.amount.toNumber() : null,
        };
    }
    async markFulfilled(user, id, dto = {}, ipAddress, userAgent) {
        const existing = await this.prisma.pledge.findFirst({
            where: { id, isDeleted: false },
            include: {
                donor: {
                    select: { id: true, donorCode: true, firstName: true, lastName: true, primaryPhone: true, whatsappPhone: true, personalEmail: true },
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Pledge not found');
        }
        if (existing.status === client_1.PledgeStatus.FULFILLED) {
            throw new common_1.BadRequestException('Pledge is already fulfilled');
        }
        let donationId = dto.donationId;
        let createdDonation = null;
        if (dto.autoCreateDonation && !donationId) {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            const financialYear = currentMonth >= 4
                ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
                : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
            const receiptPrefix = `AKF-REC-${currentYear}-`;
            const lastReceipt = await this.prisma.donation.findFirst({
                where: {
                    receiptNumber: { startsWith: receiptPrefix, not: null },
                },
                orderBy: { receiptNumber: 'desc' },
                select: { receiptNumber: true },
            });
            let nextReceiptNum = 1;
            if (lastReceipt?.receiptNumber) {
                const match = lastReceipt.receiptNumber.match(/-(\d+)$/);
                if (match) {
                    nextReceiptNum = parseInt(match[1], 10) + 1;
                }
            }
            const receiptNumber = `AKF-REC-${currentYear}-${nextReceiptNum.toString().padStart(4, '0')}`;
            const donationAmount = dto.donationAmount || (existing.amount ? existing.amount.toNumber() : 0);
            const donationType = dto.donationType || pledgeTypeToDonationType[existing.pledgeType] || 'CASH';
            const donationMode = dto.donationMode || 'CASH';
            createdDonation = await this.prisma.donation.create({
                data: {
                    donorId: existing.donorId,
                    donationDate: dto.donationDate ? new Date(dto.donationDate) : new Date(),
                    donationAmount: donationAmount,
                    currency: existing.currency || 'INR',
                    donationType: donationType,
                    donationMode: donationMode,
                    remarks: dto.remarks || `Pledge fulfilled - ${pledgeTypeLabels[existing.pledgeType]}`,
                    receiptNumber,
                    financialYear,
                    createdById: user.id,
                },
            });
            donationId = createdDonation.id;
            this.logger.log(`Auto-created donation ${createdDonation.id} with receipt ${receiptNumber} for pledge ${id}`);
        }
        if (donationId && !dto.autoCreateDonation) {
            const donation = await this.prisma.donation.findFirst({
                where: { id: donationId, isDeleted: false },
            });
            if (!donation) {
                throw new common_1.NotFoundException('Donation not found');
            }
        }
        const pledge = await this.prisma.pledge.update({
            where: { id },
            data: {
                status: client_1.PledgeStatus.FULFILLED,
                fulfilledDonationId: donationId || null,
            },
            include: {
                donor: {
                    select: { id: true, donorCode: true, firstName: true, lastName: true },
                },
                fulfilledDonation: donationId ? {
                    select: { id: true, donationAmount: true, donationDate: true, receiptNumber: true },
                } : false,
            },
        });
        await this.prisma.reminderTask.updateMany({
            where: { sourcePledgeId: id, status: 'OPEN' },
            data: { status: 'DONE', completedAt: new Date() },
        });
        await this.auditService.logPledgeFulfilled(user.id, pledge.id, { status: existing.status }, { status: client_1.PledgeStatus.FULFILLED, fulfilledDonationId: donationId, autoCreatedDonation: !!dto.autoCreateDonation }, ipAddress || '', userAgent || '');
        try {
            const donorName = [existing.donor.firstName, existing.donor.lastName].filter(Boolean).join(' ');
            const phone = existing.donor.whatsappPhone || existing.donor.primaryPhone;
            if (phone) {
                await this.communicationLogService.logWhatsApp({
                    donorId: existing.donorId,
                    phoneNumber: phone,
                    messagePreview: `Pledge fulfilled: ${pledgeTypeLabels[existing.pledgeType]}${existing.amount ? ` - Rs. ${existing.amount.toNumber().toLocaleString('en-IN')}` : ''}`,
                    sentById: user.id,
                    type: 'FOLLOW_UP',
                });
            }
        }
        catch (err) {
            this.logger.warn(`Failed to log pledge fulfillment communication: ${err.message}`);
        }
        this.logger.log(`Pledge ${pledge.id} marked as fulfilled`);
        return {
            ...pledge,
            pledgeTypeLabel: pledgeTypeLabels[pledge.pledgeType],
            amount: pledge.amount ? pledge.amount.toNumber() : null,
            createdDonation: createdDonation ? {
                id: createdDonation.id,
                receiptNumber: createdDonation.receiptNumber,
                donationAmount: createdDonation.donationAmount,
            } : null,
        };
    }
    async postpone(user, id, newDate, notes, ipAddress, userAgent) {
        const existing = await this.prisma.pledge.findFirst({
            where: { id, isDeleted: false },
            include: {
                donor: {
                    select: { id: true, donorCode: true, firstName: true, lastName: true, primaryPhone: true, whatsappPhone: true, personalEmail: true },
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Pledge not found');
        }
        if (existing.status === client_1.PledgeStatus.FULFILLED) {
            throw new common_1.BadRequestException('Cannot postpone a fulfilled pledge');
        }
        const newExpectedDate = new Date(newDate);
        const updatedNotes = notes
            ? `${existing.notes || ''}\n[Postponed ${new Date().toLocaleDateString('en-IN')}] ${notes}`.trim()
            : existing.notes;
        const pledge = await this.prisma.pledge.update({
            where: { id },
            data: {
                status: client_1.PledgeStatus.POSTPONED,
                expectedFulfillmentDate: newExpectedDate,
                notes: updatedNotes,
            },
            include: {
                donor: {
                    select: { id: true, donorCode: true, firstName: true, lastName: true },
                },
            },
        });
        await this.prisma.reminderTask.deleteMany({
            where: { sourcePledgeId: id, status: 'OPEN' },
        });
        await this.generatePledgeReminders(pledge.id, pledge.donorId, newExpectedDate, pledge.pledgeType);
        await this.auditService.logPledgePostponed(user.id, pledge.id, { status: existing.status, expectedFulfillmentDate: existing.expectedFulfillmentDate }, { status: client_1.PledgeStatus.POSTPONED, expectedFulfillmentDate: newExpectedDate, reason: notes }, ipAddress || '', userAgent || '');
        this.logger.log(`Pledge ${pledge.id} postponed to ${newDate}`);
        return {
            ...pledge,
            pledgeTypeLabel: pledgeTypeLabels[pledge.pledgeType],
            amount: pledge.amount ? pledge.amount.toNumber() : null,
        };
    }
    async cancel(user, id, reason, ipAddress, userAgent) {
        const existing = await this.prisma.pledge.findFirst({
            where: { id, isDeleted: false },
            include: {
                donor: {
                    select: { id: true, donorCode: true, firstName: true, lastName: true },
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Pledge not found');
        }
        if (existing.status === client_1.PledgeStatus.FULFILLED) {
            throw new common_1.BadRequestException('Cannot cancel a fulfilled pledge');
        }
        if (!reason || reason.trim().length === 0) {
            throw new common_1.BadRequestException('Cancellation reason is required');
        }
        const updatedNotes = `${existing.notes || ''}\n[Cancelled ${new Date().toLocaleDateString('en-IN')}] Reason: ${reason}`.trim();
        const pledge = await this.prisma.pledge.update({
            where: { id },
            data: {
                status: client_1.PledgeStatus.CANCELLED,
                notes: updatedNotes,
            },
            include: {
                donor: {
                    select: { id: true, donorCode: true, firstName: true, lastName: true },
                },
            },
        });
        await this.prisma.reminderTask.updateMany({
            where: { sourcePledgeId: id, status: 'OPEN' },
            data: { status: 'DONE', completedAt: new Date() },
        });
        await this.auditService.logPledgeCancelled(user.id, pledge.id, { status: existing.status }, { status: client_1.PledgeStatus.CANCELLED, reason }, ipAddress || '', userAgent || '');
        return {
            ...pledge,
            pledgeTypeLabel: pledgeTypeLabels[pledge.pledgeType],
            amount: pledge.amount ? pledge.amount.toNumber() : null,
        };
    }
    async delete(user, id, ipAddress, userAgent) {
        if (user.role !== client_1.Role.ADMIN && user.role !== client_1.Role.FOUNDER) {
            throw new common_1.ForbiddenException('Only admins can delete pledges');
        }
        const existing = await this.prisma.pledge.findFirst({
            where: { id, isDeleted: false },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Pledge not found');
        }
        await this.prisma.pledge.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() },
        });
        await this.prisma.reminderTask.deleteMany({
            where: { sourcePledgeId: id },
        });
        await this.auditService.logPledgeDelete(user.id, id, { pledgeType: existing.pledgeType, amount: existing.amount }, ipAddress, userAgent);
        this.logger.log(`Pledge ${id} deleted by admin`);
        return { success: true };
    }
    async getDonorPledgeSuggestions(donorId) {
        const pendingPledges = await this.prisma.pledge.findMany({
            where: {
                donorId,
                isDeleted: false,
                status: { in: [client_1.PledgeStatus.PENDING, client_1.PledgeStatus.POSTPONED] },
            },
            orderBy: { expectedFulfillmentDate: 'asc' },
        });
        return pendingPledges.map(p => ({
            id: p.id,
            pledgeType: p.pledgeType,
            pledgeTypeLabel: pledgeTypeLabels[p.pledgeType],
            amount: p.amount ? p.amount.toNumber() : null,
            quantity: p.quantity,
            expectedFulfillmentDate: p.expectedFulfillmentDate,
            notes: p.notes,
        }));
    }
    async sendPledgeReminderEmail(user, id) {
        const pledge = await this.prisma.pledge.findFirst({
            where: { id, isDeleted: false },
            include: {
                donor: {
                    select: {
                        id: true,
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        personalEmail: true,
                        officialEmail: true,
                        primaryPhone: true,
                    },
                },
            },
        });
        if (!pledge) {
            throw new common_1.NotFoundException('Pledge not found');
        }
        const donorEmail = pledge.donor.personalEmail || pledge.donor.officialEmail;
        if (!donorEmail) {
            throw new common_1.BadRequestException('Donor has no email address on file');
        }
        const donorName = [pledge.donor.firstName, pledge.donor.lastName].filter(Boolean).join(' ') || 'Valued Donor';
        const pledgeLabel = pledgeTypeLabels[pledge.pledgeType];
        const amountStr = pledge.amount ? `Rs. ${pledge.amount.toNumber().toLocaleString('en-IN')}` : '';
        const dueDate = pledge.expectedFulfillmentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const orgName = (await this.orgProfileService.getProfile()).name;
        const subject = `Gentle Reminder: Pledge Due - ${pledgeLabel}${amountStr ? ` (${amountStr})` : ''}`;
        const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <p>Dear ${donorName},</p>
        <p>This is a gentle reminder about your pledge to ${orgName}.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; font-weight: bold; width: 140px;">Pledge Type:</td><td style="padding: 8px;">${pledgeLabel}</td></tr>
          ${amountStr ? `<tr><td style="padding: 8px; font-weight: bold;">Amount:</td><td style="padding: 8px;">${amountStr}</td></tr>` : ''}
          ${pledge.quantity ? `<tr><td style="padding: 8px; font-weight: bold;">Quantity:</td><td style="padding: 8px;">${pledge.quantity}</td></tr>` : ''}
          <tr><td style="padding: 8px; font-weight: bold;">Expected Date:</td><td style="padding: 8px;">${dueDate}</td></tr>
        </table>
        <p>Your continued support helps us continue our mission of serving those in need.</p>
        <p>If you have already fulfilled this pledge, please ignore this message.</p>
        <p>Warm regards,<br/>${orgName}</p>
      </div>
    `;
        const scheduledAt = new Date();
        await this.emailJobsService.create({
            donorId: pledge.donor.id,
            toEmail: donorEmail,
            subject,
            body,
            type: 'PLEDGE_REMINDER',
            relatedId: pledge.id,
            scheduledAt,
        });
        await this.communicationLogService.logEmail({
            donorId: pledge.donor.id,
            toEmail: donorEmail,
            subject,
            messagePreview: `Pledge reminder: ${pledgeLabel}${amountStr ? ` - ${amountStr}` : ''} due ${dueDate}`,
            status: 'SENT',
            sentById: user.id,
            type: 'FOLLOW_UP',
        });
        this.logger.log(`Pledge reminder email queued for pledge ${id} to ${donorEmail}`);
        return { success: true, message: `Reminder email queued to ${donorEmail}` };
    }
    async buildWhatsAppReminderText(pledge) {
        const donorName = [pledge.donor?.firstName, pledge.donor?.lastName].filter(Boolean).join(' ') || 'Valued Donor';
        const pledgeLabel = pledgeTypeLabels[pledge.pledgeType] || pledge.pledgeType;
        const amountStr = pledge.amount ? `Rs. ${(typeof pledge.amount === 'object' ? pledge.amount.toNumber() : pledge.amount).toLocaleString('en-IN')}` : '';
        const dueDate = new Date(pledge.expectedFulfillmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const org = await this.orgProfileService.getProfile();
        return `Dear ${donorName},\n\nThis is a gentle reminder about your pledge to ${org.name}.\n\nPledge: ${pledgeLabel}${amountStr ? `\nAmount: ${amountStr}` : ''}${pledge.quantity ? `\nQuantity: ${pledge.quantity}` : ''}\nExpected Date: ${dueDate}\n\nYour continued support helps us serve those in need. Thank you for your generosity!\n\nIf you have already fulfilled this pledge, please ignore this message.\n\nWarm regards,\n${org.name}`;
    }
    async logWhatsAppReminder(user, id) {
        const pledge = await this.prisma.pledge.findFirst({
            where: { id, isDeleted: false },
            include: {
                donor: {
                    select: {
                        id: true, firstName: true, lastName: true,
                        primaryPhone: true, whatsappPhone: true,
                    },
                },
            },
        });
        if (!pledge) {
            throw new common_1.NotFoundException('Pledge not found');
        }
        const phone = pledge.donor.whatsappPhone || pledge.donor.primaryPhone;
        if (!phone) {
            throw new common_1.BadRequestException('Donor has no phone number on file');
        }
        const pledgeLabel = pledgeTypeLabels[pledge.pledgeType];
        const amountStr = pledge.amount ? `Rs. ${pledge.amount.toNumber().toLocaleString('en-IN')}` : '';
        await this.communicationLogService.logWhatsApp({
            donorId: pledge.donor.id,
            phoneNumber: phone,
            messagePreview: `Pledge reminder: ${pledgeLabel}${amountStr ? ` - ${amountStr}` : ''}`,
            sentById: user.id,
            type: 'FOLLOW_UP',
        });
        return { success: true, message: 'WhatsApp reminder logged' };
    }
    async generatePledgeReminders(pledgeId, donorId, dueDate, pledgeType) {
        const offsets = [7, 2, 0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (const offset of offsets) {
            const reminderDate = new Date(dueDate);
            reminderDate.setDate(reminderDate.getDate() - offset);
            reminderDate.setHours(0, 0, 0, 0);
            if (reminderDate < today)
                continue;
            const title = offset === 0
                ? `Pledge Due Today (${pledgeTypeLabels[pledgeType]})`
                : `Pledge Due in ${offset} days (${pledgeTypeLabels[pledgeType]})`;
            try {
                await this.prisma.reminderTask.upsert({
                    where: {
                        unique_pledge_reminder: {
                            donorId,
                            sourcePledgeId: pledgeId,
                            offsetDays: offset,
                        },
                    },
                    update: {
                        title,
                        dueDate: reminderDate,
                        status: 'OPEN',
                    },
                    create: {
                        donorId,
                        type: 'PLEDGE',
                        title,
                        dueDate: reminderDate,
                        sourcePledgeId: pledgeId,
                        offsetDays: offset,
                        status: 'OPEN',
                    },
                });
            }
            catch (error) {
                this.logger.warn(`Failed to create pledge reminder: ${error.message}`);
            }
        }
    }
};
exports.PledgesService = PledgesService;
exports.PledgesService = PledgesService = PledgesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        communication_log_service_1.CommunicationLogService,
        email_jobs_service_1.EmailJobsService,
        organization_profile_service_1.OrganizationProfileService])
], PledgesService);
//# sourceMappingURL=pledges.service.js.map