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
exports.DashboardStatsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dashboard_helpers_1 = require("./dashboard.helpers");
let DashboardStatsService = class DashboardStatsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const { fyStart, fyEnd } = (0, dashboard_helpers_1.getCurrentFY)();
        const { start: monthStart, end: monthEnd } = (0, dashboard_helpers_1.getMonthRange)();
        const [totalDonationsFY, donationsThisMonth, activeDonors, totalBeneficiaries,] = await Promise.all([
            this.prisma.donation.aggregate({
                _sum: { donationAmount: true },
                where: {
                    deletedAt: null,
                    donationDate: { gte: fyStart, lte: fyEnd },
                },
            }),
            this.prisma.donation.aggregate({
                _sum: { donationAmount: true },
                where: {
                    deletedAt: null,
                    donationDate: { gte: monthStart, lte: monthEnd },
                },
            }),
            this.prisma.donor.count({
                where: { deletedAt: null },
            }),
            this.prisma.beneficiary.count({
                where: { deletedAt: null },
            }),
        ]);
        return {
            totalDonationsFY: totalDonationsFY._sum.donationAmount?.toNumber() || 0,
            donationsThisMonth: donationsThisMonth._sum.donationAmount?.toNumber() || 0,
            activeDonors,
            totalBeneficiaries,
        };
    }
    async getMonthlyDonorTarget() {
        const { start: monthStart, end: monthEnd } = (0, dashboard_helpers_1.getMonthRange)();
        const MONTHLY_TARGET = 300000;
        const monthlyDonors = await this.prisma.donor.findMany({
            where: { deletedAt: null, donationFrequency: "MONTHLY" },
            select: { id: true },
        });
        const monthlyDonorIds = monthlyDonors.map((d) => d.id);
        const totalMonthlyDonors = monthlyDonorIds.length;
        if (totalMonthlyDonors === 0) {
            return {
                raised: 0,
                count: 0,
                totalMonthlyDonors: 0,
                target: MONTHLY_TARGET,
                remaining: MONTHLY_TARGET,
                progressPct: 0,
                achieved: false,
            };
        }
        const [amountAgg, donorsWhoGave] = await Promise.all([
            this.prisma.donation.aggregate({
                _sum: { donationAmount: true },
                _count: { id: true },
                where: {
                    deletedAt: null,
                    donorId: { in: monthlyDonorIds },
                    donationDate: { gte: monthStart, lte: monthEnd },
                },
            }),
            this.prisma.donation.groupBy({
                by: ["donorId"],
                where: {
                    deletedAt: null,
                    donorId: { in: monthlyDonorIds },
                    donationDate: { gte: monthStart, lte: monthEnd },
                },
            }),
        ]);
        const raised = amountAgg._sum.donationAmount?.toNumber() || 0;
        const count = donorsWhoGave.length;
        const remaining = Math.max(0, MONTHLY_TARGET - raised);
        const progressPct = Math.min(100, Math.round((raised / MONTHLY_TARGET) * 100));
        const achieved = raised >= MONTHLY_TARGET;
        return {
            raised,
            count,
            totalMonthlyDonors,
            target: MONTHLY_TARGET,
            remaining,
            progressPct,
            achieved,
        };
    }
    async getDonationModeSplit() {
        const { fyStart, fyEnd } = (0, dashboard_helpers_1.getCurrentFY)();
        const modes = await this.prisma.donation.groupBy({
            by: ["donationMode"],
            _sum: { donationAmount: true },
            _count: { id: true },
            where: {
                deletedAt: null,
                donationDate: { gte: fyStart, lte: fyEnd },
            },
        });
        return modes.map((m) => ({
            mode: m.donationMode,
            amount: m._sum.donationAmount?.toNumber() || 0,
            count: m._count.id || 0,
        }));
    }
    async getTopDonors(limit = 5) {
        const { fyStart, fyEnd } = (0, dashboard_helpers_1.getCurrentFY)();
        const topDonors = await this.prisma.donation.groupBy({
            by: ["donorId"],
            _sum: { donationAmount: true },
            _count: { id: true },
            where: {
                deletedAt: null,
                donationDate: { gte: fyStart, lte: fyEnd },
            },
            orderBy: { _sum: { donationAmount: "desc" } },
            take: limit,
        });
        const donorIds = topDonors.map((d) => d.donorId);
        const donors = await this.prisma.donor.findMany({
            where: { id: { in: donorIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                donorCode: true,
                category: true,
            },
        });
        const donorMap = new Map(donors.map((d) => [d.id, d]));
        return topDonors.map((td) => {
            const donor = donorMap.get(td.donorId);
            return {
                donorId: td.donorId,
                donorCode: donor?.donorCode || "",
                name: donor
                    ? `${donor.firstName} ${donor.lastName || ""}`.trim()
                    : "Unknown",
                category: donor?.category || "INDIVIDUAL",
                totalAmount: td._sum.donationAmount?.toNumber() || 0,
                donationCount: td._count.id || 0,
            };
        });
    }
    async getRecentDonations(limit = 10) {
        const donations = await this.prisma.donation.findMany({
            where: { deletedAt: null },
            orderBy: { donationDate: "desc" },
            take: limit,
            include: {
                donor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        donorCode: true,
                    },
                },
            },
        });
        return donations.map((d) => ({
            id: d.id,
            donorId: d.donorId,
            donorCode: d.donor.donorCode,
            donorName: `${d.donor.firstName} ${d.donor.lastName || ""}`.trim(),
            amount: d.donationAmount.toNumber(),
            date: d.donationDate,
            mode: d.donationMode,
            type: d.donationType,
            receiptNumber: d.receiptNumber,
        }));
    }
};
exports.DashboardStatsService = DashboardStatsService;
exports.DashboardStatsService = DashboardStatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardStatsService);
//# sourceMappingURL=dashboard.stats.service.js.map