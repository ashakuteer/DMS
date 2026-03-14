import { Injectable, ForbiddenException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { EmailJobsService } from '../email-jobs/email-jobs.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { Role, PledgeStatus, PledgeType } from '@prisma/client';

export interface PledgeQueryOptions {
  page?: number;
  limit?: number;
  donorId?: string;
  status?: PledgeStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserContext {
  id: string;
  role: Role;
  email: string;
}

export interface FulfillPledgeDto {
  donationId?: string;
  donationAmount?: number;
  donationDate?: string;
  donationMode?: string;
  donationType?: string;
  remarks?: string;
  autoCreateDonation?: boolean;
}

const pledgeTypeLabels: Record<PledgeType, string> = {
  MONEY: 'Money',
  RICE: 'Rice',
  GROCERIES: 'Groceries',
  MEDICINES: 'Medicines',
  MEAL_SPONSOR: 'Meal Sponsor',
  VISIT: 'Visit',
  OTHER: 'Other',
};

const pledgeTypeToDonationType: Record<string, string> = {
  MONEY: 'CASH',
  RICE: 'RICE_BAGS',
  GROCERIES: 'GROCERIES',
  MEDICINES: 'MEDICINES',
  MEAL_SPONSOR: 'ANNADANAM',
  VISIT: 'OTHER',
  OTHER: 'OTHER',
};

@Injectable()
export class PledgesService {
  private readonly logger = new Logger(PledgesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private communicationLogService: CommunicationLogService,
    private emailJobsService: EmailJobsService,
    private orgProfileService: OrganizationProfileService,
  ) {}

  private getDonorAccessFilter(user: UserContext): Record<string, any> {
    if (user.role === Role.TELECALLER) {
      return { donor: { assignedToUserId: user.id } };
    }
    return {};
  }

  async findAll(user: UserContext, options: PledgeQueryOptions = {}) {
    const { page = 1, limit = 20, donorId, status, sortBy = 'expectedFulfillmentDate', sortOrder = 'asc' } = options;

    const accessFilter = this.getDonorAccessFilter(user);

    const where: any = {
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

  async findOne(user: UserContext, id: string) {
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
      throw new NotFoundException('Pledge not found');
    }

    return {
      ...pledge,
      pledgeTypeLabel: pledgeTypeLabels[pledge.pledgeType],
      amount: pledge.amount ? pledge.amount.toNumber() : null,
    };
  }

  async create(user: UserContext, data: any, ipAddress: string, userAgent: string) {
    if (user.role === Role.TELECALLER) {
      throw new ForbiddenException('Telecallers cannot create pledges');
    }

    const donor = await this.prisma.donor.findFirst({
      where: { id: data.donorId, isDeleted: false },
      select: { id: true },
    });

    if (!donor) {
      throw new NotFoundException('Donor not found');
    }

    if (!data.expectedFulfillmentDate) {
      throw new BadRequestException('Expected fulfillment date is required');
    }

    const pledge = await this.prisma.pledge.create({
      data: {
        donorId: data.donorId,
        pledgeType: data.pledgeType || PledgeType.MONEY,
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

    await this.auditService.logPledgeCreate(
      user.id,
      pledge.id,
      { donorId: data.donorId, pledgeType: pledge.pledgeType, amount: pledge.amount },
      ipAddress,
      userAgent,
    );

    await this.generatePledgeReminders(pledge.id, pledge.donorId, pledge.expectedFulfillmentDate, pledge.pledgeType);

    this.logger.log(`Pledge ${pledge.id} created for donor ${donor.donorCode}`);

    return {
      ...pledge,
      pledgeTypeLabel: pledgeTypeLabels[pledge.pledgeType],
      amount: pledge.amount ? pledge.amount.toNumber() : null,
    };
  }

  async update(user: UserContext, id: string, data: any, ipAddress: string, userAgent: string) {
    if (user.role === Role.TELECALLER) {
      throw new ForbiddenException('Telecallers cannot update pledges');
    }

    const existing = await this.prisma.pledge.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Pledge not found');
    }

    const updateData: any = {};
    if (data.pledgeType !== undefined) updateData.pledgeType = data.pledgeType;
    if (data.amount !== undefined) updateData.amount = data.amount ? parseFloat(data.amount) : null;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.expectedFulfillmentDate !== undefined) {
      updateData.expectedFulfillmentDate = new Date(data.expectedFulfillmentDate);
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.promisedDate !== undefined) updateData.promisedDate = data.promisedDate ? new Date(data.promisedDate) : null;
    if (data.promisedMonth !== undefined) updateData.promisedMonth = data.promisedMonth;
    if (data.promisedDay !== undefined) updateData.promisedDay = data.promisedDay;

    const pledge = await this.prisma.pledge.update({
      where: { id },
      data: updateData,
      include: {
        donor: {
          select: { id: true, donorCode: true, firstName: true, lastName: true },
        },
      },
    });

    await this.auditService.logPledgeUpdate(
      user.id,
      pledge.id,
      { status: existing.status, amount: existing.amount },
      updateData,
      ipAddress,
      userAgent,
    );

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

  async markFulfilled(user: UserContext, id: string, dto: FulfillPledgeDto = {}, ipAddress?: string, userAgent?: string) {
    if (user.role === Role.TELECALLER) {
      throw new ForbiddenException('Telecallers cannot fulfill pledges');
    }

    const existing = await this.prisma.pledge.findFirst({
      where: { id, isDeleted: false },
      include: {
        donor: {
          select: { id: true, donorCode: true, firstName: true, lastName: true, primaryPhone: true, whatsappPhone: true, personalEmail: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Pledge not found');
    }

    if (existing.status === PledgeStatus.FULFILLED) {
      throw new BadRequestException('Pledge is already fulfilled');
    }

    let donationId = dto.donationId;
    let createdDonation: any = null;

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
          donationType: donationType as any,
          donationMode: donationMode as any,
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
        throw new NotFoundException('Donation not found');
      }
    }

    const pledge = await this.prisma.pledge.update({
      where: { id },
      data: {
        status: PledgeStatus.FULFILLED,
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

    await this.auditService.logPledgeFulfilled(
      user.id,
      pledge.id,
      { status: existing.status },
      { status: PledgeStatus.FULFILLED, fulfilledDonationId: donationId, autoCreatedDonation: !!dto.autoCreateDonation },
      ipAddress || '',
      userAgent || '',
    );

    try {
      const donorName = [existing.donor.firstName, existing.donor.lastName].filter(Boolean).join(' ');
      const phone = existing.donor.whatsappPhone || existing.donor.primaryPhone;
      if (phone) {
        await this.communicationLogService.logWhatsApp({
          donorId: existing.donorId,
          phoneNumber: phone,
          messagePreview: `Pledge fulfilled: ${pledgeTypeLabels[existing.pledgeType]}${existing.amount ? ` - Rs. ${existing.amount.toNumber().toLocaleString('en-IN')}` : ''}`,
          sentById: user.id,
          type: 'FOLLOW_UP' as any,
        });
      }
    } catch (err) {
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

  async postpone(user: UserContext, id: string, newDate: string, notes?: string, ipAddress?: string, userAgent?: string) {
    if (user.role === Role.TELECALLER) {
      throw new ForbiddenException('Telecallers cannot postpone pledges');
    }

    const existing = await this.prisma.pledge.findFirst({
      where: { id, isDeleted: false },
      include: {
        donor: {
          select: { id: true, donorCode: true, firstName: true, lastName: true, primaryPhone: true, whatsappPhone: true, personalEmail: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Pledge not found');
    }

    if (existing.status === PledgeStatus.FULFILLED) {
      throw new BadRequestException('Cannot postpone a fulfilled pledge');
    }

    const newExpectedDate = new Date(newDate);
    const updatedNotes = notes 
      ? `${existing.notes || ''}\n[Postponed ${new Date().toLocaleDateString('en-IN')}] ${notes}`.trim()
      : existing.notes;

    const pledge = await this.prisma.pledge.update({
      where: { id },
      data: {
        status: PledgeStatus.POSTPONED,
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

    await this.auditService.logPledgePostponed(
      user.id,
      pledge.id,
      { status: existing.status, expectedFulfillmentDate: existing.expectedFulfillmentDate },
      { status: PledgeStatus.POSTPONED, expectedFulfillmentDate: newExpectedDate, reason: notes },
      ipAddress || '',
      userAgent || '',
    );

    this.logger.log(`Pledge ${pledge.id} postponed to ${newDate}`);

    return {
      ...pledge,
      pledgeTypeLabel: pledgeTypeLabels[pledge.pledgeType],
      amount: pledge.amount ? pledge.amount.toNumber() : null,
    };
  }

  async cancel(user: UserContext, id: string, reason?: string, ipAddress?: string, userAgent?: string) {
    if (user.role === Role.TELECALLER) {
      throw new ForbiddenException('Telecallers cannot cancel pledges');
    }

    const existing = await this.prisma.pledge.findFirst({
      where: { id, isDeleted: false },
      include: {
        donor: {
          select: { id: true, donorCode: true, firstName: true, lastName: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Pledge not found');
    }

    if (existing.status === PledgeStatus.FULFILLED) {
      throw new BadRequestException('Cannot cancel a fulfilled pledge');
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Cancellation reason is required');
    }

    const updatedNotes = `${existing.notes || ''}\n[Cancelled ${new Date().toLocaleDateString('en-IN')}] Reason: ${reason}`.trim();

    const pledge = await this.prisma.pledge.update({
      where: { id },
      data: { 
        status: PledgeStatus.CANCELLED,
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

    await this.auditService.logPledgeCancelled(
      user.id,
      pledge.id,
      { status: existing.status },
      { status: PledgeStatus.CANCELLED, reason },
      ipAddress || '',
      userAgent || '',
    );

    return {
      ...pledge,
      pledgeTypeLabel: pledgeTypeLabels[pledge.pledgeType],
      amount: pledge.amount ? pledge.amount.toNumber() : null,
    };
  }

  async delete(user: UserContext, id: string, ipAddress: string, userAgent: string) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can delete pledges');
    }

    const existing = await this.prisma.pledge.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Pledge not found');
    }

    await this.prisma.pledge.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await this.prisma.reminderTask.deleteMany({
      where: { sourcePledgeId: id },
    });

    await this.auditService.logPledgeDelete(
      user.id,
      id,
      { pledgeType: existing.pledgeType, amount: existing.amount },
      ipAddress,
      userAgent,
    );

    this.logger.log(`Pledge ${id} deleted by admin`);

    return { success: true };
  }

  async getDonorPledgeSuggestions(donorId: string) {
    const pendingPledges = await this.prisma.pledge.findMany({
      where: {
        donorId,
        isDeleted: false,
        status: { in: [PledgeStatus.PENDING, PledgeStatus.POSTPONED] },
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

  async sendPledgeReminderEmail(user: UserContext, id: string) {
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
      throw new NotFoundException('Pledge not found');
    }

    const donorEmail = pledge.donor.personalEmail || pledge.donor.officialEmail;
    if (!donorEmail) {
      throw new BadRequestException('Donor has no email address on file');
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
      type: 'FOLLOW_UP' as any,
    });

    this.logger.log(`Pledge reminder email queued for pledge ${id} to ${donorEmail}`);

    return { success: true, message: `Reminder email queued to ${donorEmail}` };
  }

  async buildWhatsAppReminderText(pledge: any): Promise<string> {
    const donorName = [pledge.donor?.firstName, pledge.donor?.lastName].filter(Boolean).join(' ') || 'Valued Donor';
    const pledgeLabel = pledgeTypeLabels[pledge.pledgeType as PledgeType] || pledge.pledgeType;
    const amountStr = pledge.amount ? `Rs. ${(typeof pledge.amount === 'object' ? pledge.amount.toNumber() : pledge.amount).toLocaleString('en-IN')}` : '';
    const dueDate = new Date(pledge.expectedFulfillmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const org = await this.orgProfileService.getProfile();
    return `Dear ${donorName},\n\nThis is a gentle reminder about your pledge to ${org.name}.\n\nPledge: ${pledgeLabel}${amountStr ? `\nAmount: ${amountStr}` : ''}${pledge.quantity ? `\nQuantity: ${pledge.quantity}` : ''}\nExpected Date: ${dueDate}\n\nYour continued support helps us serve those in need. Thank you for your generosity!\n\nIf you have already fulfilled this pledge, please ignore this message.\n\nWarm regards,\n${org.name}`;
  }

  async logWhatsAppReminder(user: UserContext, id: string) {
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
      throw new NotFoundException('Pledge not found');
    }

    const phone = pledge.donor.whatsappPhone || pledge.donor.primaryPhone;
    if (!phone) {
      throw new BadRequestException('Donor has no phone number on file');
    }

    const pledgeLabel = pledgeTypeLabels[pledge.pledgeType];
    const amountStr = pledge.amount ? `Rs. ${pledge.amount.toNumber().toLocaleString('en-IN')}` : '';

    await this.communicationLogService.logWhatsApp({
      donorId: pledge.donor.id,
      phoneNumber: phone,
      messagePreview: `Pledge reminder: ${pledgeLabel}${amountStr ? ` - ${amountStr}` : ''}`,
      sentById: user.id,
      type: 'FOLLOW_UP' as any,
    });

    return { success: true, message: 'WhatsApp reminder logged' };
  }

  private async generatePledgeReminders(pledgeId: string, donorId: string, dueDate: Date, pledgeType: PledgeType) {
    const offsets = [7, 2, 0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const offset of offsets) {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - offset);
      reminderDate.setHours(0, 0, 0, 0);

      if (reminderDate < today) continue;

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
      } catch (error) {
        this.logger.warn(`Failed to create pledge reminder: ${error.message}`);
      }
    }
  }
}
