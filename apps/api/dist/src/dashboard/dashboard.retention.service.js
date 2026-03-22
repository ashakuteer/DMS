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
var DashboardRetentionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardRetentionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardRetentionService = DashboardRetentionService_1 = class DashboardRetentionService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DashboardRetentionService_1.name);
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
    async getRetentionAnalytics() {
        const cached = this.getCached("retention_analytics");
        if (cached) {
            this.logger.debug("getRetentionAnalytics() served from cache");
            return cached;
        }
        const start = Date.now();
        try {
            const now = new Date();
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
            const [totalDonorCount, donorDonationStats, activeLast6Count, activeLast12Count] = await Promise.all([
                this.prisma.donor.count({ where: { deletedAt: null } }),
                this.prisma.donation.groupBy({
                    by: ["donorId"],
                    where: { deletedAt: null },
                    _count: { id: true },
                    _sum: { donationAmount: true },
                    _min: { donationDate: true },
                    _max: { donationDate: true },
                }),
                this.prisma.donation.groupBy({
                    by: ["donorId"],
                    where: { deletedAt: null, donationDate: { gte: sixMonthsAgo } },
                    _count: { id: true },
                }),
                this.prisma.donation.groupBy({
                    by: ["donorId"],
                    where: { deletedAt: null, donationDate: { gte: twelveMonthsAgo } },
                    _count: { id: true },
                }),
            ]);
            const donorsWhoEverDonated = donorDonationStats.length;
            const activeLast6Months = activeLast6Count.length;
            const activeLast12Months = activeLast12Count.length;
            const neverDonatedCount = totalDonorCount - donorsWhoEverDonated;
            const donorIdsWithMultiple = donorDonationStats
                .filter((d) => d._count.id >= 2)
                .map((d) => d.donorId);
            const donorIdsOneTime = donorDonationStats
                .filter((d) => d._count.id === 1)
                .map((d) => d.donorId);
            const lapsedDonorIds = donorDonationStats
                .filter((d) => {
                const lastDate = d._max.donationDate ? new Date(d._max.donationDate).getTime() : 0;
                return now.getTime() - lastDate > 180 * 24 * 60 * 60 * 1000;
            })
                .map((d) => d.donorId);
            const [repeatDonorDetails, lapsedDonorDetails, monthlyActiveRows] = await Promise.all([
                donorIdsWithMultiple.length > 0
                    ? this.prisma.donor.findMany({
                        where: { id: { in: donorIdsWithMultiple.slice(0, 100) }, deletedAt: null },
                        select: { id: true, firstName: true, lastName: true, donorCode: true },
                    })
                    : Promise.resolve([]),
                lapsedDonorIds.length > 0
                    ? this.prisma.donor.findMany({
                        where: { id: { in: lapsedDonorIds.slice(0, 100) }, deletedAt: null },
                        select: { id: true, firstName: true, lastName: true, donorCode: true },
                    })
                    : Promise.resolve([]),
                this.prisma.$queryRaw `
        SELECT
          DATE_TRUNC('month', "donationDate") AS month,
          COUNT(DISTINCT "donorId")            AS "activeDonors"
        FROM donations
        WHERE "deletedAt" IS NULL
          AND "donationDate" >= ${twelveMonthsAgo}
        GROUP BY DATE_TRUNC('month', "donationDate")
        ORDER BY month ASC
      `,
            ]);
            const statsByDonorId = new Map(donorDonationStats.map((s) => [s.donorId, s]));
            const activeDonorsByMonthKey = new Map(monthlyActiveRows.map((r) => [
                new Date(r.month).toISOString().slice(0, 7),
                Number(r.activeDonors),
            ]));
            const firstDonationByDonor = donorDonationStats
                .filter((d) => d._min.donationDate != null)
                .map((d) => new Date(d._min.donationDate));
            const monthRanges = Array.from({ length: 12 }, (_, idx) => {
                const i = 11 - idx;
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
                return {
                    label: monthStart.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
                    monthStart,
                    monthEnd,
                    key: monthStart.toISOString().slice(0, 7),
                };
            });
            const retentionOverTime = monthRanges.map(({ label, monthStart, monthEnd, key }) => {
                const activeDonorCount = activeDonorsByMonthKey.get(key) ?? 0;
                const newDonorCount = firstDonationByDonor.filter((d) => d >= monthStart && d <= monthEnd).length;
                const totalDonors = firstDonationByDonor.filter((d) => d <= monthEnd).length;
                const retentionPct = totalDonors > 0
                    ? Math.round((activeDonorCount / totalDonors) * 1000) / 10
                    : 0;
                return {
                    month: label,
                    totalDonors,
                    activeDonors: activeDonorCount,
                    retentionPct,
                    newDonors: newDonorCount,
                    returningDonors: Math.max(0, activeDonorCount - newDonorCount),
                };
            });
            const repeatDonors = repeatDonorDetails
                .map((donor) => {
                const stats = statsByDonorId.get(donor.id);
                const totalAmount = stats._sum.donationAmount ? Number(stats._sum.donationAmount) : 0;
                const firstDate = stats._min.donationDate;
                const lastDate = stats._max.donationDate;
                const spanMs = new Date(lastDate).getTime() - new Date(firstDate).getTime();
                const avgFrequencyDays = stats._count.id > 1
                    ? Math.round(spanMs / (stats._count.id - 1) / (1000 * 60 * 60 * 24))
                    : 0;
                return {
                    id: donor.id,
                    donorCode: donor.donorCode,
                    name: [donor.firstName, donor.lastName].filter(Boolean).join(" "),
                    totalDonations: stats._count.id,
                    totalAmount,
                    firstDonation: new Date(firstDate).toISOString(),
                    lastDonation: new Date(lastDate).toISOString(),
                    avgFrequencyDays,
                };
            })
                .sort((a, b) => b.totalDonations - a.totalDonations)
                .slice(0, 50);
            const lapsedDonors = lapsedDonorDetails
                .map((donor) => {
                const stats = statsByDonorId.get(donor.id);
                const totalAmount = stats._sum.donationAmount ? Number(stats._sum.donationAmount) : 0;
                const lastDate = stats._max.donationDate;
                const daysSinceLastDonation = Math.floor((now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
                return {
                    id: donor.id,
                    donorCode: donor.donorCode,
                    name: [donor.firstName, donor.lastName].filter(Boolean).join(" "),
                    totalDonations: stats._count.id,
                    totalAmount,
                    lastDonation: new Date(lastDate).toISOString(),
                    daysSinceLastDonation,
                };
            })
                .sort((a, b) => b.daysSinceLastDonation - a.daysSinceLastDonation)
                .slice(0, 50);
            const result = {
                summary: {
                    totalDonors: totalDonorCount,
                    donorsWhoEverDonated,
                    repeatDonorCount: donorIdsWithMultiple.length,
                    oneTimeDonorCount: donorIdsOneTime.length,
                    neverDonatedCount,
                    lapsedDonorCount: lapsedDonorIds.length,
                    activeLast6Months,
                    activeLast12Months,
                    overallRetentionPct: donorsWhoEverDonated > 0
                        ? Math.round((donorIdsWithMultiple.length / donorsWhoEverDonated) * 1000) / 10
                        : 0,
                },
                retentionOverTime,
                repeatDonors,
                lapsedDonors,
            };
            this.setCached("retention_analytics", result);
            this.logger.log(`getRetentionAnalytics() completed in ${Date.now() - start}ms`);
            return result;
        }
        catch (err) {
            this.logger.error(`getRetentionAnalytics() FAILED after ${Date.now() - start}ms`, err instanceof Error ? err.stack : String(err));
            throw err;
        }
    }
};
exports.DashboardRetentionService = DashboardRetentionService;
exports.DashboardRetentionService = DashboardRetentionService = DashboardRetentionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardRetentionService);
//# sourceMappingURL=dashboard.retention.service.js.map