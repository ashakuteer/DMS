import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DateFilter,
  PaginationParams,
  DonorReportParams,
  ReceiptAuditParams,
} from './reports.types';
import { calculateDonorHealth, getFinancialYear, getFYDates, buildDateFilter } from './reports.helpers';

@Injectable()
export class ReportsQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyDonations(filter: DateFilter, pagination: PaginationParams) {
    const { page = 1, limit = 20, search = '' } = pagination;
    const skip = (page - 1) * limit;

    const dateWhere = buildDateFilter(filter);

    const searchWhere = search
      ? {
          OR: [
            { donor: { firstName: { contains: search, mode: 'insensitive' as const } } },
            { donor: { lastName: { contains: search, mode: 'insensitive' as const } } },
            { donor: { donorCode: { contains: search, mode: 'insensitive' as const } } },
            { receiptNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const where = {
      deletedAt: null,
      ...dateWhere,
      ...searchWhere,
    };

    const [donations, total, aggregation] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        include: {
          donor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              donorCode: true,
            },
          },
        },
        orderBy: { donationDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.donation.count({ where }),
      this.prisma.donation.aggregate({
        where,
        _sum: { donationAmount: true },
        _count: true,
      }),
    ]);

    return {
      data: donations.map((d) => ({
        id: d.id,
        donationDate: d.donationDate,
        donorName: `${d.donor.firstName} ${d.donor.lastName || ''}`.trim(),
        donorCode: d.donor.donorCode,
        donationType: d.donationType,
        donationMode: d.donationMode,
        amount: d.donationAmount,
        receiptNumber: d.receiptNumber,
        remarks: d.remarks,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalAmount: aggregation._sum?.donationAmount || 0,
        totalCount: aggregation._count,
      },
    };
  }

  async getDonorSummary(filter: DateFilter, pagination: PaginationParams) {
    const { page = 1, limit = 20, search = '' } = pagination;
    const skip = (page - 1) * limit;

    const searchWhere = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { donorCode: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const donorWhere = {
      deletedAt: null,
      ...searchWhere,
    };

    const [donors, total] = await Promise.all([
      this.prisma.donor.findMany({
        where: donorWhere,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          donorCode: true,
          category: true,
          donations: {
            where: { deletedAt: null },
            select: {
              donationAmount: true,
              donationDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.donor.count({ where: donorWhere }),
    ]);

    const fyDates =
      filter.startDate && filter.endDate
        ? { start: new Date(filter.startDate), end: new Date(filter.endDate) }
        : getFYDates('current');

    const data = donors.map((donor) => {
      const allDonations = donor.donations;
      const fyDonations = allDonations.filter(
        (d) => d.donationDate >= fyDates.start && d.donationDate <= fyDates.end,
      );

      return {
        id: donor.id,
        donorName: `${donor.firstName} ${donor.lastName || ''}`.trim(),
        donorCode: donor.donorCode,
        category: donor.category,
        fyTotal: fyDonations.reduce(
          (sum: number, d) => sum + (d.donationAmount?.toNumber() || 0),
          0,
        ),
        fyCount: fyDonations.length,
        lifetimeTotal: allDonations.reduce(
          (sum: number, d) => sum + (d.donationAmount?.toNumber() || 0),
          0,
        ),
        lifetimeCount: allDonations.length,
        lastDonation:
          allDonations.length > 0
            ? allDonations.sort(
                (a, b) => b.donationDate.getTime() - a.donationDate.getTime(),
              )[0].donationDate
            : null,
      };
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDonorReport(filter: DateFilter, params: DonorReportParams) {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'lifetime',
      sortOrder = 'desc',
    } = params;
    const skip = (page - 1) * limit;

    const searchWhere = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { donorCode: { contains: search, mode: 'insensitive' as const } },
            { primaryPhone: { contains: search, mode: 'insensitive' as const } },
            { personalEmail: { contains: search, mode: 'insensitive' as const } },
            { officialEmail: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const donorWhere = {
      deletedAt: null,
      ...searchWhere,
    };

    const [donors, total] = await Promise.all([
      this.prisma.donor.findMany({
        where: donorWhere,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          donorCode: true,
          city: true,
          state: true,
          country: true,
          donations: {
            where: { deletedAt: null },
            select: {
              donationAmount: true,
              donationDate: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.donor.count({ where: donorWhere }),
    ]);

    const fyDates =
      filter.startDate && filter.endDate
        ? { start: new Date(filter.startDate), end: new Date(filter.endDate) }
        : getFYDates('current');

    let data = donors.map((donor) => {
      const allDonations = donor.donations;
      const fyDonations = allDonations.filter(
        (d) => d.donationDate >= fyDates.start && d.donationDate <= fyDates.end,
      );

      const sortedDonations = [...allDonations].sort(
        (a, b) => b.donationDate.getTime() - a.donationDate.getTime(),
      );
      const lastDonationDate =
        sortedDonations.length > 0 ? sortedDonations[0].donationDate : null;

      return {
        id: donor.id,
        donorCode: donor.donorCode,
        donorName: `${donor.firstName} ${donor.lastName || ''}`.trim(),
        city: donor.city || null,
        country: donor.country || 'India',
        lifetimeTotal: allDonations.reduce(
          (sum: number, d) => sum + (d.donationAmount?.toNumber() || 0),
          0,
        ),
        fyTotal: fyDonations.reduce(
          (sum: number, d) => sum + (d.donationAmount?.toNumber() || 0),
          0,
        ),
        donationCount: allDonations.length,
        lastDonation: lastDonationDate,
        healthStatus: calculateDonorHealth(lastDonationDate),
      };
    });

    data.sort((a, b) => {
      let aVal: number, bVal: number;

      if (sortBy === 'lifetime') {
        aVal = a.lifetimeTotal;
        bVal = b.lifetimeTotal;
      } else if (sortBy === 'fy') {
        aVal = a.fyTotal;
        bVal = b.fyTotal;
      } else {
        aVal = a.lastDonation ? a.lastDonation.getTime() : 0;
        bVal = b.lastDonation ? b.lastDonation.getTime() : 0;
      }

      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReceiptsAudit(filter: DateFilter, params: ReceiptAuditParams) {
    const { page = 1, limit = 20, search = '', paymentMode } = params;
    const skip = (page - 1) * limit;

    const dateWhere = buildDateFilter(filter);

    const searchWhere = search
      ? {
          OR: [
            { donor: { firstName: { contains: search, mode: 'insensitive' as const } } },
            { donor: { lastName: { contains: search, mode: 'insensitive' as const } } },
            { receiptNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const paymentModeWhere =
      paymentMode && paymentMode !== 'ALL' ? { donationMode: paymentMode } : {};

    const where = {
      deletedAt: null,
      receiptNumber: { not: null },
      ...dateWhere,
      ...searchWhere,
      ...paymentModeWhere,
    };

    const [donations, total, summary] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        include: {
          donor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              donorCode: true,
            },
          },
        },
        orderBy: { receiptNumber: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.donation.count({ where }),
      this.prisma.donation.aggregate({
        where,
        _sum: { donationAmount: true },
        _count: true,
      }),
    ]);

    return {
      data: donations.map((d) => ({
        id: d.id,
        receiptNumber: d.receiptNumber,
        receiptDate: d.donationDate,
        donorName: `${d.donor.firstName} ${d.donor.lastName || ''}`.trim(),
        donorCode: d.donor.donorCode,
        amount: d.donationAmount,
        paymentMode: d.donationMode,
        financialYear: getFinancialYear(d.donationDate),
        donationCategory: d.donationType || 'CASH',
        generatedBy: 'System',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalAmount: summary._sum.donationAmount,
        totalCount: summary._count,
      },
    };
  }

  async getReceiptRegister(filter: DateFilter, pagination: PaginationParams) {
    const { page = 1, limit = 20, search = '' } = pagination;
    const skip = (page - 1) * limit;

    const dateWhere = buildDateFilter(filter);

    const searchWhere = search
      ? {
          OR: [
            { donor: { firstName: { contains: search, mode: 'insensitive' as const } } },
            { donor: { lastName: { contains: search, mode: 'insensitive' as const } } },
            { receiptNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const where = {
      deletedAt: null,
      receiptNumber: { not: null },
      ...dateWhere,
      ...searchWhere,
    };

    const [donations, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        include: {
          donor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              donorCode: true,
            },
          },
        },
        orderBy: { receiptNumber: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.donation.count({ where }),
    ]);

    return {
      data: donations.map((d) => ({
        id: d.id,
        receiptNumber: d.receiptNumber,
        donationDate: d.donationDate,
        donorName: `${d.donor.firstName} ${d.donor.lastName || ''}`.trim(),
        donorCode: d.donor.donorCode,
        amount: d.donationAmount,
        donationMode: d.donationMode,
        donationType: d.donationType,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
