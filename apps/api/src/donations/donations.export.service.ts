import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReceiptService } from '../receipt/receipt.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { Role } from '@prisma/client';
import { UserContext } from './donations.types';
import { getHomeTypeLabel } from './donations.helpers';

@Injectable()
export class DonationsExportService {
  private readonly logger = new Logger(DonationsExportService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private receiptService: ReceiptService,
    private orgProfileService: OrganizationProfileService,
  ) {}

  async exportDonations(
    user: UserContext,
    filters: any = {},
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can export donation data');
    }

    const where: any = { isDeleted: false };

    if (filters.startDate || filters.endDate) {
      where.donationDate = {};
      if (filters.startDate) where.donationDate.gte = new Date(filters.startDate);
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
      orderBy: { donationDate: 'desc' },
    });

    await this.auditService.logDataExport(
      user.id,
      'Donations',
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
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.default.Workbook();
    const worksheet = workbook.addWorksheet('Donations');

    const where: any = { isDeleted: false };

    if (filters.startDate || filters.endDate) {
      where.donationDate = {};
      if (filters.startDate) where.donationDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.donationDate.lte = new Date(filters.endDate);
    }

    if (filters.donationType && filters.donationType !== 'all') {
      where.donationType = filters.donationType;
    }

    if (filters.donationHomeType && filters.donationHomeType !== 'all') {
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
      orderBy: { donationDate: 'desc' },
    });

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Receipt No', key: 'receiptNumber', width: 20 },
      { header: 'Donor Name', key: 'donorName', width: 25 },
      { header: 'Donor Code', key: 'donorCode', width: 15 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Donation Type', key: 'donationType', width: 15 },
      { header: 'Purpose', key: 'purpose', width: 18 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Amount/Value', key: 'amount', width: 15 },
      { header: 'Payment Mode', key: 'paymentMode', width: 15 },
      { header: 'Designated Home', key: 'home', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    for (const donation of donations) {
      const donorName = [donation.donor.firstName, donation.donor.lastName]
        .filter(Boolean)
        .join(' ');

      const homeLabel = getHomeTypeLabel(donation.donationHomeType || undefined);

      worksheet.addRow({
        date: new Date(donation.donationDate).toLocaleDateString('en-IN'),
        receiptNumber: donation.receiptNumber || '-',
        donorName,
        donorCode: donation.donor.donorCode,
        phone: donation.donor.primaryPhone || '-',
        donationType: donation.donationType.replace(/_/g, ' '),
        purpose: donation.donationPurpose?.replace(/_/g, ' ') || '-',
        quantity: donation.quantity ? donation.quantity.toString() : '-',
        unit: donation.unit || '-',
        amount: Number(donation.donationAmount) || 0,
        paymentMode: donation.donationMode?.replace(/_/g, ' ') || '-',
        home: homeLabel,
        notes: donation.remarks || '-',
      });
    }

    await this.auditService.logDataExport(
      user.id,
      'DonationsExcel',
      filters,
      donations.length,
      ipAddress,
      userAgent,
    );

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
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

    if (!donation) throw new NotFoundException('Donation not found');
    if (!donation.receiptNumber)
      throw new BadRequestException('No receipt generated for this donation');

    const remarks =
      donation.donationType !== 'CASH' && donation.quantity
        ? `${donation.donationType.replace(/_/g, ' ')}: ${donation.quantity}${donation.unit ? ' ' + donation.unit : ''}${
            donation.itemDescription ? ' - ' + donation.itemDescription : ''
          }`
        : donation.remarks || undefined;

    const pdfBuffer = await this.receiptService.generateReceiptPDF({
      receiptNumber: donation.receiptNumber,
      donorName: [donation.donor.firstName, donation.donor.lastName].filter(Boolean).join(' '),
      donorAddress: [
        donation.donor.address,
        donation.donor.city,
        donation.donor.state,
        donation.donor.pincode,
      ]
        .filter(Boolean)
        .join(', '),
      donorPAN: donation.donor.pan || '',
      donationDate: donation.donationDate,
      donationAmount: Number(donation.donationAmount),
      currency: donation.currency,
      paymentMode: donation.donationMode || 'N/A',
      transactionRef: donation.transactionId || '',
      donationType: donation.donationType,
      remarks,
    });

    return {
      buffer: pdfBuffer,
      filename: `receipt_${donation.receiptNumber}.pdf`,
    };
  }

  async getStatsByHome(user: UserContext) {
    const accessFilter =
      user.role === Role.TELECALLER ? { donor: { assignedToUserId: user.id } } : {};

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
      const homeType = donation.donationHomeType || 'GENERAL';
      const amount = Number(donation.donationAmount) || 0;
      const isCash = donation.donationType === 'CASH';

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
        { homeType: 'GIRLS_HOME', label: 'Girls Home', ...homeStats.GIRLS_HOME },
        { homeType: 'BLIND_BOYS_HOME', label: 'Blind Boys Home', ...homeStats.BLIND_BOYS_HOME },
        { homeType: 'OLD_AGE_HOME', label: 'Old Age Home', ...homeStats.OLD_AGE_HOME },
        { homeType: 'GENERAL', label: 'General', ...homeStats.GENERAL },
      ],
      totals: {
        cashTotal: totalCash,
        inKindCount: totalInKind,
        totalDonations: donations.length,
      },
    };
  }
}
