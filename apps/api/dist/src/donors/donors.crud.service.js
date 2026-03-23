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
var DonorsCrudService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorsCrudService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const masking_util_1 = require("../common/utils/masking.util");
const donors_engagement_service_1 = require("./donors.engagement.service");
let DonorsCrudService = DonorsCrudService_1 = class DonorsCrudService {
    constructor(prisma, engagementService) {
        this.prisma = prisma;
        this.engagementService = engagementService;
        this.logger = new common_1.Logger(DonorsCrudService_1.name);
        this.UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    }
    getAccessFilter(_user) {
        return {};
    }
    shouldMaskData(user) {
        return user.role !== client_1.Role.FOUNDER;
    }
    isValidUUID(id) {
        return !!id && this.UUID_REGEX.test(id);
    }
    async getActiveDonorOrThrow(id) {
        if (!this.isValidUUID(id)) {
            throw new common_1.NotFoundException("Donor not found");
        }
        const donor = await this.prisma.donor.findFirst({
            where: { id, isDeleted: false },
            select: { id: true, assignedToUserId: true },
        });
        if (!donor) {
            throw new common_1.NotFoundException("Donor not found");
        }
        return donor;
    }
    async findAll(user, options = {}) {
        const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc", category, city, country, religion, assignedToUserId, donationFrequency, healthStatus, supportPreferences, } = options;
        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
        const allowedSortFields = [
            "createdAt",
            "updatedAt",
            "firstName",
            "lastName",
            "donorCode",
            "city",
            "healthStatus",
        ];
        const safeSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";
        const safeSortOrder = sortOrder === "asc" ? "asc" : "desc";
        const where = {
            isDeleted: false,
            ...this.getAccessFilter(user),
        };
        if (search?.trim()) {
            const q = search.trim();
            where.OR = [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { donorCode: { contains: q, mode: "insensitive" } },
                { primaryPhone: { contains: q, mode: "insensitive" } },
                { personalEmail: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } },
            ];
        }
        if (category) {
            where.category = category;
        }
        if (city?.trim()) {
            where.city = {
                contains: city.trim(),
                mode: client_1.Prisma.QueryMode.insensitive,
            };
        }
        if (country?.trim()) {
            where.country = {
                contains: country.trim(),
                mode: client_1.Prisma.QueryMode.insensitive,
            };
        }
        if (religion?.trim()) {
            where.religion = {
                contains: religion.trim(),
                mode: client_1.Prisma.QueryMode.insensitive,
            };
        }
        if (assignedToUserId) {
            where.assignedToUserId = assignedToUserId;
        }
        if (donationFrequency) {
            where.donationFrequency = donationFrequency;
        }
        if (supportPreferences) {
            const prefs = supportPreferences
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean);
            if (prefs.length > 0) {
                where.supportPreferences = { hasSome: prefs };
            }
        }
        if (healthStatus && ["GREEN", "YELLOW", "RED"].includes(healthStatus)) {
            where.healthStatus = healthStatus;
        }
        const [donors, total] = await Promise.all([
            this.prisma.donor.findMany({
                where,
                select: {
                    id: true,
                    donorCode: true,
                    firstName: true,
                    lastName: true,
                    primaryPhone: true,
                    whatsappPhone: true,
                    personalEmail: true,
                    city: true,
                    country: true,
                    category: true,
                    primaryRole: true,
                    additionalRoles: true,
                    donorTags: true,
                    communicationChannels: true,
                    donationFrequency: true,
                    healthScore: true,
                    healthStatus: true,
                    profilePicUrl: true,
                    assignedToUserId: true,
                    donorSince: true,
                    createdAt: true,
                    updatedAt: true,
                    assignedToUser: {
                        select: { id: true, name: true, email: true },
                    },
                    createdBy: {
                        select: { id: true, name: true },
                    },
                    _count: {
                        select: { donations: true, pledges: true },
                    },
                },
                orderBy: { [safeSortBy]: safeSortOrder },
                skip: (safePage - 1) * safeLimit,
                take: safeLimit,
            }),
            this.prisma.donor.count({ where }),
        ]);
        console.log('Total donors:', total);
        const donorIds = donors.map((d) => d.id);
        const engagementMap = donorIds.length
            ? await this.engagementService.computeEngagementScores(donorIds)
            : {};
        const donorsWithHealth = donors.map((donor) => ({
            ...donor,
            healthScore: engagementMap[donor.id]?.score ?? donor.healthScore ?? 100,
            healthStatus: engagementMap[donor.id]?.status ?? donor.healthStatus,
            healthReasons: engagementMap[donor.id]?.reasons ?? [],
        }));
        const items = this.shouldMaskData(user)
            ? donorsWithHealth.map((donor) => (0, masking_util_1.maskDonorData)(donor))
            : donorsWithHealth;
        return {
            items,
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit),
        };
    }
    async findOne(user, id) {
        this.logger.log(`API received ID: ${id}`);
        if (!this.isValidUUID(id)) {
            this.logger.warn(`Invalid donor ID format: "${id}" — returning 404`);
            throw new common_1.NotFoundException("Donor not found");
        }
        try {
            const donor = await this.prisma.donor.findFirst({
                where: {
                    id,
                    isDeleted: false,
                    ...this.getAccessFilter(user),
                },
                select: {
                    id: true,
                    donorCode: true,
                    firstName: true,
                    middleName: true,
                    lastName: true,
                    primaryPhone: true,
                    primaryPhoneCode: true,
                    alternatePhone: true,
                    alternatePhoneCode: true,
                    whatsappPhone: true,
                    whatsappPhoneCode: true,
                    personalEmail: true,
                    officialEmail: true,
                    address: true,
                    city: true,
                    state: true,
                    country: true,
                    pincode: true,
                    profession: true,
                    approximateAge: true,
                    gender: true,
                    incomeSpectrum: true,
                    religion: true,
                    donationMethods: true,
                    donationFrequency: true,
                    notes: true,
                    prefEmail: true,
                    prefWhatsapp: true,
                    prefSms: true,
                    prefReminders: true,
                    timezone: true,
                    category: true,
                    isUnder18Helper: true,
                    isSeniorCitizen: true,
                    isSingleParent: true,
                    isDisabled: true,
                    sourceOfDonor: true,
                    sourceDetails: true,
                    pan: true,
                    profilePicUrl: true,
                    supportPreferences: true,
                    engagementLevel: true,
                    referredByDonorId: true,
                    createdById: true,
                    isDeleted: true,
                    deletedAt: true,
                    donorSince: true,
                    createdAt: true,
                    updatedAt: true,
                    dobDay: true,
                    dobMonth: true,
                    healthScore: true,
                    healthStatus: true,
                    lastHealthCheck: true,
                    assignedToUserId: true,
                    primaryRole: true,
                    additionalRoles: true,
                    donorTags: true,
                    communicationChannels: true,
                    preferredCommunicationMethod: true,
                    communicationNotes: true,
                    assignedToUser: { select: { id: true, name: true, email: true } },
                    createdBy: { select: { id: true, name: true } },
                    specialOccasions: true,
                    familyMembers: true,
                    donations: {
                        where: { isDeleted: false },
                        orderBy: { donationDate: "desc" },
                        take: 5,
                    },
                    pledges: {
                        where: { isDeleted: false },
                        orderBy: { createdAt: "desc" },
                        take: 5,
                    },
                    sponsorships: true,
                    individualProfile: true,
                    volunteerProfile: true,
                    influencerProfile: true,
                    csrProfile: true,
                },
            });
            if (!donor) {
                throw new common_1.NotFoundException("Donor not found");
            }
            if (this.shouldMaskData(user)) {
                return (0, masking_util_1.maskDonorData)(donor);
            }
            return donor;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            this.logger.error(`Error fetching donor ${id}: ${error instanceof Error ? error.message : String(error)}`);
            throw new common_1.InternalServerErrorException("Failed to fetch donor");
        }
    }
    async create(user, data, ipAddress, userAgent) {
        const donorCode = `AKF-DNR-${Date.now()}`;
        const { individualProfile, volunteerProfile, influencerProfile, csrProfile, ...donorData } = data;
        try {
            const donor = await this.prisma.donor.create({
                data: {
                    donorCode: donorCode,
                    donorSince: new Date(),
                    ...donorData,
                    createdById: user.id,
                },
            });
            if (individualProfile) {
                await this.prisma.individualDonorProfile.create({
                    data: { donorId: donor.id, ...individualProfile },
                });
            }
            if (volunteerProfile) {
                await this.prisma.volunteerProfile.create({
                    data: { donorId: donor.id, ...volunteerProfile },
                });
            }
            if (influencerProfile) {
                await this.prisma.influencerProfile.create({
                    data: { donorId: donor.id, ...influencerProfile },
                });
            }
            if (csrProfile) {
                await this.prisma.cSRProfile.create({
                    data: { donorId: donor.id, ...csrProfile },
                });
            }
            return donor;
        }
        catch (err) {
            this.logger.error(`[DonorCreate] Failed for user=${user.id} payload=${JSON.stringify({ ...donorData, primaryRole: data.primaryRole })} error=${err instanceof Error ? err.message : err}`, err instanceof Error ? err.stack : undefined);
            throw err;
        }
    }
    async update(user, id, data, ipAddress, userAgent) {
        await this.getActiveDonorOrThrow(id);
        const { individualProfile, volunteerProfile, influencerProfile, csrProfile, visited, visitedHome, professionType, ...rest } = data;
        const donorData = {
            ...rest,
            profession: rest.profession || professionType || null,
        };
        const donor = await this.prisma.donor.update({
            where: { id },
            data: donorData,
        });
        return donor;
    }
    async softDelete(user, id, deleteReason, ipAddress, userAgent) {
        if (user.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException("Only administrators can delete donors");
        }
        await this.getActiveDonorOrThrow(id);
        return this.prisma.donor.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: user.id,
                deleteReason: deleteReason ?? null,
            },
        });
    }
    async restore(user, id) {
        if (user.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException("Only administrators can restore donors");
        }
        const donor = await this.prisma.donor.findFirst({
            where: { id, isDeleted: true },
            select: { id: true },
        });
        if (!donor) {
            throw new common_1.NotFoundException("Archived donor not found");
        }
        return this.prisma.donor.update({
            where: { id },
            data: {
                isDeleted: false,
                deletedAt: null,
                deletedBy: null,
                deleteReason: null,
            },
        });
    }
    async findArchived(user, search, page = 1, limit = 20) {
        if (user.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException("Only administrators can view archived records");
        }
        const where = { isDeleted: true };
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { donorCode: { contains: search, mode: "insensitive" } },
                { primaryPhone: { contains: search } },
            ];
        }
        const [total, data] = await Promise.all([
            this.prisma.donor.count({ where }),
            this.prisma.donor.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { deletedAt: "desc" },
                select: {
                    id: true,
                    donorCode: true,
                    firstName: true,
                    lastName: true,
                    category: true,
                    primaryPhone: true,
                    deletedAt: true,
                    deletedBy: true,
                    deleteReason: true,
                },
            }),
        ]);
        return {
            data,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        };
    }
    async lookupByPhone(phone) {
        const cleaned = phone.replace(/[\s\-\(\)\+\.]/g, "");
        const normalizedPhone = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
        if (normalizedPhone.length < 10) {
            return { found: false };
        }
        const donor = await this.prisma.donor.findFirst({
            where: {
                isDeleted: false,
                OR: [
                    { primaryPhone: { endsWith: normalizedPhone } },
                    { whatsappPhone: { endsWith: normalizedPhone } },
                ],
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                donorCode: true,
                primaryPhone: true,
                personalEmail: true,
            },
        });
        if (!donor) {
            return { found: false };
        }
        return {
            found: true,
            donor: {
                id: donor.id,
                firstName: donor.firstName,
                lastName: donor.lastName,
                donorCode: donor.donorCode,
                primaryPhone: donor.primaryPhone,
                personalEmail: donor.personalEmail,
            },
        };
    }
    async assignDonor(id, assignedToUserId) {
        await this.getActiveDonorOrThrow(id);
        return this.prisma.donor.update({
            where: { id },
            data: { assignedToUserId },
        });
    }
    async countDonorsByAssignee(userId) {
        return this.prisma.donor.count({
            where: {
                assignedToUserId: userId,
                isDeleted: false,
            },
        });
    }
    async bulkReassignDonors(fromUserId, toUserId) {
        const result = await this.prisma.donor.updateMany({
            where: {
                assignedToUserId: fromUserId,
                isDeleted: false,
            },
            data: {
                assignedToUserId: toUserId,
            },
        });
        return { count: result.count };
    }
};
exports.DonorsCrudService = DonorsCrudService;
exports.DonorsCrudService = DonorsCrudService = DonorsCrudService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        donors_engagement_service_1.DonorsEngagementService])
], DonorsCrudService);
//# sourceMappingURL=donors.crud.service.js.map