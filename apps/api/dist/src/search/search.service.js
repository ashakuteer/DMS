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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SearchService = class SearchService {
    constructor(prisma) {
        this.prisma = prisma;
        this.DEFAULT_LIMIT = 5;
        this.MAX_LIMIT = 20;
    }
    async globalSearch(query, limit = this.DEFAULT_LIMIT, filters = {}) {
        const trimmed = (query ?? "").trim();
        const normalizedFilters = this.normalizeFilters(filters);
        const hasFilters = Object.values(normalizedFilters).some((v) => v !== undefined && v !== null && v !== "");
        const safeLimit = this.getSafeLimit(limit);
        if (trimmed.length < 2 && !hasFilters) {
            return {
                donors: [],
                beneficiaries: [],
                donations: [],
                campaigns: [],
            };
        }
        const searchTerm = trimmed.length >= 2 ? trimmed : "";
        const isNumeric = searchTerm ? /^\d+(\.\d{1,2})?$/.test(searchTerm) : false;
        const numericValue = isNumeric ? Number(searchTerm) : null;
        const entityType = normalizedFilters.entityType;
        const donorPromise = !entityType || entityType === "donors"
            ? this.searchDonors(searchTerm, safeLimit, normalizedFilters)
            : Promise.resolve([]);
        const beneficiaryPromise = !entityType || entityType === "beneficiaries"
            ? this.searchBeneficiaries(searchTerm, safeLimit, normalizedFilters)
            : Promise.resolve([]);
        const donationPromise = !entityType || entityType === "donations"
            ? this.searchDonations(searchTerm, numericValue, safeLimit)
            : Promise.resolve([]);
        const campaignPromise = !entityType || entityType === "campaigns"
            ? this.searchCampaigns(searchTerm, safeLimit, normalizedFilters)
            : Promise.resolve([]);
        const [donors, beneficiaries, donations, campaigns] = await Promise.all([
            donorPromise,
            beneficiaryPromise,
            donationPromise,
            campaignPromise,
        ]);
        return { donors, beneficiaries, donations, campaigns };
    }
    getSafeLimit(limit) {
        if (!Number.isFinite(limit) || limit <= 0) {
            return this.DEFAULT_LIMIT;
        }
        return Math.min(Math.floor(limit), this.MAX_LIMIT);
    }
    normalizeFilters(filters) {
        return {
            donorCategory: this.clean(filters.donorCategory),
            donorCity: this.clean(filters.donorCity),
            beneficiaryHomeType: this.clean(filters.beneficiaryHomeType),
            beneficiaryStatus: this.clean(filters.beneficiaryStatus),
            beneficiaryAgeGroup: this.clean(filters.beneficiaryAgeGroup),
            beneficiarySponsored: this.clean(filters.beneficiarySponsored),
            campaignStatus: this.clean(filters.campaignStatus),
            campaignStartFrom: this.clean(filters.campaignStartFrom),
            campaignStartTo: this.clean(filters.campaignStartTo),
            entityType: this.clean(filters.entityType),
        };
    }
    clean(value) {
        if (typeof value !== "string")
            return undefined;
        const trimmed = value.trim();
        return trimmed ? trimmed : undefined;
    }
    toValidDate(value) {
        if (!value)
            return undefined;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? undefined : date;
    }
    async searchDonors(searchTerm, limit, filters = {}) {
        const andConditions = [{ deletedAt: null }];
        if (searchTerm) {
            andConditions.push({
                OR: [
                    { firstName: { startsWith: searchTerm, mode: "insensitive" } },
                    { lastName: { startsWith: searchTerm, mode: "insensitive" } },
                    { donorCode: { contains: searchTerm, mode: "insensitive" } },
                    { primaryPhone: { contains: searchTerm, mode: "insensitive" } },
                    { whatsappPhone: { contains: searchTerm, mode: "insensitive" } },
                    { personalEmail: { startsWith: searchTerm, mode: "insensitive" } },
                    { officialEmail: { startsWith: searchTerm, mode: "insensitive" } },
                ],
            });
        }
        if (filters.donorCategory &&
            Object.values(client_1.DonorCategory).includes(filters.donorCategory)) {
            andConditions.push({
                category: filters.donorCategory,
            });
        }
        if (filters.donorCity) {
            andConditions.push({
                city: { startsWith: filters.donorCity, mode: "insensitive" },
            });
        }
        if (andConditions.length === 1 && !searchTerm && !filters.donorCategory && !filters.donorCity) {
            return [];
        }
        const donors = await this.prisma.donor.findMany({
            where: { AND: andConditions },
            select: {
                id: true,
                donorCode: true,
                firstName: true,
                middleName: true,
                lastName: true,
                primaryPhone: true,
                personalEmail: true,
                city: true,
                category: true,
            },
            take: limit,
            orderBy: [
                { firstName: "asc" },
                { lastName: "asc" },
            ],
        });
        return donors.map((d) => ({
            id: d.id,
            donorCode: d.donorCode,
            name: [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" "),
            phone: d.primaryPhone,
            email: d.personalEmail,
            city: d.city,
            category: d.category,
        }));
    }
    async searchBeneficiaries(searchTerm, limit, filters = {}) {
        const andConditions = [{ deletedAt: null }];
        if (searchTerm) {
            const termUpper = searchTerm.toUpperCase().replace(/\s+/g, "_");
            const lowerSearch = searchTerm.toLowerCase();
            const matchingHomeTypes = Object.values(client_1.HomeType).filter((ht) => ht.includes(termUpper) ||
                ht.replace(/_/g, " ").toLowerCase().includes(lowerSearch));
            const orConditions = [
                { fullName: { startsWith: searchTerm, mode: "insensitive" } },
                { code: { contains: searchTerm, mode: "insensitive" } },
            ];
            if (matchingHomeTypes.length > 0) {
                orConditions.push({ homeType: { in: matchingHomeTypes } });
            }
            andConditions.push({ OR: orConditions });
        }
        if (filters.beneficiaryHomeType &&
            Object.values(client_1.HomeType).includes(filters.beneficiaryHomeType)) {
            andConditions.push({
                homeType: filters.beneficiaryHomeType,
            });
        }
        if (filters.beneficiaryStatus &&
            Object.values(client_1.BeneficiaryStatus).includes(filters.beneficiaryStatus)) {
            andConditions.push({
                status: filters.beneficiaryStatus,
            });
        }
        if (filters.beneficiaryAgeGroup) {
            const ageRange = this.getAgeRange(filters.beneficiaryAgeGroup);
            if (ageRange) {
                andConditions.push({
                    approxAge: {
                        gte: ageRange.min,
                        lte: ageRange.max,
                    },
                });
            }
        }
        if (filters.beneficiarySponsored === "true") {
            andConditions.push({
                sponsorships: {
                    some: {
                        status: "ACTIVE",
                    },
                },
            });
        }
        else if (filters.beneficiarySponsored === "false") {
            andConditions.push({
                sponsorships: {
                    none: {
                        status: "ACTIVE",
                    },
                },
            });
        }
        if (andConditions.length === 1 &&
            !searchTerm &&
            !filters.beneficiaryHomeType &&
            !filters.beneficiaryStatus &&
            !filters.beneficiaryAgeGroup &&
            filters.beneficiarySponsored === undefined) {
            return [];
        }
        const beneficiaries = await this.prisma.beneficiary.findMany({
            where: { AND: andConditions },
            select: {
                id: true,
                code: true,
                fullName: true,
                homeType: true,
                status: true,
                approxAge: true,
                sponsorships: {
                    where: { status: "ACTIVE" },
                    select: { id: true },
                    take: 1,
                },
            },
            take: limit,
            orderBy: [{ fullName: "asc" }],
        });
        return beneficiaries.map((b) => ({
            id: b.id,
            code: b.code,
            fullName: b.fullName,
            homeType: b.homeType,
            status: b.status,
            age: b.approxAge,
            sponsored: b.sponsorships.length > 0,
        }));
    }
    getAgeRange(ageGroup) {
        switch (ageGroup) {
            case "0-10":
                return { min: 0, max: 10 };
            case "11-18":
                return { min: 11, max: 18 };
            case "19-30":
                return { min: 19, max: 30 };
            case "31-50":
                return { min: 31, max: 50 };
            case "51-70":
                return { min: 51, max: 70 };
            case "71+":
                return { min: 71, max: 200 };
            default:
                return null;
        }
    }
    async searchDonations(searchTerm, numericValue, limit) {
        if (!searchTerm)
            return [];
        const orConditions = [
            { receiptNumber: { contains: searchTerm, mode: "insensitive" } },
            { transactionId: { contains: searchTerm, mode: "insensitive" } },
        ];
        if (numericValue !== null) {
            orConditions.push({ donationAmount: numericValue });
        }
        const donations = await this.prisma.donation.findMany({
            where: {
                deletedAt: null,
                OR: orConditions,
            },
            select: {
                id: true,
                receiptNumber: true,
                donationAmount: true,
                donationDate: true,
                donationType: true,
                donorId: true,
                donor: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            take: limit,
            orderBy: [{ donationDate: "desc" }],
        });
        return donations.map((d) => ({
            id: d.id,
            receiptNumber: d.receiptNumber,
            amount: Number(d.donationAmount),
            donorName: [d.donor?.firstName, d.donor?.lastName].filter(Boolean).join(" "),
            donorId: d.donorId,
            date: d.donationDate,
            type: d.donationType,
        }));
    }
    async searchCampaigns(searchTerm, limit, filters = {}) {
        const andConditions = [{ deletedAt: null }];
        if (searchTerm) {
            andConditions.push({
                OR: [
                    { name: { startsWith: searchTerm, mode: "insensitive" } },
                ],
            });
        }
        if (filters.campaignStatus &&
            Object.values(client_1.CampaignStatus).includes(filters.campaignStatus)) {
            andConditions.push({
                status: filters.campaignStatus,
            });
        }
        const startFrom = this.toValidDate(filters.campaignStartFrom);
        const startTo = this.toValidDate(filters.campaignStartTo);
        if (filters.campaignStartFrom && !startFrom) {
            throw new common_1.BadRequestException("Invalid campaignStartFrom date");
        }
        if (filters.campaignStartTo && !startTo) {
            throw new common_1.BadRequestException("Invalid campaignStartTo date");
        }
        if (startFrom) {
            andConditions.push({ startDate: { gte: startFrom } });
        }
        if (startTo) {
            andConditions.push({ startDate: { lte: startTo } });
        }
        if (andConditions.length === 1 &&
            !searchTerm &&
            !filters.campaignStatus &&
            !filters.campaignStartFrom &&
            !filters.campaignStartTo) {
            return [];
        }
        const campaigns = await this.prisma.campaign.findMany({
            where: { AND: andConditions },
            select: {
                id: true,
                name: true,
                status: true,
                goalAmount: true,
                startDate: true,
            },
            take: limit,
            orderBy: [{ createdAt: "desc" }],
        });
        return campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            goalAmount: c.goalAmount ? Number(c.goalAmount) : null,
            startDate: c.startDate,
        }));
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map