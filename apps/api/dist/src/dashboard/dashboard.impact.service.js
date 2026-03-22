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
var DashboardImpactService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardImpactService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dashboard_helpers_1 = require("./dashboard.helpers");
let DashboardImpactService = DashboardImpactService_1 = class DashboardImpactService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DashboardImpactService_1.name);
        this.cache = new Map();
        this.CACHE_TTL_MS = 5 * 60 * 1000;
    }
    getCached(key) {
        const entry = this.cache.get(key);
        if (entry && Date.now() < entry.expiresAt)
            return entry.data;
        this.cache.delete(key);
        return null;
    }
    setCached(key, data) {
        this.cache.set(key, { data, expiresAt: Date.now() + this.CACHE_TTL_MS });
    }
    async getImpactDashboard() {
        const cached = this.getCached("impact_dashboard");
        if (cached) {
            this.logger.debug("getImpactDashboard() served from cache");
            return cached;
        }
        const start = Date.now();
        try {
            const now = new Date();
            const { fyStart, fyEnd } = (0, dashboard_helpers_1.getCurrentFY)();
            const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthRanges = Array.from({ length: 12 }, (_, idx) => {
                const i = 11 - idx;
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
                return {
                    label: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
                    key: date.toISOString().slice(0, 7),
                    monthStart: new Date(date.getFullYear(), date.getMonth(), 1),
                    monthEnd,
                };
            });
            const maxMonthEnd = monthRanges[monthRanges.length - 1].monthEnd;
            const windowStart = monthRanges[0].monthStart;
            const [totalBeneficiaries, beneficiariesByHome, totalDonors, activeSponsors, activeSponsorships, totalDonationsFY, totalCampaigns, newBeneficiariesThisMonth, newDonorsThisMonth, newBeneficiariesLastMonth, newDonorsLastMonth, beneficiaryNewByMonth, donorNewByMonth, sponsorshipNewByMonth, donationByMonth, sponsorshipsByHome, donationsByHomeType,] = await Promise.all([
                this.prisma.beneficiary.count({ where: { deletedAt: null } }),
                this.prisma.beneficiary.groupBy({
                    by: ["homeType"],
                    _count: { id: true },
                    where: { deletedAt: null },
                }),
                this.prisma.donor.count({ where: { deletedAt: null } }),
                this.prisma.sponsorship.groupBy({
                    by: ["donorId"],
                    where: { status: "ACTIVE" },
                }),
                this.prisma.sponsorship.count({ where: { status: "ACTIVE" } }),
                this.prisma.donation.aggregate({
                    _sum: { donationAmount: true },
                    where: { deletedAt: null, donationDate: { gte: fyStart, lte: fyEnd } },
                }),
                this.prisma.campaign.count({ where: { isDeleted: false } }),
                this.prisma.beneficiary.count({
                    where: { deletedAt: null, createdAt: { gte: thisMonthStart } },
                }),
                this.prisma.donor.count({
                    where: { deletedAt: null, createdAt: { gte: thisMonthStart } },
                }),
                this.prisma.beneficiary.count({
                    where: { deletedAt: null, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
                }),
                this.prisma.donor.count({
                    where: { deletedAt: null, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
                }),
                this.prisma.$queryRaw `
        SELECT DATE_TRUNC('month', "createdAt") AS month, COUNT(*) AS count
        FROM beneficiaries
        WHERE "deletedAt" IS NULL AND "createdAt" <= ${maxMonthEnd}
        GROUP BY DATE_TRUNC('month', "createdAt")
      `,
                this.prisma.$queryRaw `
        SELECT DATE_TRUNC('month', "createdAt") AS month, COUNT(*) AS count
        FROM donors
        WHERE "deletedAt" IS NULL AND "createdAt" <= ${maxMonthEnd}
        GROUP BY DATE_TRUNC('month', "createdAt")
      `,
                this.prisma.$queryRaw `
        SELECT DATE_TRUNC('month', "createdAt") AS month, COUNT(*) AS count
        FROM sponsorships
        WHERE "status" = 'ACTIVE' AND "createdAt" <= ${maxMonthEnd}
        GROUP BY DATE_TRUNC('month', "createdAt")
      `,
                this.prisma.$queryRaw `
        SELECT
          DATE_TRUNC('month', "donationDate") AS month,
          SUM("donationAmount")               AS amount,
          COUNT(*)                            AS count
        FROM donations
        WHERE "deletedAt" IS NULL
          AND "donationDate" >= ${windowStart}
          AND "donationDate" <= ${maxMonthEnd}
        GROUP BY DATE_TRUNC('month', "donationDate")
      `,
                this.prisma.$queryRaw `
        SELECT b."homeType", COUNT(s.id) AS count
        FROM sponsorships s
        JOIN beneficiaries b ON b.id = s."beneficiaryId"
        WHERE s.status = 'ACTIVE'
          AND b."deletedAt" IS NULL
        GROUP BY b."homeType"
      `,
                this.prisma.$queryRaw `
        SELECT "donationHomeType" AS "homeType", SUM("donationAmount") AS amount
        FROM donations
        WHERE "deletedAt" IS NULL
          AND "donationDate" >= ${fyStart}
          AND "donationDate" <= ${fyEnd}
          AND "donationHomeType" IS NOT NULL
        GROUP BY "donationHomeType"
      `,
            ]);
            const buildCumulative = (rows) => {
                const sorted = [...rows].sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
                let running = 0;
                const cumMap = new Map();
                for (const r of sorted) {
                    const m = new Date(r.month);
                    if (m < windowStart) {
                        running += Number(r.count);
                    }
                }
                for (const { key, monthEnd } of monthRanges) {
                    for (const r of sorted) {
                        const m = new Date(r.month);
                        if (m >= windowStart && m <= monthEnd) {
                            if (!cumMap.has(new Date(r.month).toISOString().slice(0, 7))) {
                                running += Number(r.count);
                                cumMap.set(new Date(r.month).toISOString().slice(0, 7), running);
                            }
                        }
                    }
                    if (!cumMap.has(key)) {
                        cumMap.set(key, running);
                    }
                }
                return cumMap;
            };
            const beneficiaryCumulative = buildCumulative(beneficiaryNewByMonth);
            const donorCumulative = buildCumulative(donorNewByMonth);
            const sponsorshipCumulative = buildCumulative(sponsorshipNewByMonth);
            const donationByMonthKey = new Map(donationByMonth.map((r) => [
                new Date(r.month).toISOString().slice(0, 7),
                Number(r.amount ?? 0),
            ]));
            const monthlyGrowth = monthRanges.map(({ label, key }) => ({
                month: label,
                beneficiaries: beneficiaryCumulative.get(key) ?? 0,
                donors: donorCumulative.get(key) ?? 0,
                sponsorships: sponsorshipCumulative.get(key) ?? 0,
                donations: donationByMonthKey.get(key) ?? 0,
            }));
            const homeTypeToDonationHomeType = {
                ORPHAN_GIRLS: "GIRLS_HOME",
                BLIND_BOYS: "BLIND_BOYS_HOME",
                OLD_AGE: "OLD_AGE_HOME",
            };
            const sponsorshipCountByHome = new Map(sponsorshipsByHome.map((r) => [r.homeType, Number(r.count)]));
            const donationAmountByHomeType = new Map(donationsByHomeType.map((r) => [r.homeType, Number(r.amount ?? 0)]));
            const homeMetrics = beneficiariesByHome.map((h) => {
                const donationHomeType = homeTypeToDonationHomeType[h.homeType] || null;
                return {
                    homeType: h.homeType,
                    homeLabel: (0, dashboard_helpers_1.formatHomeType)(h.homeType),
                    beneficiaryCount: h._count.id,
                    activeSponsorships: sponsorshipCountByHome.get(h.homeType) ?? 0,
                    donationsReceived: donationHomeType
                        ? donationAmountByHomeType.get(donationHomeType) ?? 0
                        : 0,
                };
            });
            const result = {
                summary: {
                    totalBeneficiaries,
                    totalDonors,
                    activeSponsors: activeSponsors.length,
                    activeSponsorships,
                    totalDonationsFY: totalDonationsFY._sum.donationAmount?.toNumber() || 0,
                    totalCampaigns,
                },
                growth: {
                    newBeneficiariesThisMonth,
                    newDonorsThisMonth,
                    beneficiaryGrowthPct: newBeneficiariesLastMonth > 0
                        ? ((newBeneficiariesThisMonth - newBeneficiariesLastMonth) /
                            newBeneficiariesLastMonth) *
                            100
                        : newBeneficiariesThisMonth > 0
                            ? 100
                            : 0,
                    donorGrowthPct: newDonorsLastMonth > 0
                        ? ((newDonorsThisMonth - newDonorsLastMonth) / newDonorsLastMonth) * 100
                        : newDonorsThisMonth > 0
                            ? 100
                            : 0,
                },
                monthlyGrowth,
                homeMetrics,
            };
            this.setCached("impact_dashboard", result);
            this.logger.log(`getImpactDashboard() completed in ${Date.now() - start}ms`);
            return result;
        }
        catch (err) {
            this.logger.error(`getImpactDashboard() FAILED after ${Date.now() - start}ms`, err instanceof Error ? err.stack : String(err));
            throw err;
        }
    }
};
exports.DashboardImpactService = DashboardImpactService;
exports.DashboardImpactService = DashboardImpactService = DashboardImpactService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardImpactService);
//# sourceMappingURL=dashboard.impact.service.js.map