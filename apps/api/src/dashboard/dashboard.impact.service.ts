import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { formatHomeType, getCurrentFY } from "./dashboard.helpers";

@Injectable()
export class DashboardImpactService {
  private readonly logger = new Logger(DashboardImpactService.name);

  private readonly cache = new Map<string, { data: any; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiresAt) return entry.data as T;
    this.cache.delete(key);
    return null;
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, { data, expiresAt: Date.now() + this.CACHE_TTL_MS });
  }

  async getImpactDashboard() {
    const cached = this.getCached<any>("impact_dashboard");
    if (cached) {
      this.logger.debug("getImpactDashboard() served from cache");
      return cached;
    }

    const start = Date.now();
    const now = new Date();
    const { fyStart, fyEnd } = getCurrentFY();

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthRanges = Array.from({ length: 12 }, (_, idx) => {
      const i = 11 - idx;
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      return {
        label: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        monthStart: new Date(date.getFullYear(), date.getMonth(), 1),
        monthEnd,
      };
    });

    const [
      summaryResults,
      monthlyResults,
    ] = await Promise.all([
      Promise.all([
        this.prisma.beneficiary.count({ where: { deletedAt: null } }),
        this.prisma.beneficiary.groupBy({
          by: ["homeType"],
          _count: { id: true },
          where: { deletedAt: null },
        }),
        this.prisma.donor.count({ where: { deletedAt: null } }),
        this.prisma.sponsorship.findMany({
          where: { status: "ACTIVE" },
          select: { donorId: true },
          distinct: ["donorId"],
        }),
        this.prisma.sponsorship.count({ where: { status: "ACTIVE" } }),
        this.prisma.donation.aggregate({
          _sum: { donationAmount: true },
          where: { deletedAt: null, donationDate: { gte: fyStart, lte: fyEnd } },
        }),
        this.prisma.campaign.count({ where: { isDeleted: false } }),
        this.prisma.beneficiary.count({
          where: { deletedAt: null, createdAt: { gte: thisMonthStart } },
        }),
        this.prisma.donor.count({
          where: { deletedAt: null, createdAt: { gte: thisMonthStart } },
        }),
        this.prisma.beneficiary.count({
          where: { deletedAt: null, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        }),
        this.prisma.donor.count({
          where: { deletedAt: null, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        }),
      ]),
      Promise.all(
        monthRanges.map(({ monthStart, monthEnd }) =>
          Promise.all([
            this.prisma.beneficiary.count({
              where: { deletedAt: null, createdAt: { lte: monthEnd } },
            }),
            this.prisma.donor.count({
              where: { deletedAt: null, createdAt: { lte: monthEnd } },
            }),
            this.prisma.sponsorship.count({
              where: { status: "ACTIVE", createdAt: { lte: monthEnd } },
            }),
            this.prisma.donation.aggregate({
              _sum: { donationAmount: true },
              _count: { id: true },
              where: {
                deletedAt: null,
                donationDate: { gte: monthStart, lte: monthEnd },
              },
            }),
          ]),
        ),
      ),
    ]);

    const [
      totalBeneficiaries,
      beneficiariesByHome,
      totalDonors,
      activeSponsors,
      activeSponsorships,
      totalDonationsFY,
      totalCampaigns,
      newBeneficiariesThisMonth,
      newDonorsThisMonth,
      newBeneficiariesLastMonth,
      newDonorsLastMonth,
    ] = summaryResults;

    const monthlyGrowth = monthRanges.map(({ label }, i) => {
      const [bCount, dCount, sCount, donationAgg] = monthlyResults[i];
      return {
        month: label,
        beneficiaries: bCount,
        donors: dCount,
        sponsorships: sCount,
        donations: (donationAgg as any)._sum.donationAmount?.toNumber() || 0,
      };
    });

    const homeTypeToDonation: Record<string, string> = {
      ORPHAN_GIRLS: "GIRLS_HOME",
      BLIND_BOYS: "BLIND_BOYS_HOME",
      OLD_AGE: "OLD_AGE_HOME",
    };

    const homeMetrics = await Promise.all(
      (beneficiariesByHome as any[]).map(async (h: any) => {
        const donationHomeType = homeTypeToDonation[h.homeType] || null;

        const [sponsorshipCount, donationTotal] = await Promise.all([
          this.prisma.sponsorship.count({
            where: {
              status: "ACTIVE",
              beneficiary: { homeType: h.homeType, deletedAt: null },
            },
          }),
          donationHomeType
            ? this.prisma.donation.aggregate({
                _sum: { donationAmount: true },
                where: {
                  deletedAt: null,
                  donationHomeType: donationHomeType as any,
                  donationDate: { gte: fyStart, lte: fyEnd },
                },
              })
            : Promise.resolve({ _sum: { donationAmount: null } }),
        ]);

        return {
          homeType: h.homeType,
          homeLabel: formatHomeType(h.homeType),
          beneficiaryCount: h._count.id,
          activeSponsorships: sponsorshipCount,
          donationsReceived: (donationTotal as any)._sum.donationAmount?.toNumber() || 0,
        };
      }),
    );

    const result = {
      summary: {
        totalBeneficiaries,
        totalDonors,
        activeSponsors: (activeSponsors as any[]).length,
        activeSponsorships,
        totalDonationsFY: (totalDonationsFY as any)._sum.donationAmount?.toNumber() || 0,
        totalCampaigns,
      },
      growth: {
        newBeneficiariesThisMonth,
        newDonorsThisMonth,
        beneficiaryGrowthPct:
          newBeneficiariesLastMonth > 0
            ? ((newBeneficiariesThisMonth - newBeneficiariesLastMonth) /
                newBeneficiariesLastMonth) *
              100
            : newBeneficiariesThisMonth > 0
              ? 100
              : 0,
        donorGrowthPct:
          newDonorsLastMonth > 0
            ? ((newDonorsThisMonth - newDonorsLastMonth) / newDonorsLastMonth) * 100
            : newDonorsThisMonth > 0
              ? 100
              : 0,
      },
      monthlyGrowth,
      homeMetrics,
    };

    this.setCached("impact_dashboard", result);
    this.logger.log(`getImpactDashboard() completed in ${Date.now() - start}ms`);
    return result;
  }
}
