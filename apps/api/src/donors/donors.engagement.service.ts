import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DonorsEngagementService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get engagement score for a donor
   */
  async calculateEngagementScore(donorId: string) {
    const donations = await this.prisma.donation.findMany({
      where: { donorId },
      select: { amount: true, createdAt: true },
    });

    if (donations.length === 0) {
      return {
        donorId,
        score: 0,
        status: 'INACTIVE',
      };
    }

    const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount), 0);
    const donationCount = donations.length;

    const lastDonation = donations.reduce((latest, d) =>
      d.createdAt > latest ? d.createdAt : latest,
    , donations[0].createdAt);

    const daysSinceLastDonation =
      (Date.now() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24);

    let score = donationCount * 10 + totalAmount / 100;

    if (daysSinceLastDonation < 30) score += 20;
    else if (daysSinceLastDonation < 90) score += 10;

    let status = 'LOW';
    if (score > 100) status = 'HIGH';
    else if (score > 50) status = 'MEDIUM';

    return {
      donorId,
      score: Math.round(score),
      donationCount,
      totalAmount,
      lastDonation,
      status,
    };
  }

  /**
   * Get engagement for all donors
   */
  async getAllDonorEngagement() {
    const donors = await this.prisma.donor.findMany({
      select: { id: true },
    });

    const results = [];

    for (const donor of donors) {
      const engagement = await this.calculateEngagementScore(donor.id);
      results.push(engagement);
    }

    return results;
  }
}
