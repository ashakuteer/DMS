import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { PrismaService } from "../prisma/prisma.service";
import { getCurrentFY, getMonthRange } from "./dashboard.helpers";

@Injectable()
export class DashboardStatsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getStats() {
    const cacheKey = "dashboard:stats";
    
    // ✅ Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate stats
    const { fyStart, fyEnd } = getCurrentFY();
    const { start: monthStart, end: monthEnd } = getMonthRange();

    const [
      totalDonationsFY,
      donationsThisMonth,
      activeDonors,
      totalBeneficiaries,
    ] = await Promise.all([
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: { gte: fyStart, lte: fyEnd },
        },
      }),
      this.prisma.donation.aggregate({
        _sum: { donationAmount: true },
        where: {
          deletedAt: null,
          donationDate: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.donor.count({
        where: { deletedAt: null },
      }),
      this.prisma.beneficiary.count({
        where: { deletedAt: null },
      }),
    ]);

    const stats = {
      totalDonationsFY: totalDonationsFY._sum.donationAmount?.toNumber() || 0,
      donationsThisMonth: donationsThisMonth._sum.donationAmount?.toNumber() || 0,
      activeDonors,
      totalBeneficiaries,
    };

    // ✅ Cache for 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300000);
    
    return stats;
  }

  async getDonationModeSplit() {
    const { fyStart, fyEnd } = getCurrentFY();

    const modes = await this.prisma.donation.groupBy({
      by: ["donationMode"],
      _sum: { donationAmount: true },
      _count: { id: true },
      where: {
        deletedAt: null,
        donationDate: { gte: fyStart, lte: fyEnd },
      },
    });

    return modes.map((m) => ({
      mode: m.donationMode,
      amount: m._sum.donationAmount?.toNumber() || 0,
      count: m._count.id || 0,
    }));
  }

  async getTopDonors(limit = 5) {
    const { fyStart, fyEnd } = getCurrentFY();

    const topDonors = await this.prisma.donation.groupBy({
      by: ["donorId"],
      _sum: { donationAmount: true },
      _count: { id: true },
      where: {
        deletedAt: null,
        donationDate: { gte: fyStart, lte: fyEnd },
      },
      orderBy: { _sum: { donationAmount: "desc" } },
      take: limit,
    });

    const donorIds = topDonors.map((d) => d.donorId);

    const donors = await this.prisma.donor.findMany({
      where: { id: { in: donorIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        donorCode: true,
        category: true,
      },
    });

    const donorMap = new Map(donors.map((d) => [d.id, d]));

    return topDonors.map((td) => {
      const donor = donorMap.get(td.donorId);

      return {
        donorId: td.donorId,
        donorCode: donor?.donorCode || "",
        name: donor
          ? `${donor.firstName} ${donor.lastName || ""}`.trim()
          : "Unknown",
        category: donor?.category || "INDIVIDUAL",
        totalAmount: td._sum.donationAmount?.toNumber() || 0,
        donationCount: td._count.id || 0,
      };
    });
  }

  async getRecentDonations(limit = 10) {
    const donations = await this.prisma.donation.findMany({
      where: { deletedAt: null },
      orderBy: { donationDate: "desc" },
      take: limit,
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
    });

    return donations.map((d) => ({
      id: d.id,
      donorId: d.donorId,
      donorCode: d.donor.donorCode,
      donorName: `${d.donor.firstName} ${d.donor.lastName || ""}`.trim(),
      amount: d.donationAmount.toNumber(),
      date: d.donationDate,
      mode: d.donationMode,
      type: d.donationType,
      receiptNumber: d.receiptNumber,
    }));
  }
}
