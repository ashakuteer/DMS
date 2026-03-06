import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { formatHomeType, getCurrentFY } from "./dashboard.helpers";

@Injectable()
export class DashboardImpactService {
  constructor(private readonly prisma: PrismaService) {}

  async getImpactDashboard() {
    const now = new Date();
    const { fyStart, fyEnd } = getCurrentFY();

    const [
      totalBeneficiaries,
      beneficiariesByHome,
      totalDonors,
      activeSponsors,
      activeSponsorships,
      totalDonationsFY,
      totalCampaigns,
    ] = await Promise.all([
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
    ]);

    const monthlyGrowth: {
      month: string;
      beneficiaries: number;
      donors: number;
      sponsorships: number;
      donations: number;
    }[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      const monthLabel = date.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });

      const [bCount, dCount, sCount, donationAgg] = await Promise.all([
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
            donationDate: {
              gte: new Date(date.getFullYear(), date.getMonth(), 1),
              lte: monthEnd,
            },
          },
        }),
      ]);

      monthlyGrowth.push({
        month: monthLabel,
        beneficiaries: bCount,
        donors: dCount,
        sponsorships: sCount,
        donations: donationAgg._sum.donationAmount?.toNumber() || 0,
      });
    }

    const homeMetrics = await Promise.all(
      beneficiariesByHome.map(async (h) => {
        const homeTypeToDonation: Record<string, string> = {
          ORPHAN_GIRLS: "GIRLS_HOME",
          BLIND_BOYS: "BLIND_BOYS_HOME",
          OLD_AGE: "OLD_AGE_HOME",
        };

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
          donationsReceived: donationTotal._sum.donationAmount?.toNumber() || 0,
        };
      }),
    );

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    const [
      newBeneficiariesThisMonth,
      newDonorsThisMonth,
      newBeneficiariesLastMonth,
      newDonorsLastMonth,
    ] = await Promise.all([
      this.prisma.beneficiary.count({
        where: {
          deletedAt: null,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
      }),
      this.prisma.donor.count({
        where: {
          deletedAt: null,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
      }),
      this.prisma.beneficiary.count({
        where: {
          deletedAt: null,
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        },
      }),
      this.prisma.donor.count({
        where: {
          deletedAt: null,
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        },
      }),
    ]);

    return {
      summary: {
        totalBeneficiaries,
        totalDonors,
        activeSponsors: activeSponsors.length,
        activeSponsorships,
        totalDonationsFY: totalDonationsFY._sum.donationAmount?.toNumber() || 0,
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
            ? ((newDonorsThisMonth - newDonorsLastMonth) /
                newDonorsLastMonth) *
              100
            : newDonorsThisMonth > 0
              ? 100
              : 0,
      },
      monthlyGrowth,
      homeMetrics,
    };
  }
}
