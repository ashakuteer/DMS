import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DonorsEngagementService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get engagement score for a donor - optimized version
   */
  async calculateEngagementScore(donorId: string) {
    // Use a single query with aggregations
    const [donationStats, lastDonation] = await Promise.all([
      this.prisma.donation.aggregate({
        where: { donorId, isDeleted: false },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.donation.findFirst({
        where: { donorId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    const donationCount = donationStats._count || 0;
    
    if (donationCount === 0) {
      return {
        donorId,
        score: 0,
        status: 'INACTIVE',
      };
    }

    const totalAmount = Number(donationStats._sum.amount || 0);
    const lastDonationDate = lastDonation?.createdAt;

    const daysSinceLastDonation = lastDonationDate
      ? (Date.now() - new Date(lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

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
      lastDonation: lastDonationDate,
      status,
    };
  }

  /**
   * Get engagement for all donors - batch optimized
   */
  async getAllDonorEngagement() {
    const donors = await this.prisma.donor.findMany({
      where: { isDeleted: false },
      select: { id: true },
    });

    // Process in batches to avoid overwhelming the system
    const BATCH_SIZE = 50;
    const results = [];

    for (let i = 0; i < donors.length; i += BATCH_SIZE) {
      const batch = donors.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(donor => 
        this.calculateEngagementScore(donor.id)
      );
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }
}
