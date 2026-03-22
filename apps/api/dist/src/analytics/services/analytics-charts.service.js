"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AnalyticsChartsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsChartsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const SAFE_CHARTS_FALLBACK = {
    monthlyDonations: [],
    donationsByType: [],
    donationsByHome: [],
    sponsorshipsDue: [],
};
let AnalyticsChartsService = AnalyticsChartsService_1 = class AnalyticsChartsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AnalyticsChartsService_1.name);
    }
    async getMonthlyDonationSeries() {
        try {
            const [monthlyDonations, donationsByType, donationsByHome, sponsorshipsDue] = await Promise.all([
                this.fetchMonthlyDonations(),
                this.fetchDonationsByType(),
                this.fetchDonationsByHome(),
                this.fetchSponsorshipsDue(),
            ]);
            return { monthlyDonations, donationsByType, donationsByHome, sponsorshipsDue };
        }
        catch (err) {
            this.logger.error("getMonthlyDonationSeries failed, returning fallback", err?.message);
            return SAFE_CHARTS_FALLBACK;
        }
    }
    async fetchMonthlyDonations() {
        try {
            const rows = await this.prisma.$queryRaw `
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
        }
        catch (err) {
            this.logger.error("fetchMonthlyDonations failed", err?.message);
            return [];
        }
    }
    async fetchDonationsByType() {
        try {
            const rows = await this.prisma.$queryRaw `
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
        }
        catch (err) {
            this.logger.error("fetchDonationsByType failed", err?.message);
            return [];
        }
    }
    async fetchDonationsByHome() {
        try {
            const rows = await this.prisma.$queryRaw `
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
        }
        catch (err) {
            this.logger.error("fetchDonationsByHome failed", err?.message);
            return [];
        }
    }
    async fetchSponsorshipsDue() {
        try {
            const rows = await this.prisma.$queryRaw `
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
        }
        catch (err) {
            this.logger.error("fetchSponsorshipsDue failed", err?.message);
            return [];
        }
    }
};
exports.AnalyticsChartsService = AnalyticsChartsService;
exports.AnalyticsChartsService = AnalyticsChartsService = AnalyticsChartsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsChartsService);
function safeNumber(value) {
    if (value === null || value === undefined)
        return 0;
    const n = Number(value);
    return isNaN(n) || !isFinite(n) ? 0 : n;
}
//# sourceMappingURL=analytics-charts.service.js.map