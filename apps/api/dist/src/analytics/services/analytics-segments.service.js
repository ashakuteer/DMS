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
exports.AnalyticsSegmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const analytics_date_utils_1 = require("../utils/analytics-date.utils");
let AnalyticsSegmentsService = class AnalyticsSegmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTopDonorsSegment() {
        const { fyStart, fyEnd } = (0, analytics_date_utils_1.getCurrentFY)();
        const top = await this.prisma.donation.groupBy({
            by: ["donorId"],
            _sum: { donationAmount: true },
            _count: { id: true },
            where: {
                deletedAt: null,
                donationDate: { gte: fyStart, lte: fyEnd },
            },
            orderBy: {
                _sum: { donationAmount: "desc" },
            },
            take: 20,
        });
        const donorIds = top.map((d) => d.donorId);
        const donors = await this.prisma.donor.findMany({
            where: {
                id: { in: donorIds },
                deletedAt: null,
            },
            select: {
                id: true,
                donorCode: true,
                firstName: true,
                lastName: true,
            },
        });
        const donorMap = new Map(donors.map((d) => [d.id, d]));
        return top.map((t) => {
            const donor = donorMap.get(t.donorId);
            return {
                donorId: t.donorId,
                donorCode: donor?.donorCode ?? "",
                donorName: donor
                    ? `${donor.firstName} ${donor.lastName ?? ""}`.trim()
                    : "Unknown",
                totalAmount: Number(t._sum.donationAmount) || 0,
                donationCount: t._count.id || 0,
            };
        });
    }
};
exports.AnalyticsSegmentsService = AnalyticsSegmentsService;
exports.AnalyticsSegmentsService = AnalyticsSegmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsSegmentsService);
//# sourceMappingURL=analytics-segments.service.js.map