import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardRetentionService {
  constructor(private readonly prisma: PrismaService) {}

  async getRetentionAnalytics() {
    const now = new Date();

    const allDonors = await this.prisma.donor.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        donorCode: true,
        createdAt: true,
        donations: {
          where: { deletedAt: null },
          select: { id: true, donationDate: true, donationAmount: true },
          orderBy: { donationDate: "desc" },
        },
      },
    });

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);

    const repeatDonors: {
      id: string;
      donorCode: string;
      name: string;
      totalDonations: number;
      totalAmount: number;
      firstDonation: string;
      lastDonation: string;
      avgFrequencyDays: number;
    }[] = [];

    const lapsedDonors: {
      id: string;
      donorCode: string;
      name: string;
      totalDonations: number;
      totalAmount: number;
      lastDonation: string;
      daysSinceLastDonation: number;
    }[] = [];

    let oneTimeDonorCount = 0;
    let neverDonatedCount = 0;

    for (const donor of allDonors) {
      const name = [donor.firstName, donor.lastName].filter(Boolean).join(" ");
      const donations = donor.donations;

      if (donations.length === 0) {
        neverDonatedCount++;
        continue;
      }

      const totalAmount = donations.reduce(
        (sum, d) => sum + (d.donationAmount ? Number(d.donationAmount) : 0),
        0,
      );

      const firstDonation = donations[donations.length - 1].donationDate;
      const lastDonation = donations[0].donationDate;

      const daysSinceLast = Math.floor(
        (now.getTime() - new Date(lastDonation).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (donations.length >= 2) {
        const sortedDates = donations
          .map((d) => new Date(d.donationDate).getTime())
          .sort((a, b) => a - b);

        let totalGap = 0;
        for (let i = 1; i < sortedDates.length; i++) {
          totalGap += sortedDates[i] - sortedDates[i - 1];
        }

        const avgGapMs = totalGap / (sortedDates.length - 1);
        const avgFrequencyDays = Math.round(
          avgGapMs / (1000 * 60 * 60 * 24),
        );

        repeatDonors.push({
          id: donor.id,
          donorCode: donor.donorCode,
          name,
          totalDonations: donations.length,
          totalAmount,
          firstDonation: firstDonation.toISOString(),
          lastDonation: lastDonation.toISOString(),
          avgFrequencyDays,
        });

        if (daysSinceLast > 180) {
          lapsedDonors.push({
            id: donor.id,
            donorCode: donor.donorCode,
            name,
            totalDonations: donations.length,
            totalAmount,
            lastDonation: lastDonation.toISOString(),
            daysSinceLastDonation: daysSinceLast,
          });
        }
      } else {
        oneTimeDonorCount++;

        if (daysSinceLast > 180) {
          lapsedDonors.push({
            id: donor.id,
            donorCode: donor.donorCode,
            name,
            totalDonations: 1,
            totalAmount,
            lastDonation: lastDonation.toISOString(),
            daysSinceLastDonation: daysSinceLast,
          });
        }
      }
    }

    lapsedDonors.sort((a, b) => b.daysSinceLastDonation - a.daysSinceLastDonation);
    repeatDonors.sort((a, b) => b.totalDonations - a.totalDonations);

    const retentionOverTime: {
      month: string;
      totalDonors: number;
      activeDonors: number;
      retentionPct: number;
      newDonors: number;
      returningDonors: number;
    }[] = [];

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
      );

      const monthLabel = monthStart.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });

      const donorsRegisteredByMonth = allDonors.filter(
        (d) => new Date(d.createdAt) <= monthEnd && d.donations.length > 0,
      ).length;

      const donorsActiveInMonth = new Set<string>();
      const newDonorsInMonth = new Set<string>();
      const returningDonorsInMonth = new Set<string>();

      for (const donor of allDonors) {
        const donationsInMonth = donor.donations.filter((d) => {
          const dd = new Date(d.donationDate);
          return dd >= monthStart && dd <= monthEnd;
        });

        if (donationsInMonth.length > 0) {
          donorsActiveInMonth.add(donor.id);

          const hadPriorDonation = donor.donations.some(
            (d) => new Date(d.donationDate) < monthStart,
          );

          if (hadPriorDonation) {
            returningDonorsInMonth.add(donor.id);
          } else {
            newDonorsInMonth.add(donor.id);
          }
        }
      }

      const retentionPct =
        donorsRegisteredByMonth > 0
          ? Math.round((donorsActiveInMonth.size / donorsRegisteredByMonth) * 100 * 10) /
            10
          : 0;

      retentionOverTime.push({
        month: monthLabel,
        totalDonors: donorsRegisteredByMonth,
        activeDonors: donorsActiveInMonth.size,
        retentionPct,
        newDonors: newDonorsInMonth.size,
        returningDonors: returningDonorsInMonth.size,
      });
    }

    const donorsWhoEverDonated = allDonors.filter((d) => d.donations.length > 0).length;

    const activeLast6Months = allDonors.filter((d) =>
      d.donations.some((don) => new Date(don.donationDate) >= sixMonthsAgo),
    ).length;

    const activeLast12Months = allDonors.filter((d) =>
      d.donations.some((don) => new Date(don.donationDate) >= twelveMonthsAgo),
    ).length;

    return {
      summary: {
        totalDonors: allDonors.length,
        donorsWhoEverDonated,
        repeatDonorCount: repeatDonors.length,
        oneTimeDonorCount,
        neverDonatedCount,
        lapsedDonorCount: lapsedDonors.length,
        activeLast6Months,
        activeLast12Months,
        overallRetentionPct:
          donorsWhoEverDonated > 0
            ? Math.round((repeatDonors.length / donorsWhoEverDonated) * 100 * 10) / 10
            : 0,
      },
      retentionOverTime,
      repeatDonors: repeatDonors.slice(0, 50),
      lapsedDonors: lapsedDonors.slice(0, 50),
    };
  }
}
