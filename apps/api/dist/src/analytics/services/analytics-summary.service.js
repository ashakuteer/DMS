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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsSummaryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const analytics_date_utils_1 = require("../utils/analytics-date.utils");
let AnalyticsSummaryService = class AnalyticsSummaryService {
    constructor(prisma) {
        this.prisma = prisma;
        this.cache = new Map();
    }
    async getSummary() {
        const cacheKey = "analytics_summary";
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        const { start: monthStart, end: monthEnd } = (0, analytics_date_utils_1.getMonthRange)();
        const { start: t12Start, end: t12End } = (0, analytics_date_utils_1.getTrailing12MonthsRange)();
        const [totalDonors, donationsThisMonth, donationsT12, donationCountThisMonth,] = await Promise.all([
            this.prisma.donor.count({
                where: { deletedAt: null },
            }),
            this.prisma.donation.aggregate({
                _sum: { donationAmount: true },
                where: {
                    deletedAt: null,
                    donationDate: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
            }),
            this.prisma.donation.aggregate({
                _sum: { donationAmount: true },
                where: {
                    deletedAt: null,
                    donationDate: {
                        gte: t12Start,
                        lte: t12End,
                    },
                },
            }),
            this.prisma.donation.count({
                where: {
                    deletedAt: null,
                    donationDate: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
            }),
        ]);
        const result = {
            totalDonors,
            donationsThisMonth: Number(donationsThisMonth._sum.donationAmount) || 0,
            donationsT12: Number(donationsT12._sum.donationAmount) || 0,
            donationCountThisMonth,
        };
        this.cache.set(cacheKey, {
            data: result,
            expires: Date.now() + 5 * 60 * 1000,
        });
        return result;
    }
};
exports.AnalyticsSummaryService = AnalyticsSummaryService;
exports.AnalyticsSummaryService = AnalyticsSummaryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsSummaryService);
//# sourceMappingURL=analytics-summary.service.js.map