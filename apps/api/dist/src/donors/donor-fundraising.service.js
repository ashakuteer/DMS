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
exports.DonorFundraisingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DonorFundraisingService = class DonorFundraisingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getHealthScore(donorId) {
        const donor = await this.prisma.donor.findUnique({
            where: { id: donorId },
            select: { donorSince: true },
        });
        const donations = await this.prisma.donation.findMany({
            where: { donorId, isDeleted: false },
            select: { donationDate: true, donationAmount: true },
            orderBy: { donationDate: 'desc' },
        });
        const now = new Date();
        let recencyScore = 0;
        let frequencyScore = 0;
        let ltv = 0;
        let yearsScore = 0;
        if (donations.length > 0) {
            const lastDonation = donations[0].donationDate;
            const monthsAgo = (now.getFullYear() - lastDonation.getFullYear()) * 12 +
                (now.getMonth() - lastDonation.getMonth());
            if (monthsAgo < 3)
                recencyScore = 30;
            else if (monthsAgo < 12)
                recencyScore = 20;
            else
                recencyScore = 5;
            const count = donations.length;
            if (count >= 5)
                frequencyScore = 25;
            else if (count >= 3)
                frequencyScore = 20;
            else
                frequencyScore = 10;
            ltv = donations.reduce((sum, d) => sum + Number(d.donationAmount), 0);
        }
        else {
            recencyScore = 5;
            frequencyScore = 10;
            ltv = 0;
        }
        let ltvScore = 0;
        if (ltv >= 50000)
            ltvScore = 20;
        else if (ltv >= 10000)
            ltvScore = 15;
        else
            ltvScore = 10;
        const donorSince = donor?.donorSince ?? donor?.donorSince;
        let yearsSupporting = 0;
        if (donorSince) {
            yearsSupporting =
                (now.getTime() - new Date(donorSince).getTime()) /
                    (1000 * 60 * 60 * 24 * 365.25);
        }
        if (yearsSupporting >= 5)
            yearsScore = 15;
        else if (yearsSupporting >= 2)
            yearsScore = 10;
        else
            yearsScore = 5;
        const score = Math.min(recencyScore + frequencyScore + ltvScore + yearsScore, 100);
        let status = 'Lost Donor';
        if (score >= 80)
            status = 'Healthy Donor';
        else if (score >= 50)
            status = 'Active Donor';
        else if (score >= 30)
            status = 'At Risk Donor';
        return {
            score,
            status,
            breakdown: {
                recency: recencyScore,
                frequency: frequencyScore,
                lifetimeValue: ltvScore,
                yearsSupporting: yearsScore,
            },
        };
    }
    async getPrediction(donorId) {
        const donations = await this.prisma.donation.findMany({
            where: { donorId, isDeleted: false },
            select: { donationDate: true, donationAmount: true },
            orderBy: { donationDate: 'desc' },
        });
        const donationCount = donations.length;
        const now = new Date();
        let probability = 20;
        let lastDonationDate = null;
        if (donations.length > 0) {
            const last = donations[0].donationDate;
            lastDonationDate = last.toISOString();
            const monthsAgo = (now.getFullYear() - last.getFullYear()) * 12 +
                (now.getMonth() - last.getMonth());
            if (monthsAgo < 3)
                probability = 80;
            else if (monthsAgo < 6)
                probability = 60;
            else if (monthsAgo < 12)
                probability = 40;
            else
                probability = 20;
        }
        const totalDonated = donations.reduce((sum, d) => sum + Number(d.donationAmount), 0);
        const averageDonation = donationCount > 0 ? Math.round(totalDonated / donationCount) : 0;
        const expectedDonation = Math.round(averageDonation * 1.1);
        return {
            probability,
            expectedDonation,
            averageDonation,
            lastDonationDate,
            donationCount,
        };
    }
};
exports.DonorFundraisingService = DonorFundraisingService;
exports.DonorFundraisingService = DonorFundraisingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DonorFundraisingService);
//# sourceMappingURL=donor-fundraising.service.js.map