import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EngagementResult, HealthStatus } from "./donors.types";

@Injectable()
export class DonorsEngagementService {
  constructor(private prisma: PrismaService) {}

  async computeEngagementScores(
    donorIds: string[],
  ): Promise<Record<string, EngagementResult>> {
    if (!donorIds.length) return {};

    // 100 is a safe limit for database transaction stability
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
    if (!donorIds.length) return {};

    const now = new Date();
    const results: Record<string, EngagementResult> = {};

    const [donations, pledges, sponsorships] = await Promise.all([
      this.prisma.donation.findMany({
        where: { donorId: { in: donorIds }, isDeleted: false },
        select: { donorId: true, donationDate: true, donationAmount: true },
        orderBy: { donationDate: "desc" },
      }),
      this.prisma.pledge.findMany({
        where: {
          donorId: { in: donorIds },
          isDeleted: false,
          status: { in: ["PENDING", "POSTPONED"] },
        },
        select: { donorId: true, expectedFulfillmentDate: true },
      }),
      this.prisma.sponsorship.findMany({
        where: { donorId: { in: donorIds } },
        select: { donorId: true, status: true },
      }),
    ]);

    // Grouping data
    const donationsByDonor: Record<string, typeof donations> = {};
    const pledgesByDonor: Record<string, typeof pledges> = {};
    const sponsorsByDonor: Record<string, typeof sponsorships> = {};

    for (const d of donations) {
      (donationsByDonor[d.donorId] ??= []).push(d);
    }
    for (const p of pledges) {
      (pledgesByDonor[p.donorId] ??= []).push(p);
    }
    for (const s of sponsorships) {
      (sponsorsByDonor[s.donorId] ??= []).push(s);
    }

    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    for (const donorId of donorIds) {
      const donorDonations = donationsByDonor[donorId] || [];
      const donorPledges = pledgesByDonor[donorId] || [];
      const donorSponsorships = sponsorsByDonor[donorId] || [];

      let score = 100;
      const reasons: string[] = [];

      // 1. Recency Logic
      const lastDonation = donorDonations[0];
      if (!lastDonation) {
        score -= 30;
        reasons.push("No donations recorded");
      } else {
        const lastDate = new Date(lastDonation.donationDate);
        // Math.ceil ensures that even 1 hour ago counts as "1 day" for calculation safety
        const daysSince = Math.ceil((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSince > 365) {
          score -= 35;
          reasons.push(`No donation in ${daysSince} days`);
        } else if (daysSince > 180) score -= 25;
        else if (daysSince > 120) score -= 20;
        else if (daysSince > 60) score -= 10;
      }

      // 2. Frequency Logic (Last 12 Months)
      // Prisma returns Date objects, so we compare directly without new Date() inside filter
      const count12Mo = donorDonations.filter(d => d.donationDate >= oneYearAgo).length;
      if (count12Mo === 0 && donorDonations.length > 0) score -= 15;
      else if (count12Mo >= 4) score += 10;
      else if (count12Mo >= 2) score += 5;

      // 3. Monetary Value
      const ltv = donorDonations.reduce((sum, d) => sum + Number(d.donationAmount || 0), 0);
      if (ltv > 100000) score += 10;
      else if (ltv > 50000) score += 5;

      // 4. Sponsorships
      if (donorSponsorships.some(s => s.status === "ACTIVE")) score += 10;

      // 5. Overdue Pledges (Already filtered by status in query)
      const overdue = donorPledges.filter(p => p.expectedFulfillmentDate && p.expectedFulfillmentDate < now);
      if (overdue.length >= 3) {
        score -= 25;
        reasons.push(`${overdue.length} pledges overdue`);
      } else if (overdue.length >= 1) {
        score -= (10 * overdue.length);
      }

      score = Math.max(0, Math.min(100, score));
      
      const status = score >= 60 ? HealthStatus.GREEN : score >= 35 ? HealthStatus.YELLOW : HealthStatus.RED;
      results[donorId] = { score, status, reasons };
    }

    // Bulk update via transaction for efficiency
    await this.prisma.$transaction(
      Object.entries(results).map(([id, { score, status }]) =>
        this.prisma.donor.update({
          where: { id },
          data: { healthScore: score, healthStatus: status },
        })
      )
    );

    return results;
  }
}
