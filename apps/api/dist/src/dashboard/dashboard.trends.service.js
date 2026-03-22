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
var DashboardTrendsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardTrendsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardTrendsService = DashboardTrendsService_1 = class DashboardTrendsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DashboardTrendsService_1.name);
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
    async getMonthlyTrends() {
        const cached = this.getCached("monthly_trends");
        if (cached) {
            this.logger.debug("getMonthlyTrends() served from cache");
            return cached;
        }
        const start = Date.now();
        try {
            const now = new Date();
            const monthRanges = Array.from({ length: 12 }, (_, idx) => {
                const i = 11 - idx;
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                return {
                    label: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
                    key: date.toISOString().slice(0, 7),
                    start: new Date(date.getFullYear(), date.getMonth(), 1),
                };
            });
            const windowStart = monthRanges[0].start;
            const rawRows = await this.prisma.$queryRaw `
      SELECT
        DATE_TRUNC('month', "donationDate") AS month,
        SUM("donationAmount")               AS amount,
        COUNT(*)                            AS count
      FROM donations
      WHERE "deletedAt" IS NULL
        AND "donationDate" >= ${windowStart}
      GROUP BY DATE_TRUNC('month', "donationDate")
      ORDER BY month ASC
    `;
            const dataByKey = new Map(rawRows.map((r) => [
                new Date(r.month).toISOString().slice(0, 7),
                { amount: r.amount ? Number(r.amount) : 0, count: Number(r.count) },
            ]));
            const months = monthRanges.map(({ label, key }) => {
                const d = dataByKey.get(key) ?? { amount: 0, count: 0 };
                return { month: label, amount: d.amount, count: d.count };
            });
            this.setCached("monthly_trends", months);
            this.logger.log(`getMonthlyTrends() completed in ${Date.now() - start}ms`);
            return months;
        }
        catch (err) {
            this.logger.error(`getMonthlyTrends() FAILED after ${Date.now() - start}ms`, err instanceof Error ? err.stack : String(err));
            throw err;
        }
    }
};
exports.DashboardTrendsService = DashboardTrendsService;
exports.DashboardTrendsService = DashboardTrendsService = DashboardTrendsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardTrendsService);
//# sourceMappingURL=dashboard.trends.service.js.map