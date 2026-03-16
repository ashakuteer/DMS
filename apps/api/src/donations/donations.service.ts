import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReceiptService } from '../receipt/receipt.service';
import { EmailService } from '../email/email.service';
import { CommunicationLogService } from '../communication-log/communication-log.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { Role, CommunicationType } from '@prisma/client';
import { maskDonorInDonation } from '../common/utils/masking.util';
import { NotificationService } from '../notifications/notification.service';
import { DonationQueryOptions, UserContext } from './donations.types';
import { DonationsExportService } from './donations.export.service';

export { DonationQueryOptions, UserContext };

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private receiptService: ReceiptService,
    private emailService: EmailService,
    private communicationLogService: CommunicationLogService,
    private orgProfileService: OrganizationProfileService,
    private notificationService: NotificationService,
    private exportService: DonationsExportService,
  ) {}

  private getDonorAccessFilter(user: UserContext): Record<string, any> {
    if (user.role === Role.TELECALLER) {
      return { donor: { assignedToUserId: user.id } };
    }
    return {};
  }

  private shouldMaskDonorData(user: UserContext): boolean {
    return user.role !== Role.ADMIN;
  }

  async findAll(user: UserContext, options: DonationQueryOptions = {}) {
    const {
      page = 1,
      limit = 20,
      donorId,
      startDate,
      endDate,
      sortBy = 'donationDate',
      sortOrder = 'desc',
      search,
      donationType,
      donationHomeType,
    } = options;

    const accessFilter = this.getDonorAccessFilter(user);

    const where: any = {
      isDeleted: false,
      ...accessFilter,
    };

    if (donorId) where.donorId = donorId;

    if (donationType && donationType !== 'all') {
      where.donationType = donationType;
    }

    if (donationHomeType && donationHomeType !== 'all') {
      where.donationHomeType = donationHomeType;
    }

    if (search) {
      where.donor = {
        ...where.donor,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { donorCode: { contains: search, mode: 'insensitive' } },
          { primaryPhone: { contains: search } },
        ],
      };
    }

    if (startDate || endDate) {
      where.donationDate = {};
      if (startDate) where.donationDate.gte = new Date(startDate);
      if (endDate) where.donationDate.lte = new Date(endDate);
    }

    const [donations, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        include: {
          donor: {
            select: {
              id: true,
              donorCode: true,
              firstName: true,
              lastName: true,
              primaryPhone: true,
              personalEmail: true,
              city: true,
            },
          },
          createdBy: { select: { id: true, name: true } },
          home: { select: { id: true, fullName: true } },
          campaign: { select: { id: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.donation.count({ where }),
    ]);

    const maskedDonations = this.shouldMaskDonorData(user)
      ? donations.map((donation) => maskDonorInDonation(donation))
      : donations;

    return {
      items: maskedDonations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(user: UserContext, id: string) {
    const accessFilter = this.getDonorAccessFilter(user);

    const donation = await this.prisma.donation.findFirst({
      where: {
        id,
        isDeleted: false,
        ...accessFilter,
      },
      include: {
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
            personalEmail: true,
            officialEmail: true,
            whatsappPhone: true,
            city: true,
            state: true,
          },
        },
        createdBy: { select: { id: true, name: true } },
        home: true,
        campaign: { select: { id: true, name: true } },
      },
    });

    if (!donation) {
      if (user.role === Role.TELECALLER) {
        throw new ForbiddenException('You do not have access to this donation');
      }
      throw new NotFoundException('Donation not found');
    }

    return this.shouldMaskDonorData(user) ? maskDonorInDonation(donation) : donation;
  }

  async create(user: UserContext, data: any, ipAddress?: string, userAgent?: string) {
    if (user.role === Role.TELECALLER) {
      const donor = await this.prisma.donor.findFirst({
        where: { id: data.donorId, isDeleted: false },
        select: { id: true, assignedToUserId: true },
      });
      if (!donor || donor.assignedToUserId !== user.id) {
        throw new ForbiddenException(
          'You can only create donations for donors assigned to you',
        );
      }
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const financialYear =
      currentMonth >= 4
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
      if (match) nextReceiptNum = parseInt(match[1], 10) + 1;
    }

    const receiptNumber = `AKF-REC-${currentYear}-${nextReceiptNum.toString().padStart(4, '0')}`;

    const validHomeTypes = ['GIRLS_HOME', 'BLIND_BOYS_HOME', 'OLD_AGE_HOME', 'GENERAL'];
    if (data.donationHomeType && !validHomeTypes.includes(data.donationHomeType)) {
      if (
        data.donationHomeType === 'NONE' ||
        data.donationHomeType === 'none' ||
        data.donationHomeType === ''
      ) {
        data.donationHomeType = null;
      } else {
        throw new BadRequestException(
          `Invalid donationHomeType: ${data.donationHomeType}. Valid values: ${validHomeTypes.join(', ')}`,
        );
      }
    }

    const donation = await this.prisma.donation.create({
      data: {
        ...data,
        donationDate: new Date(data.donationDate),
        donationHomeType: data.donationHomeType || null,
        receiptNumber,
        financialYear,
        createdById: user.id,
      },
    });

    await this.auditService.logDonationCreate(
      user.id,
      donation.id,
      { receiptNumber, donorId: data.donorId, amount: data.donationAmount },
      ipAddress,
      userAgent,
    );

    const communicationResults: {
      emailStatus?: string;
      whatsAppStatus?: string;
      whatsAppMessageId?: string;
    } = {};

    const orgProfile = await this.orgProfileService.getProfile();

    const notificationParams = {
      donationId: donation.id,
      donorId: data.donorId,
      receiptNumber,
      donationAmount: Number(donation.donationAmount),
      currency: donation.currency,
      donationType: donation.donationType || 'General',
      donationDate: donation.donationDate,
      userId: user.id,
    };

    if (orgProfile.enableDonationEmail) {
      communicationResults.emailStatus = 'queued';
      this.notificationService
        .sendDonationEmail(notificationParams)
        .then((result) => {
          this.logger.log(`Donation email for ${donation.id}: status=${result.status}`);
        })
        .catch((err) => {
          this.logger.error(`Donation email error for ${donation.id}: ${err?.message}`);
        });
    }

    if (orgProfile.enableDonationWhatsApp !== false) {
      try {
        const waResult =
          await this.notificationService.sendDonationWhatsApp(notificationParams);
        communicationResults.whatsAppStatus = waResult.status;
        communicationResults.whatsAppMessageId = waResult.messageId;
        this.logger.log(`Donation WhatsApp for ${donation.id}: status=${waResult.status}`);
      } catch (err: any) {
        communicationResults.whatsAppStatus = 'failed';
        this.logger.error(`Donation WhatsApp error for ${donation.id}: ${err?.message}`);
      }
    }

    return { ...donation, communicationResults };
  }

  private async sendDonationReceiptEmail(
    donationId: string,
    donorId: string,
    receiptNumber: string,
    userId?: string,
  ): Promise<void> {
    try {
      const donation = await this.prisma.donation.findUnique({ where: { id: donationId } });
      if (!donation) {
        this.logger.warn(`Donation ${donationId} not found`);
        return;
      }

      const donor = await this.prisma.donor.findUnique({
        where: { id: donorId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          personalEmail: true,
          officialEmail: true,
        },
      });
      if (!donor) return;

      const donorEmail = donor.personalEmail || donor.officialEmail;
      if (!donorEmail) return;

      const donorName =
        [donor.firstName, donor.lastName].filter(Boolean).join(' ') || 'Valued Donor';

      const pdfBuffer = await this.receiptService.generateReceiptPDF({
        receiptNumber,
        donationDate: donation.donationDate,
        donorName,
        donationAmount: donation.donationAmount.toNumber(),
        currency: donation.currency,
        paymentMode: donation.donationMode,
        donationType: donation.donationType,
      });

      const result = await this.emailService.sendDonationReceipt(
        donorEmail,
        donorName,
        receiptNumber,
        pdfBuffer,
      );

      await this.communicationLogService.logEmail({
        donorId,
        donationId,
        toEmail: donorEmail,
        subject: `Donation Receipt - ${receiptNumber}`,
        messagePreview: `Receipt email sent for ${receiptNumber}`,
        status: result.success ? 'SENT' : 'FAILED',
        errorMessage: result.error,
        sentById: userId,
        type: CommunicationType.RECEIPT,
      });
    } catch (error: any) {
      this.logger.error(`Email error: ${error?.message || error}`);
    }
  }

  async update(user: UserContext, id: string, data: any, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.donation.findFirst({
      where: { id, isDeleted: false },
      include: { donor: { select: { assignedToUserId: true } } },
    });

    if (!existing) throw new NotFoundException('Donation not found');

    if (user.role === Role.TELECALLER && existing.donor?.assignedToUserId !== user.id) {
      throw new ForbiddenException('You do not have permission to update this donation');
    }

    const updateData = { ...data };
    if (data.donationDate) updateData.donationDate = new Date(data.donationDate);

    const validHomeTypes = ['GIRLS_HOME', 'BLIND_BOYS_HOME', 'OLD_AGE_HOME', 'GENERAL'];
    if (updateData.donationHomeType !== undefined) {
      if (
        !updateData.donationHomeType ||
        updateData.donationHomeType === 'NONE' ||
        updateData.donationHomeType === 'none'
      ) {
        updateData.donationHomeType = null;
      } else if (!validHomeTypes.includes(updateData.donationHomeType)) {
        throw new BadRequestException(
          `Invalid donationHomeType: ${updateData.donationHomeType}. Valid values: ${validHomeTypes.join(', ')}`,
        );
      }
    }

    const updated = await this.prisma.donation.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.logDonationUpdate(
      user.id,
      id,
      { receiptNumber: existing.receiptNumber, amount: existing.donationAmount },
      { ...data },
      ipAddress,
      userAgent,
    );

    return updated;
  }

  async softDelete(user: UserContext, id: string, ipAddress?: string, userAgent?: string) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can delete donations');
    }

    const existing = await this.prisma.donation.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) throw new NotFoundException('Donation not found');

    const deleted = await this.prisma.donation.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await this.auditService.logDonationDelete(
      user.id,
      id,
      { receiptNumber: existing.receiptNumber },
      ipAddress,
      userAgent,
    );

    return deleted;
  }

  async regenerateReceipt(
    user: UserContext,
    id: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const donation = await this.prisma.donation.findFirst({
      where: { id, isDeleted: false },
    });

    if (!donation) throw new NotFoundException('Donation not found');

    await this.auditService.logReceiptRegenerate(
      user.id,
      id,
      { receiptNumber: donation.receiptNumber },
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: 'Receipt regeneration logged',
      receiptNumber: donation.receiptNumber,
    };
  }

  async resendReceipt(user: UserContext, id: string) {
    const donation = await this.prisma.donation.findFirst({
      where: { id, isDeleted: false },
      include: {
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
            personalEmail: true,
            officialEmail: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            pan: true,
          },
        },
      },
    });

    if (!donation) throw new NotFoundException('Donation not found');

    const donorEmail = donation.donor.personalEmail || donation.donor.officialEmail;
    if (!donorEmail) {
      throw new BadRequestException('Donor does not have an email address on file');
    }

    const donorName = `${donation.donor.firstName} ${donation.donor.lastName || ''}`.trim();
    const addressParts = [
      donation.donor.address,
      donation.donor.city,
      donation.donor.state,
      donation.donor.pincode,
    ].filter(Boolean);
    const donorAddress = addressParts.length ? addressParts.join(', ') : undefined;

    const pdfBuffer = await this.receiptService.generateReceiptPDF({
      receiptNumber: donation.receiptNumber || 'N/A',
      donationDate: donation.donationDate,
      donorName,
      donationAmount: donation.donationAmount.toNumber(),
      currency: donation.currency,
      paymentMode: donation.donationMode,
      donationType: donation.donationType,
      remarks: donation.remarks || undefined,
      donorAddress,
      donorEmail,
      donorPAN: donation.donor.pan || undefined,
      transactionRef: donation.transactionId || undefined,
    });

    const emailResult = await this.emailService.sendDonationReceipt(
      donorEmail,
      donorName,
      donation.receiptNumber || 'N/A',
      pdfBuffer,
    );

    await this.communicationLogService.logEmail({
      donorId: donation.donorId,
      donationId: donation.id,
      toEmail: donorEmail,
      subject: `Donation Receipt - ${(await this.orgProfileService.getProfile()).name} (${donation.receiptNumber})`,
      messagePreview: `Receipt re-sent by ${user.role}: ${donation.receiptNumber}`,
      status: emailResult.success ? 'SENT' : 'FAILED',
      errorMessage: emailResult.error,
      sentById: user.id,
      type: CommunicationType.RECEIPT,
    });

    this.logger.log(
      `Receipt ${donation.receiptNumber} re-sent to ${donorEmail} by user ${user.id}`,
    );

    return {
      success: emailResult.success,
      message: emailResult.success
        ? `Receipt ${donation.receiptNumber} has been re-sent to ${donorEmail}`
        : `Failed to re-send receipt: ${emailResult.error}`,
      receiptNumber: donation.receiptNumber,
      recipientEmail: donorEmail,
    };
  }

  async exportDonations(user: UserContext, filters: any = {}, ipAddress?: string, userAgent?: string) {
    return this.exportService.exportDonations(user, filters, ipAddress, userAgent);
  }

  async exportToExcel(user: UserContext, filters: any = {}, ipAddress?: string, userAgent?: string): Promise<Buffer> {
    return this.exportService.exportToExcel(user, filters, ipAddress, userAgent);
  }

  async getReceiptPdf(user: UserContext, donationId: string): Promise<{ buffer: Buffer; filename: string }> {
    return this.exportService.getReceiptPdf(user, donationId);
  }

  async getStatsByHome(user: UserContext) {
    return this.exportService.getStatsByHome(user);
  }
}
