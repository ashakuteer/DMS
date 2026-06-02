import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface ReferralDonor {
  id: string;
  donorCode: string;
  firstName: string;
  lastName: string | null;
  createdAt: Date;
  totalDonations: number;
  donationCount: number;
}

export interface ReferralData {
  referredBy: {
    id: string;
    donorCode: string;
    firstName: string;
    lastName: string | null;
  } | null;
  referredDonors: ReferralDonor[];
}

export interface ReferralLeaderboardEntry {
  id: string;
  donorCode: string;
  firstName: string;
  lastName: string | null;
  referralCount: number;
  totalDonationsGenerated: number;
}

@Injectable()
export class DonorsReferralService {
  constructor(private readonly prisma: PrismaService) {}

  async getReferralData(donorId: string): Promise<ReferralData> {
    const donor = await this.prisma.donor.findFirst({
      where: { id: donorId, isDeleted: false },
      select: {
        referredBy: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
          },
        },
        referrals: {
          where: { isDeleted: false },
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            donations: {
              where: { isDeleted: false },
              select: { donationAmount: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!donor) {
      return { referredBy: null, referredDonors: [] };
    }

    const referredDonors: ReferralDonor[] = (donor.referrals || []).map((r) => {
      const totalDonations = r.donations.reduce((sum, d) => {
        const amount =
          typeof d.donationAmount === "object" && (d.donationAmount as any).toNumber
            ? (d.donationAmount as any).toNumber()
            : Number(d.donationAmount ?? 0);
        return sum + amount;
      }, 0);
      return {
        id: r.id,
        donorCode: r.donorCode,
        firstName: r.firstName,
        lastName: r.lastName,
        createdAt: r.createdAt,
        totalDonations,
        donationCount: r.donations.length,
      };
    });

    return {
      referredBy: donor.referredBy ?? null,
      referredDonors,
    };
  }

  async getReferralLeaderboard(limit = 20): Promise<ReferralLeaderboardEntry[]> {
    const referrers = await this.prisma.donor.findMany({
      where: {
        isDeleted: false,
        referrals: { some: { isDeleted: false } },
      },
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        lastName: true,
        referrals: {
          where: { isDeleted: false },
          select: {
            donations: {
              where: { isDeleted: false },
              select: { donationAmount: true },
            },
          },
        },
      },
    });

    const leaderboard: ReferralLeaderboardEntry[] = referrers.map((r) => {
      const referralCount = r.referrals.length;
      const totalDonationsGenerated = r.referrals.reduce((sum, referred) => {
        return (
          sum +
          referred.donations.reduce((dSum, d) => {
            const amount =
              typeof d.donationAmount === "object" && (d.donationAmount as any).toNumber
                ? (d.donationAmount as any).toNumber()
                : Number(d.donationAmount ?? 0);
            return dSum + amount;
          }, 0)
        );
      }, 0);

      return {
        id: r.id,
        donorCode: r.donorCode,
        firstName: r.firstName,
        lastName: r.lastName,
        referralCount,
        totalDonationsGenerated,
      };
    });

    return leaderboard
      .sort((a, b) => b.referralCount - a.referralCount || b.totalDonationsGenerated - a.totalDonationsGenerated)
      .slice(0, limit);
  }
}
