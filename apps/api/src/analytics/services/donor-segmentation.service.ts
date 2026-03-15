import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DonorSegmentationResult {
  championDonors: number;
  majorDonors: number;
  activeDonors: number;
  smallDonors: number;
  total: number;
}

@Injectable()
export class DonorSegmentationService {
  constructor(private prisma: PrismaService) {}

  async getDonorSegmentation(): Promise<DonorSegmentationResult> {
    const rows = await this.prisma.$queryRaw<
      { band: string; cnt: bigint }[]
    >`
      SELECT
        CASE
          WHEN total >= 100000 THEN 'champion'
          WHEN total >= 50000  THEN 'major'
          WHEN total >= 10000  THEN 'active'
          ELSE 'small'
        END AS band,
        COUNT(*) AS cnt
      FROM (
        SELECT "donorId", SUM("donationAmount") AS total
        FROM donations
        WHERE "isDeleted" = false
        GROUP BY "donorId"
      ) t
      GROUP BY band
    `;

    let championDonors = 0;
    let majorDonors = 0;
    let activeDonors = 0;
    let smallDonors = 0;

    for (const row of rows) {
      const count = Number(row.cnt);
      if (row.band === 'champion') championDonors = count;
      else if (row.band === 'major') majorDonors = count;
      else if (row.band === 'active') activeDonors = count;
      else smallDonors = count;
    }

    return {
      championDonors,
      majorDonors,
      activeDonors,
      smallDonors,
      total: championDonors + majorDonors + activeDonors + smallDonors,
    };
  }
}
