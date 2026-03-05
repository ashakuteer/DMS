import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EngagementResult, HealthStatus } from "./donors.types";

@Injectable()
export class DonorsEngagementService {
  constructor(private prisma: PrismaService) {}

  async computeEngagementScores(
    donorIds: string[],
  ): Promise<Record<string, EngagementResult>> {
    if (donorIds.length === 0) return {};

    const CHUNK_SIZE = 100;
    const results: Record<string, EngagementResult> = {};

    for (let i = 0; i < donorIds.length; i += CHUNK_SIZE) {
      const chunk = donorIds.slice(i, i + CHUNK_SIZE);
      const chunkResults = await this.computeEngagementScoresChunk(chunk);
      Object.assign(results, chunkResults);
    }

    return results;
  }

  private async computeEngagementScoresChunk(
    donorIds: string[],
  ): Promise<Record<string, EngagementResult>> {
    if (donorIds.length === 0) return {};

    const now = new Date();
    const results: Record<string, EngagementResult> = {};

    const [donations, pledges, sponsorships] = await Promise.all([
      this.prisma.donation.findMany({
        where: { donorId: { in: donorIds }, isDeleted: false },
        select: {
          donorId: true,
          donationDate: true,
          donationAmount: true,
        },
        orderBy: { donationDate: "desc" },
      }),

      this.prisma.pledge.findMany({
        where: { donorId: { in: donorIds }, isDeleted: false },
        select: {
          donorId: true,
          status: true,
          expectedFulfillmentDate: true,
        },
      }),

      this.prisma.sponsorship.findMany({
        where: { donorId: { in: donorIds } },
        select: {
          donorId: true,
          status: true,
        },
      }),
    ]);

   const donationsByDonor: Record<string, typeof donations[number][]> = {};
const pledgesByDonor: Record<string, typeof pledges[number][]> = {};
const sponsorsByDonor: Record<string, typeof sponsorships[number][]> = {};

    for (const d of donations) {
      if (!donationsByDonor[d.donorId]) donationsByDonor[d.donorId] = [];
      donationsByDonor[d.donorId].push(d);
    }

    for (const p of pledges) {
      if (!pledgesByDonor[p.donorId]) pledgesByDonor[p.donorId] = [];
      pledgesByDonor[p.donorId].push(p);
    }

    for (const s of sponsorships) {
      if (!sponsorsByDonor[s.donorId]) sponsorsByDonor[s.donorId] = [];
      sponsorsByDonor[s.donorId].push(s);
    }

    for (const donorId of donorIds) {
      const donorDonations = donationsByDonor[donorId] || [];
      const donorPledges = pledgesByDonor[donorId] || [];
      const donorSponsorships = sponsorsByDonor[donorId] || [];

      let score = 100;
      const reasons: string[] = [];

      const lastDonation = donorDonations[0];
      let daysSinceLastDonation = Infinity;

      if (lastDonation) {
        daysSinceLastDonation = Math.floor(
          (now.getTime() - new Date(lastDonation.donationDate).getTime()) /
            (1000 * 60 * 60 * 24),
        );
      }

      if (donorDonations.length === 0) {
        score -= 30;
        reasons.push("No donations recorded");
      } else if (daysSinceLastDonation > 365) {
        score -= 35;
        reasons.push(`No donation in ${daysSinceLastDonation} days`);
      } else if (daysSinceLastDonation > 180) {
        score -= 25;
      } else if (daysSinceLastDonation > 120) {
        score -= 20;
      } else if (daysSinceLastDonation > 60) {
        score -= 10;
      }

      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const donationsLast12Mo = donorDonations.filter(
        (d) => new Date(d.donationDate) >= oneYearAgo,
      ).length;

      if (donationsLast12Mo === 0 && donorDonations.length > 0) {
        score -= 15;
      } else if (donationsLast12Mo >= 4) {
        score += 10;
      } else if (donationsLast12Mo >= 2) {
        score += 5;
      }

      const totalLifetimeValue = donorDonations.reduce(
        (sum, d) =>
          sum + (d.donationAmount ? Number(d.donationAmount) : 0),
        0,
      );

      if (totalLifetimeValue > 100000) score += 10;
      else if (totalLifetimeValue > 50000) score += 5;

      const hasActiveSponsor = donorSponsorships.some(
        (s) => s.status === "ACTIVE",
      );

      if (hasActiveSponsor) score += 10;

      const overduePledges = donorPledges.filter(
        (p) =>
          (p.status === "PENDING" || p.status === "POSTPONED") &&
          p.expectedFulfillmentDate &&
          new Date(p.expectedFulfillmentDate) < now,
      );

      if (overduePledges.length >= 3) {
        score -= 25;
        reasons.push(`${overduePledges.length} pledges overdue`);
      } else if (overduePledges.length >= 1) {
        score -= 10 * overduePledges.length;
      }

      score = Math.max(0, Math.min(100, score));

      let status: HealthStatus;

      if (score >= 60) status = HealthStatus.GREEN;
      else if (score >= 35) status = HealthStatus.YELLOW;
      else status = HealthStatus.RED;

      results[donorId] = {
        score,
        status,
        reasons,
      };
    }

    await Promise.allSettled(
  Object.entries(results).map(([donorId, { score, status }]) =>
    this.prisma.donor
      .update({
        where: { id: donorId },
        data: {
          healthScore: score,
          healthStatus: status,
        },
      })
      .catch(() => null)
  )
);

return results;
}
}
  
  
