import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

type AtRiskDonorRow = {
  donorId: string;
  donorCode: string | null;
  donorName: string;
  lastDonationDate: Date;
  lastDonationAmount: Prisma.Decimal | number | null;
  daysSinceLastDonation: number;
  hasEmail: boolean;
  hasPhone: boolean;
};

type ComputeAtRiskDonorsOptions = {
  atRiskDays?: number;
  limit?: number;
  forceRefresh?: boolean;
};

@Injectable()
export class AnalyticsRiskService {
  private readonly logger = new Logger(AnalyticsRiskService.name);

  // Simple in-memory dashboard cache
  // Good for immediate speed improvement.
  // Later you can replace this with Redis / Nest cache manager if needed.
  private readonly cache = new Map<
    string,
    { expiresAt: number; data: AtRiskDonorRow[] }
  >();

  private readonly DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_AT_RISK_DAYS = 90;
  private readonly DEFAULT_LIMIT = 500;
  private readonly MAX_LIMIT = 2000;

  constructor(private readonly prisma: PrismaService) {}

  async computeAtRiskDonors(
    options: ComputeAtRiskDonorsOptions = {},
  ): Promise<AtRiskDonorRow[]> {
    const atRiskDays = options.atRiskDays ?? this.DEFAULT_AT_RISK_DAYS;
    const limit = options.limit ?? this.DEFAULT_LIMIT;
    const forceRefresh = options.forceRefresh ?? false;

    // Empty query / bad input protection
    if (!Number.isInteger(atRiskDays) || atRiskDays <= 0) {
      throw new BadRequestException("atRiskDays must be a positive integer");
    }

    if (!Number.isInteger(limit) || limit <= 0) {
      throw new BadRequestException("limit must be a positive integer");
    }

    const safeLimit = Math.min(limit, this.MAX_LIMIT);

    const cacheKey = `analytics:at-risk:${atRiskDays}:${safeLimit}`;

    if (!forceRefresh) {
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const now = new Date();
    const thresholdDate = new Date(
      now.getTime() - atRiskDays * 24 * 60 * 60 * 1000,
    );

    /**
     * Optimization notes:
     * 1. Avoids N+1 problem by using a single SQL query.
     * 2. Database finds only the latest donation per donor.
     * 3. Returns only at-risk donors instead of loading all donors into memory.
     * 4. Enforces soft-delete safety for BOTH donors and donations.
     */
    const rows = await this.prisma.$queryRaw<AtRiskDonorRow[]>(Prisma.sql`
      SELECT
        d.id AS "donorId",
        d."donorCode" AS "donorCode",
        TRIM(CONCAT(COALESCE(d."firstName", ''), ' ', COALESCE(d."lastName", ''))) AS "donorName",
        ld."donationDate" AS "lastDonationDate",
        ld."donationAmount" AS "lastDonationAmount",
        GREATEST(
          0,
          FLOOR(EXTRACT(EPOCH FROM (${now}::timestamp - ld."donationDate")) / 86400)
        )::int AS "daysSinceLastDonation",
        CASE
          WHEN d."personalEmail" IS NOT NULL AND BTRIM(d."personalEmail") <> '' THEN true
          ELSE false
        END AS "hasEmail",
        CASE
          WHEN d."primaryPhone" IS NOT NULL AND BTRIM(d."primaryPhone") <> '' THEN true
          ELSE false
        END AS "hasPhone"
      FROM "Donor" d
      INNER JOIN LATERAL (
        SELECT
          dn."donationDate",
          dn."donationAmount"
        FROM "Donation" dn
        WHERE
          dn."donorId" = d.id
          AND dn."deletedAt" IS NULL
          AND dn."donationDate" IS NOT NULL
        ORDER BY
          dn."donationDate" DESC,
          dn."id" DESC
        LIMIT 1
      ) ld ON true
      WHERE
        d."deletedAt" IS NULL
        AND ld."donationDate" < ${thresholdDate}
      ORDER BY
        ld."donationDate" ASC,
        d."firstName" ASC,
        d."lastName" ASC
      LIMIT ${safeLimit}
    `);

    const result = rows.map((row) => ({
      donorId: row.donorId,
      donorCode: row.donorCode,
      donorName: row.donorName,
      lastDonationDate: new Date(row.lastDonationDate),
      lastDonationAmount: Number(row.lastDonationAmount ?? 0),
      daysSinceLastDonation: Number(row.daysSinceLastDonation ?? 0),
      hasEmail: !!row.hasEmail,
      hasPhone: !!row.hasPhone,
    }));

    this.setCached(cacheKey, result);

    this.logger.debug(
      `Computed at-risk donors: count=${result.length}, atRiskDays=${atRiskDays}, limit=${safeLimit}`,
    );

    return result;
  }

  clearDashboardCache(): void {
    this.cache.clear();
    this.logger.debug("Analytics risk dashboard cache cleared");
  }

  private getCached(key: string): AtRiskDonorRow[] | null {
    const hit = this.cache.get(key);

    if (!hit) return null;

    if (Date.now() > hit.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return hit.data;
  }

  private setCached(key: string, data: AtRiskDonorRow[]): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.DASHBOARD_CACHE_TTL_MS,
    });
  }
}
