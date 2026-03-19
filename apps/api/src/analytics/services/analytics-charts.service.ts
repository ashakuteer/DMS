import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

const SAFE_CHARTS_FALLBACK = {
  monthlyDonations: [],
  donationsByType: [],
  donationsByHome: [],
  sponsorshipsDue: [],
};

@Injectable()
export class AnalyticsChartsService {
  private readonly logger = new Logger(AnalyticsChartsService.name);

  constructor(private prisma: PrismaService) {}

  async getMonthlyDonationSeries() {
    try {
      const [monthlyDonations, donationsByType, donationsByHome, sponsorshipsDue] =
        await Promise.all([
          this.fetchMonthlyDonations(),
          this.fetchDonationsByType(),
          this.fetchDonationsByHome(),
          this.fetchSponsorshipsDue(),
        ]);

      return { monthlyDonations, donationsByType, donationsByHome, sponsorshipsDue };
    } catch (err) {
      this.logger.error("getMonthlyDonationSeries failed, returning fallback", err?.message);
      return SAFE_CHARTS_FALLBACK;
    }
  }

  private async fetchMonthlyDonations() {
    try {
      const rows = await this.prisma.$queryRaw<
        { month: string; amount: unknown; count: unknown }[]
      >`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "donationDate"), 'Mon YY') AS month,
          COALESCE(SUM("donationAmount"), 0)                      AS amount,
          COALESCE(COUNT(*), 0)                                   AS count
        FROM "donations"
        WHERE "deletedAt" IS NULL
          AND "donationDate" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "donationDate")
        ORDER BY DATE_TRUNC('month', "donationDate")
      `;

      return (rows ?? []).map((r) => ({
        month: String(r.month ?? ""),
        amount: safeNumber(r.amount),
        count: safeNumber(r.count),
      }));
    } catch (err) {
      this.logger.error("fetchMonthlyDonations failed", err?.message);
      return [];
    }
  }

  private async fetchDonationsByType() {
    try {
      const rows = await this.prisma.$queryRaw<
        { type: string; amount: unknown; count: unknown }[]
      >`
        SELECT
          "donationType"::text                                    AS type,
          COALESCE(SUM("donationAmount"), 0)                      AS amount,
          COALESCE(COUNT(*), 0)                                   AS count
        FROM "donations"
        WHERE "deletedAt" IS NULL
          AND "donationDate" >= NOW() - INTERVAL '12 months'
        GROUP BY "donationType"
        ORDER BY SUM("donationAmount") DESC NULLS LAST
      `;

      return (rows ?? []).map((r) => ({
        type: String(r.type ?? "OTHER"),
        amount: safeNumber(r.amount),
        count: safeNumber(r.count),
      }));
    } catch (err) {
      this.logger.error("fetchDonationsByType failed", err?.message);
      return [];
    }
  }

  private async fetchDonationsByHome() {
    try {
      const rows = await this.prisma.$queryRaw<
        { home: string; amount: unknown; count: unknown }[]
      >`
        SELECT
          COALESCE("donationHomeType"::text, 'GENERAL')           AS home,
          COALESCE(SUM("donationAmount"), 0)                      AS amount,
          COALESCE(COUNT(*), 0)                                   AS count
        FROM "donations"
        WHERE "deletedAt" IS NULL
          AND "donationDate" >= NOW() - INTERVAL '12 months'
        GROUP BY "donationHomeType"
        ORDER BY SUM("donationAmount") DESC NULLS LAST
      `;

      return (rows ?? []).map((r) => ({
        home: String(r.home ?? "GENERAL"),
        amount: safeNumber(r.amount),
        count: safeNumber(r.count),
      }));
    } catch (err) {
      this.logger.error("fetchDonationsByHome failed", err?.message);
      return [];
    }
  }

  private async fetchSponsorshipsDue() {
    try {
      const rows = await this.prisma.$queryRaw<
        { month: string; activeDue: unknown; overdue: unknown }[]
      >`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "nextDueDate"), 'Mon YY')   AS month,
          COALESCE(COUNT(*) FILTER (WHERE "nextDueDate" >= NOW()), 0) AS "activeDue",
          COALESCE(COUNT(*) FILTER (WHERE "nextDueDate" < NOW()),  0) AS overdue
        FROM "sponsorships"
        WHERE "isActive" = true
          AND "nextDueDate" IS NOT NULL
          AND "nextDueDate" BETWEEN NOW() - INTERVAL '6 months'
                                AND NOW() + INTERVAL '3 months'
        GROUP BY DATE_TRUNC('month', "nextDueDate")
        ORDER BY DATE_TRUNC('month', "nextDueDate")
      `;

      return (rows ?? []).map((r) => ({
        month: String(r.month ?? ""),
        activeDue: safeNumber(r.activeDue),
        overdue: safeNumber(r.overdue),
      }));
    } catch (err) {
      this.logger.error("fetchSponsorshipsDue failed", err?.message);
      return [];
    }
  }
}

function safeNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return isNaN(n) || !isFinite(n) ? 0 : n;
}
