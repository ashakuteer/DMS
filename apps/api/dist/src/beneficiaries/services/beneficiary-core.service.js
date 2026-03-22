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
exports.BeneficiaryCoreService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../../audit/audit.service");
const role_permissions_service_1 = require("../../role-permissions/role-permissions.service");
const client_1 = require("@prisma/client");
let BeneficiaryCoreService = class BeneficiaryCoreService {
    constructor(prisma, auditService, rolePermissionsService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.rolePermissionsService = rolePermissionsService;
    }
    async generateBeneficiaryCode() {
        const lastBeneficiary = await this.prisma.beneficiary.findFirst({
            orderBy: { code: "desc" },
            select: { code: true }
        });
        let nextNum = 1;
        if (lastBeneficiary?.code) {
            const match = lastBeneficiary.code.match(/AKF-BEN-(\d+)/);
            if (match)
                nextNum = parseInt(match[1]) + 1;
        }
        return `AKF-BEN-${String(nextNum).padStart(6, "0")}`;
    }
    async quickSearch(q) {
        if (!q || q.trim().length < 2)
            return [];
        return this.prisma.beneficiary.findMany({
            where: {
                isDeleted: false,
                OR: [
                    { fullName: { contains: q.trim(), mode: "insensitive" } },
                    { code: { contains: q.trim(), mode: "insensitive" } },
                ],
            },
            select: { id: true, fullName: true, code: true, homeType: true },
            take: 15,
            orderBy: { code: "asc" },
        });
    }
    async findAll(options) {
        const { page = 1, limit = 20, search, homeType, status, sponsored, classGrade, school, academicYear, } = options;
        const where = { isDeleted: false };
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
            ];
        }
        if (homeType)
            where.homeType = homeType;
        if (status)
            where.status = status;
        if (classGrade)
            where.educationClassOrRole = { contains: classGrade, mode: "insensitive" };
        if (school)
            where.schoolOrCollege = { contains: school, mode: "insensitive" };
        if (sponsored === true)
            where.sponsorships = { some: { isActive: true } };
        if (sponsored === false)
            where.sponsorships = { none: { isActive: true } };
        const [beneficiaries, total] = await Promise.all([
            this.prisma.beneficiary.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    code: true,
                    fullName: true,
                    homeType: true,
                    category: true,
                    gender: true,
                    dobDay: true,
                    dobMonth: true,
                    dobYear: true,
                    approxAge: true,
                    joinDate: true,
                    heightCmAtJoin: true,
                    weightKgAtJoin: true,
                    educationClassOrRole: true,
                    schoolOrCollege: true,
                    healthNotes: true,
                    currentHealthStatus: true,
                    background: true,
                    hobbies: true,
                    dreamCareer: true,
                    favouriteSubject: true,
                    favouriteGame: true,
                    favouriteActivityAtHome: true,
                    bestFriend: true,
                    sourceOfPrideOrHappiness: true,
                    funFact: true,
                    additionalNotes: true,
                    protectPrivacy: true,
                    photoUrl: true,
                    photoPath: true,
                    status: true,
                    createdById: true,
                    isDeleted: true,
                    deletedAt: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: { select: { sponsorships: true } },
                },
            }),
            this.prisma.beneficiary.count({ where }),
        ]);
        const data = beneficiaries.map((b) => {
            const { _count, ...rest } = b;
            return { ...rest, activeSponsorsCount: _count?.sponsorships ?? 0 };
        });
        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findById(id) {
        const beneficiary = await this.prisma.beneficiary.findFirst({
            where: { id, isDeleted: false },
            select: {
                id: true,
                code: true,
                fullName: true,
                homeType: true,
                category: true,
                gender: true,
                dobDay: true,
                dobMonth: true,
                dobYear: true,
                approxAge: true,
                joinDate: true,
                heightCmAtJoin: true,
                weightKgAtJoin: true,
                educationClassOrRole: true,
                schoolOrCollege: true,
                healthNotes: true,
                currentHealthStatus: true,
                background: true,
                hobbies: true,
                dreamCareer: true,
                favouriteSubject: true,
                favouriteGame: true,
                favouriteActivityAtHome: true,
                bestFriend: true,
                sourceOfPrideOrHappiness: true,
                funFact: true,
                additionalNotes: true,
                protectPrivacy: true,
                photoUrl: true,
                photoPath: true,
                status: true,
                createdById: true,
                isDeleted: true,
                deletedAt: true,
                createdAt: true,
                updatedAt: true,
                createdBy: { select: { id: true, name: true } },
                sponsorships: {
                    select: {
                        id: true,
                        donorId: true,
                        beneficiaryId: true,
                        sponsorshipType: true,
                        amount: true,
                        currency: true,
                        inKindItem: true,
                        frequency: true,
                        startDate: true,
                        endDate: true,
                        dueDayOfMonth: true,
                        nextDueDate: true,
                        notes: true,
                        isActive: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                        donor: {
                            select: {
                                id: true,
                                donorCode: true,
                                firstName: true,
                                lastName: true,
                                primaryPhone: true,
                                personalEmail: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
                updates: {
                    select: {
                        id: true,
                        beneficiaryId: true,
                        updateType: true,
                        title: true,
                        content: true,
                        mediaUrls: true,
                        isPrivate: true,
                        shareWithDonor: true,
                        createdById: true,
                        createdAt: true,
                        createdBy: { select: { id: true, name: true } },
                        attachments: {
                            select: {
                                id: true,
                                documentId: true,
                                document: {
                                    select: {
                                        id: true,
                                        title: true,
                                        storagePath: true,
                                        mimeType: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
                timelineEvents: {
                    select: {
                        id: true,
                        beneficiaryId: true,
                        eventType: true,
                        eventDate: true,
                        description: true,
                        createdAt: true,
                    },
                    orderBy: { eventDate: "desc" },
                },
            },
        });
        if (!beneficiary)
            throw new common_1.NotFoundException("Beneficiary not found");
        const activeSponsorsCount = beneficiary.sponsorships.filter((s) => s.isActive && s.status === "ACTIVE").length;
        return {
            ...beneficiary,
            activeSponsorsCount,
            updatesCount: beneficiary.updates.length,
        };
    }
    async create(user, dto) {
        if (!dto.fullName || !dto.homeType) {
            throw new common_1.BadRequestException("Full name and home type required");
        }
        const code = await this.generateBeneficiaryCode();
        const beneficiary = await this.prisma.beneficiary.create({
            data: {
                code,
                fullName: dto.fullName,
                homeType: dto.homeType,
                createdById: user.id
            },
            select: {
                id: true,
                code: true,
                fullName: true,
                homeType: true,
                category: true,
                gender: true,
                dobDay: true,
                dobMonth: true,
                dobYear: true,
                approxAge: true,
                joinDate: true,
                heightCmAtJoin: true,
                weightKgAtJoin: true,
                educationClassOrRole: true,
                schoolOrCollege: true,
                healthNotes: true,
                currentHealthStatus: true,
                background: true,
                hobbies: true,
                dreamCareer: true,
                favouriteSubject: true,
                favouriteGame: true,
                favouriteActivityAtHome: true,
                bestFriend: true,
                sourceOfPrideOrHappiness: true,
                funFact: true,
                additionalNotes: true,
                protectPrivacy: true,
                photoUrl: true,
                photoPath: true,
                status: true,
                createdById: true,
                isDeleted: true,
                deletedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        await this.prisma.beneficiaryTimelineEvent.create({
            data: {
                beneficiaryId: beneficiary.id,
                eventType: client_1.BeneficiaryEventType.PROFILE_CREATED,
                eventDate: new Date(),
                description: `Profile created`
            }
        });
        await this.auditService.logBeneficiaryCreate(user.id, beneficiary.id, beneficiary);
        return beneficiary;
    }
    async update(user, id, dto) {
        const existing = await this.prisma.beneficiary.findFirst({
            where: { id, isDeleted: false },
            select: { id: true },
        });
        if (!existing)
            throw new common_1.NotFoundException("Beneficiary not found");
        const data = {};
        if (dto.fullName !== undefined)
            data.fullName = dto.fullName;
        if (dto.homeType !== undefined)
            data.homeType = dto.homeType;
        if (dto.status !== undefined)
            data.status = dto.status;
        if (dto.gender !== undefined)
            data.gender = dto.gender || null;
        if (dto.dobDay !== undefined)
            data.dobDay = dto.dobDay ?? null;
        if (dto.dobMonth !== undefined)
            data.dobMonth = dto.dobMonth ?? null;
        if (dto.dobYear !== undefined)
            data.dobYear = dto.dobYear ?? null;
        if (dto.approxAge !== undefined)
            data.approxAge = dto.approxAge ?? null;
        if (dto.joinDate !== undefined)
            data.joinDate = dto.joinDate ? new Date(dto.joinDate) : null;
        if (dto.heightCmAtJoin !== undefined)
            data.heightCmAtJoin = dto.heightCmAtJoin ?? null;
        if (dto.weightKgAtJoin !== undefined)
            data.weightKgAtJoin = dto.weightKgAtJoin ?? null;
        if (dto.educationClassOrRole !== undefined)
            data.educationClassOrRole = dto.educationClassOrRole || null;
        if (dto.schoolOrCollege !== undefined)
            data.schoolOrCollege = dto.schoolOrCollege || null;
        if (dto.healthNotes !== undefined)
            data.healthNotes = dto.healthNotes || null;
        if (dto.currentHealthStatus !== undefined)
            data.currentHealthStatus = dto.currentHealthStatus || null;
        if (dto.background !== undefined)
            data.background = dto.background || null;
        if (dto.hobbies !== undefined)
            data.hobbies = dto.hobbies || null;
        if (dto.dreamCareer !== undefined)
            data.dreamCareer = dto.dreamCareer || null;
        if (dto.favouriteSubject !== undefined)
            data.favouriteSubject = dto.favouriteSubject || null;
        if (dto.favouriteGame !== undefined)
            data.favouriteGame = dto.favouriteGame || null;
        if (dto.favouriteActivityAtHome !== undefined)
            data.favouriteActivityAtHome = dto.favouriteActivityAtHome || null;
        if (dto.bestFriend !== undefined)
            data.bestFriend = dto.bestFriend || null;
        if (dto.sourceOfPrideOrHappiness !== undefined)
            data.sourceOfPrideOrHappiness = dto.sourceOfPrideOrHappiness || null;
        if (dto.funFact !== undefined)
            data.funFact = dto.funFact || null;
        if (dto.additionalNotes !== undefined)
            data.additionalNotes = dto.additionalNotes || null;
        return this.prisma.beneficiary.update({ where: { id }, data });
    }
    async updatePhoto(id, url, path) {
        const existing = await this.prisma.beneficiary.findFirst({
            where: { id, isDeleted: false },
            select: { id: true },
        });
        if (!existing)
            throw new common_1.NotFoundException("Beneficiary not found");
        return this.prisma.beneficiary.update({
            where: { id },
            data: { photoUrl: url, photoPath: path },
        });
    }
    async getTimelineEvents(beneficiaryId) {
        return this.prisma.beneficiaryTimelineEvent.findMany({
            where: { beneficiaryId },
            orderBy: { eventDate: "desc" },
        });
    }
    async addTimelineEvent(beneficiaryId, dto) {
        const existing = await this.prisma.beneficiary.findFirst({
            where: { id: beneficiaryId, isDeleted: false },
            select: { id: true },
        });
        if (!existing)
            throw new common_1.NotFoundException("Beneficiary not found");
        return this.prisma.beneficiaryTimelineEvent.create({
            data: {
                beneficiaryId,
                eventType: dto.eventType,
                eventDate: dto.eventDate ? new Date(dto.eventDate) : new Date(),
                description: dto.description || "",
            },
        });
    }
    async delete(user, id, deleteReason) {
        const existing = await this.prisma.beneficiary.findFirst({
            where: { id, isDeleted: false },
            select: { id: true },
        });
        if (!existing)
            throw new common_1.NotFoundException("Beneficiary not found");
        await this.prisma.beneficiary.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: user.id,
                deleteReason: deleteReason ?? null,
            }
        });
        await this.auditService.logBeneficiaryDelete(user.id, id, existing);
        return { success: true };
    }
    async restore(user, id) {
        if (user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException("Only administrators can restore beneficiaries");
        }
        const existing = await this.prisma.beneficiary.findFirst({
            where: { id, isDeleted: true },
            select: { id: true },
        });
        if (!existing)
            throw new common_1.NotFoundException("Archived beneficiary not found");
        await this.prisma.beneficiary.update({
            where: { id },
            data: {
                isDeleted: false,
                deletedAt: null,
                deletedBy: null,
                deleteReason: null,
            },
        });
        return { success: true };
    }
    async findArchived(user, search, page = 1, limit = 20) {
        if (user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException("Only administrators can view archived records");
        }
        const where = { isDeleted: true };
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
            ];
        }
        const [total, data] = await Promise.all([
            this.prisma.beneficiary.count({ where }),
            this.prisma.beneficiary.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { deletedAt: "desc" },
                select: {
                    id: true,
                    code: true,
                    fullName: true,
                    homeType: true,
                    status: true,
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
};
exports.BeneficiaryCoreService = BeneficiaryCoreService;
exports.BeneficiaryCoreService = BeneficiaryCoreService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        role_permissions_service_1.RolePermissionsService])
], BeneficiaryCoreService);
//# sourceMappingURL=beneficiary-core.service.js.map