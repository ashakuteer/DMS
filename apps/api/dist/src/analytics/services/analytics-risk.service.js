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
exports.AnalyticsRiskService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AnalyticsRiskService = class AnalyticsRiskService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async computeAtRiskDonors() {
        const donors = await this.prisma.donor.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                donorCode: true,
                firstName: true,
                lastName: true,
                personalEmail: true,
                primaryPhone: true,
                donations: {
                    where: { deletedAt: null },
                    orderBy: { donationDate: "desc" },
                    take: 1,
                    select: {
                        donationDate: true,
                        donationAmount: true,
                    },
                },
            },
        });
        const now = new Date();
        return donors
            .filter((d) => {
            if (!d.donations.length)
                return false;
            const lastDonationDate = new Date(d.donations[0].donationDate);
            const diffDays = (now.getTime() - lastDonationDate.getTime()) /
                (1000 * 60 * 60 * 24);
            return diffDays > 90;
        })
            .map((d) => {
            const lastDonation = d.donations[0];
            const lastDate = new Date(lastDonation.donationDate);
            const diffDays = Math.round((now.getTime() - lastDate.getTime()) /
                (1000 * 60 * 60 * 24));
            return {
                donorId: d.id,
                donorCode: d.donorCode,
                donorName: `${d.firstName} ${d.lastName ?? ""}`.trim(),
                lastDonationDate: lastDate,
                lastDonationAmount: Number(lastDonation.donationAmount) || 0,
                daysSinceLastDonation: diffDays,
                hasEmail: Boolean(d.personalEmail),
                hasPhone: Boolean(d.primaryPhone),
            };
        });
    }
};
exports.AnalyticsRiskService = AnalyticsRiskService;
exports.AnalyticsRiskService = AnalyticsRiskService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsRiskService);
//# sourceMappingURL=analytics-risk.service.js.map