import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ReceiptService, isInKindDonation } from "../receipt/receipt.service";
import { EmailService } from "../email/email.service";
import { CommunicationLogService } from "../communication-log/communication-log.service";
import { OrganizationProfileService } from "../organization-profile/organization-profile.service";
import { Role, CommunicationType, CommunicationStatus, CommunicationChannel } from "@prisma/client";
import { maskDonorInDonation } from "../common/utils/masking.util";
import { CommunicationsService } from "../communications/communications.service";
import { normalizeToE164 } from "../common/phone-utils";
import { NotificationService } from "../notifications/notification.service";

export interface DonationQueryOptions {
  page?: number;
  limit?: number;
  donorId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  donationType?: string;
  donationHomeType?: string;
}

export interface UserContext {
  id: string;
  role: Role;
  email: string;
}

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
    private communicationsService: CommunicationsService,
    private notificationService: NotificationService,
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
      sortBy = "donationDate",
      sortOrder = "desc",
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

    if (donationType && donationType !== "all") {
      where.donationType = donationType;
    }

    if (donationHomeType && donationHomeType !== "all") {
      where.donationHomeType = donationHomeType;
    }

    if (search) {
      where.donor = {
        ...where.donor,
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { donorCode: { contains: search, mode: "insensitive" } },
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
        throw new ForbiddenException("You do not have access to this donation");
      }
      throw new NotFoundException("Donation not found");
    }

    return this.shouldMaskDonorData(user)
      ? maskDonorInDonation(donation)
      : donation;
  }

  async create(
    user: UserContext,
    data: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (user.role === Role.TELECALLER) {
      const donor = await this.prisma.donor.findFirst({
        where: { id: data.donorId, isDeleted: false },
        select: { id: true, assignedToUserId: true },
      });
      if (!donor || donor.assignedToUserId !== user.id) {
        throw new ForbiddenException(
          "You can only create donations for donors assigned to you",
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
      orderBy: { receiptNumber: "desc" },
      select: { receiptNumber: true },
    });

    let nextReceiptNum = 1;
    if (lastReceipt?.receiptNumber) {
      const match = lastReceipt.receiptNumber.match(/-(\d+)$/);
      if (match) nextReceiptNum = parseInt(match[1], 10) + 1;
    }

    const receiptNumber = `AKF-REC-${currentYear}-${nextReceiptNum
      .toString()
      .padStart(4, "0")}`;

    const validHomeTypes = ["GIRLS_HOME", "BLIND_BOYS_HOME", "OLD_AGE_HOME", "GENERAL"];
    if (data.donationHomeType && !validHomeTypes.includes(data.donationHomeType)) {
      if (data.donationHomeType === "NONE" || data.donationHomeType === "none" || data.donationHomeType === "") {
        data.donationHomeType = null;
      } else {
        throw new BadRequestException(`Invalid donationHomeType: ${data.donationHomeType}. Valid values: ${validHomeTypes.join(", ")}`);
      }
    }

    const { emailType: _emailType, ...donationData } = data;

    const donation = await this.prisma.donation.create({
      data: {
        ...donationData,
        donationDate: new Date(donationData.donationDate),
        donationHomeType: donationData.donationHomeType || null,
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
      donationMode: donation.donationMode || undefined,
      donationDate: donation.donationDate,
      emailType: (data.emailType as 'GENERAL' | 'TAX' | 'KIND') || 'GENERAL',
      userId: user.id,
    };

    if (orgProfile.enableDonationEmail) {
      communicationResults.emailStatus = "queued";
      this.notificationService.sendDonationEmail(notificationParams)
        .then((result) => {
          this.logger.log(`Donation email for ${donation.id}: status=${result.status}`);
        })
        .catch((err) => {
          this.logger.error(`Donation email error for ${donation.id}: ${err?.message}`);
        });
    }

    if (orgProfile.enableDonationWhatsApp !== false) {
      try {
        const waResult = await this.notificationService.sendDonationWhatsApp(notificationParams);
        communicationResults.whatsAppStatus = waResult.status;
        communicationResults.whatsAppMessageId = waResult.messageId;
        this.logger.log(`Donation WhatsApp for ${donation.id}: status=${waResult.status}`);
      } catch (err: any) {
        communicationResults.whatsAppStatus = "failed";
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
      const donation = await this.prisma.donation.findUnique({
        where: { id: donationId },
      });
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
        [donor.firstName, donor.lastName].filter(Boolean).join(" ") ||
        "Valued Donor";

      const kindDon = isInKindDonation(donation.donationType || '');
      let pdfBuffer: Buffer;
      if (kindDon) {
        pdfBuffer = await this.receiptService.generateAcknowledgementPDF({
          ackNumber: receiptNumber,
          donationDate: donation.donationDate,
          donorName,
          donationType: donation.donationType || 'KIND',
          currency: donation.currency,
        });
      } else {
        pdfBuffer = await this.receiptService.generateReceiptPDF({
          receiptNumber,
          donationDate: donation.donationDate,
          donorName,
          donationAmount: donation.donationAmount.toNumber(),
          currency: donation.currency,
          paymentMode: donation.donationMode,
          donationType: donation.donationType || 'CASH',
          receiptType: 'GENERAL',
        });
      }

      const result = await this.emailService.sendDonationReceipt(
        donorEmail,
        donorName,
        receiptNumber,
        pdfBuffer,
        { emailType: kindDon ? 'KIND' : 'GENERAL' },
      );

      await this.communicationLogService.logEmail({
        donorId,
        donationId,
        toEmail: donorEmail,
        subject: `Donation Receipt - ${receiptNumber}`,
        messagePreview: `Receipt email sent for ${receiptNumber}`,
        status: result.success ? "SENT" : "FAILED",
        errorMessage: result.error,
        sentById: userId,
        type: CommunicationType.RECEIPT,
      });
    } catch (error: any) {
      this.logger.error(`Email error: ${error?.message || error}`);
    }
  }

  /**
   * ✅ Missing in your original code, but you were calling it.
   * This sends a WhatsApp thank-you + logs it.
   */
  async update(
    user: UserContext,
    id: string,
    data: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.donation.findFirst({
      where: { id, isDeleted: false },
      include: { donor: { select: { assignedToUserId: true } } },
    });

    if (!existing) throw new NotFoundException("Donation not found");

    if (
      user.role === Role.TELECALLER &&
      existing.donor?.assignedToUserId !== user.id
    ) {
      throw new ForbiddenException(
        "You do not have permission to update this donation",
      );
    }

    const updateData = { ...data };
    if (data.donationDate)
      updateData.donationDate = new Date(data.donationDate);

    const validHomeTypes = ["GIRLS_HOME", "BLIND_BOYS_HOME", "OLD_AGE_HOME", "GENERAL"];
    if (updateData.donationHomeType !== undefined) {
      if (!updateData.donationHomeType || updateData.donationHomeType === "NONE" || updateData.donationHomeType === "none") {
        updateData.donationHomeType = null;
      } else if (!validHomeTypes.includes(updateData.donationHomeType)) {
        throw new BadRequestException(`Invalid donationHomeType: ${updateData.donationHomeType}. Valid values: ${validHomeTypes.join(", ")}`);
      }
    }

    const updated = await this.prisma.donation.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.logDonationUpdate(
      user.id,
      id,
      {
        receiptNumber: existing.receiptNumber,
        amount: existing.donationAmount,
      },
      { ...data },
      ipAddress,
      userAgent,
    );

    return updated;
  }

  async softDelete(
    user: UserContext,
    id: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException("Only administrators can delete donations");
    }

    const existing = await this.prisma.donation.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) throw new NotFoundException("Donation not found");

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

    if (!donation) throw new NotFoundException("Donation not found");

    await this.auditService.logReceiptRegenerate(
      user.id,
      id,
      { receiptNumber: donation.receiptNumber },
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: "Receipt regeneration logged",
      receiptNumber: donation.receiptNumber,
    };
  }

  async resendReceipt(user: UserContext, id: string, emailType?: 'GENERAL' | 'TAX' | 'KIND') {
    const donation = await this.prisma.donation.findFirst({
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
            address: true,
            city: true,
            state: true,
            pincode: true,
            pan: true,
          },
        },
      },
    });

    if (!donation) throw new NotFoundException("Donation not found");

    const donorEmail =
      donation.donor.personalEmail || donation.donor.officialEmail;
    if (!donorEmail) {
      throw new BadRequestException(
        "Donor does not have an email address on file",
      );
    }

    const donorName =
      `${donation.donor.firstName} ${donation.donor.lastName || ""}`.trim();
    const addressParts = [
      donation.donor.address,
      donation.donor.city,
      donation.donor.state,
      donation.donor.pincode,
    ].filter(Boolean);
    const donorAddress = addressParts.length
      ? addressParts.join(", ")
      : undefined;

    const kindDonation = isInKindDonation(donation.donationType || '');
    const effectiveEmailType = kindDonation ? 'KIND' : (emailType || 'GENERAL');

    let pdfBuffer: Buffer;
    if (kindDonation) {
      pdfBuffer = await this.receiptService.generateAcknowledgementPDF({
        ackNumber: donation.receiptNumber || 'N/A',
        donationDate: donation.donationDate,
        donorName,
        donationType: donation.donationType || 'KIND',
        estimatedValue: donation.donationAmount.toNumber() || undefined,
        currency: donation.currency,
        designatedHome: donation.donationHomeType || null,
        remarks: donation.remarks || undefined,
        donorEmail,
      });
    } else {
      pdfBuffer = await this.receiptService.generateReceiptPDF({
        receiptNumber: donation.receiptNumber || 'N/A',
        donationDate: donation.donationDate,
        donorName,
        donationAmount: donation.donationAmount.toNumber(),
        currency: donation.currency,
        paymentMode: donation.donationMode,
        donationType: donation.donationType || 'CASH',
        remarks: donation.remarks || undefined,
        donorAddress,
        donorEmail,
        donorPAN: donation.donor.pan || undefined,
        transactionRef: donation.transactionId || undefined,
        designatedHome: donation.donationHomeType || null,
        receiptType: effectiveEmailType === 'TAX' ? 'TAX' : 'GENERAL',
      });
    }

    const emailResult = await this.emailService.sendDonationReceipt(
      donorEmail,
      donorName,
      donation.receiptNumber || "N/A",
      pdfBuffer,
      {
        emailType: effectiveEmailType,
        donationAmount: donation.donationAmount.toNumber(),
        currency: donation.currency,
        donationDate: donation.donationDate,
        donationMode: donation.donationMode || undefined,
        donationType: donation.donationType || undefined,
        donorPAN: donation.donor.pan || undefined,
      },
    );

    await this.communicationLogService.logEmail({
      donorId: donation.donorId,
      donationId: donation.id,
      toEmail: donorEmail,
      subject: `Donation Receipt - ${(await this.orgProfileService.getProfile()).name} (${donation.receiptNumber})`,
      messagePreview: `Receipt re-sent by ${user.role}: ${donation.receiptNumber}`,
      status: emailResult.success ? "SENT" : "FAILED",
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

  async getStatsByHome(user: UserContext) {
    const accessFilter = this.getDonorAccessFilter(user);

    const donations = await this.prisma.donation.findMany({
      where: { isDeleted: false, ...accessFilter },
      select: {
        donationHomeType: true,
        donationType: true,
        donationAmount: true,
        currency: true,
      },
    });

    const homeStats: Record<
      string,
      { cashTotal: number; inKindCount: number; totalCount: number }
    > = {
      GIRLS_HOME: { cashTotal: 0, inKindCount: 0, totalCount: 0 },
      BLIND_BOYS_HOME: { cashTotal: 0, inKindCount: 0, totalCount: 0 },
      OLD_AGE_HOME: { cashTotal: 0, inKindCount: 0, totalCount: 0 },
      GENERAL: { cashTotal: 0, inKindCount: 0, totalCount: 0 },
    };

    let totalCash = 0;
    let totalInKind = 0;

    for (const donation of donations) {
      const homeType = donation.donationHomeType || "GENERAL";
      const amount = Number(donation.donationAmount) || 0;
      const isCash = donation.donationType === "CASH";

      if (homeStats[homeType]) {
        homeStats[homeType].totalCount++;
        if (isCash) {
          homeStats[homeType].cashTotal += amount;
          totalCash += amount;
        } else {
          homeStats[homeType].inKindCount++;
          totalInKind++;
        }
      }
    }

    return {
      byHome: [
        {
          homeType: "GIRLS_HOME",
          label: "Girls Home",
          ...homeStats.GIRLS_HOME,
        },
        {
          homeType: "BLIND_BOYS_HOME",
          label: "Blind Boys Home",
          ...homeStats.BLIND_BOYS_HOME,
        },
        {
          homeType: "OLD_AGE_HOME",
          label: "Old Age Home",
          ...homeStats.OLD_AGE_HOME,
        },
        { homeType: "GENERAL", label: "General", ...homeStats.GENERAL },
      ],
      totals: {
        cashTotal: totalCash,
        inKindCount: totalInKind,
        totalDonations: donations.length,
      },
    };
  }

  async exportDonations(
    user: UserContext,
    filters: any = {},
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        "Only administrators can export donation data",
      );
    }

    const where: any = { isDeleted: false };

    if (filters.startDate || filters.endDate) {
      where.donationDate = {};
      if (filters.startDate)
        where.donationDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.donationDate.lte = new Date(filters.endDate);
    }

    if (filters.donorId) where.donorId = filters.donorId;

    const donations = await this.prisma.donation.findMany({
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
        home: { select: { id: true, fullName: true } },
        campaign: { select: { id: true, name: true } },
      },
      orderBy: { donationDate: "desc" },
    });

    await this.auditService.logDataExport(
      user.id,
      "Donations",
      filters,
      donations.length,
      ipAddress,
      userAgent,
    );

    return donations;
  }

  async exportToExcel(
    user: UserContext,
    filters: any = {},
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Buffer> {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.default.Workbook();
    const worksheet = workbook.addWorksheet("Donations");

    const where: any = { isDeleted: false };

    if (filters.startDate || filters.endDate) {
      where.donationDate = {};
      if (filters.startDate)
        where.donationDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.donationDate.lte = new Date(filters.endDate);
    }

    if (filters.donationType && filters.donationType !== "all") {
      where.donationType = filters.donationType;
    }

    if (filters.donationHomeType && filters.donationHomeType !== "all") {
      where.donationHomeType = filters.donationHomeType;
    }

    const donations = await this.prisma.donation.findMany({
      where,
      include: {
        donor: {
          select: {
            donorCode: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
            personalEmail: true,
          },
        },
      },
      orderBy: { donationDate: "desc" },
    });

    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Receipt No", key: "receiptNumber", width: 20 },
      { header: "Donor Name", key: "donorName", width: 25 },
      { header: "Donor Code", key: "donorCode", width: 15 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Donation Type", key: "donationType", width: 15 },
      { header: "Purpose", key: "purpose", width: 18 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Amount/Value", key: "amount", width: 15 },
      { header: "Payment Mode", key: "paymentMode", width: 15 },
      { header: "Designated Home", key: "home", width: 20 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    for (const donation of donations) {
      const donorName = [donation.donor.firstName, donation.donor.lastName]
        .filter(Boolean)
        .join(" ");

      const homeLabel = this.getHomeTypeLabel(
        donation.donationHomeType || undefined,
      );

      worksheet.addRow({
        date: new Date(donation.donationDate).toLocaleDateString("en-IN"),
        receiptNumber: donation.receiptNumber || "-",
        donorName,
        donorCode: donation.donor.donorCode,
        phone: donation.donor.primaryPhone || "-",
        donationType: donation.donationType.replace(/_/g, " "),
        purpose: donation.donationPurpose?.replace(/_/g, " ") || "-",
        quantity: donation.quantity ? donation.quantity.toString() : "-",
        unit: donation.unit || "-",
        amount: Number(donation.donationAmount) || 0,
        paymentMode: donation.donationMode?.replace(/_/g, " ") || "-",
        home: homeLabel,
        notes: donation.remarks || "-",
      });
    }

    await this.auditService.logDataExport(
      user.id,
      "DonationsExcel",
      filters,
      donations.length,
      ipAddress,
      userAgent,
    );

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private getHomeTypeLabel(homeType?: string): string {
    switch (homeType) {
      case "GIRLS_HOME":
        return "Girls Home";
      case "BLIND_BOYS_HOME":
        return "Blind Boys Home";
      case "OLD_AGE_HOME":
        return "Old Age Home";
      case "GENERAL":
        return "General";
      default:
        return "-";
    }
  }

  async getReceiptPdf(
    user: UserContext,
    donationId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const donation = await this.prisma.donation.findFirst({
      where: { id: donationId, isDeleted: false },
      include: {
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
            personalEmail: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            pan: true,
          },
        },
      },
    });

    if (!donation) throw new NotFoundException("Donation not found");
    if (!donation.receiptNumber)
      throw new BadRequestException("No receipt generated for this donation");

    const remarks =
      donation.donationType !== "CASH" && donation.quantity
        ? `${donation.donationType.replace(/_/g, " ")}: ${donation.quantity}${donation.unit ? " " + donation.unit : ""}${
            donation.itemDescription ? " - " + donation.itemDescription : ""
          }`
        : donation.remarks || undefined;

    const pdfBuffer = await this.receiptService.generateReceiptPDF({
      receiptNumber: donation.receiptNumber,
      donorName: [donation.donor.firstName, donation.donor.lastName]
        .filter(Boolean)
        .join(" "),
      donorAddress: [
        donation.donor.address,
        donation.donor.city,
        donation.donor.state,
        donation.donor.pincode,
      ]
        .filter(Boolean)
        .join(", "),
      donorPAN: donation.donor.pan || "",
      donationDate: donation.donationDate,
      donationAmount: Number(donation.donationAmount),
      currency: donation.currency,
      paymentMode: donation.donationMode || "N/A",
      transactionRef: donation.transactionId || "",
      donationType: donation.donationType,
      remarks,
    });

    return {
      buffer: pdfBuffer,
      filename: `receipt_${donation.receiptNumber}.pdf`,
    };
  }
}
