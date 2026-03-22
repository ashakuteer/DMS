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
exports.StaffProfilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
let StaffProfilesService = class StaffProfilesService {
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    async findAll(params) {
        const where = {};
        if (params.homeId)
            where.homeId = params.homeId;
        if (params.status)
            where.status = params.status;
        if (params.designation) {
            where.designation = { contains: params.designation, mode: 'insensitive' };
        }
        return this.prisma.staff.findMany({
            where,
            include: { home: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const staff = await this.prisma.staff.findUnique({
            where: { id },
            include: {
                home: true,
                documents: { orderBy: { createdAt: 'desc' } },
                bankDetails: true,
            },
        });
        if (!staff)
            throw new common_1.NotFoundException('Staff member not found');
        return staff;
    }
    async create(data) {
        return this.prisma.staff.create({
            data,
            include: { home: true },
        });
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.staff.update({
            where: { id },
            data,
            include: { home: true, bankDetails: true },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.staff.delete({ where: { id } });
    }
    async uploadPhoto(staffId, file) {
        await this.findOne(staffId);
        const { url } = await this.storage.uploadStaffPhoto(staffId, file.buffer, file.mimetype, file.originalname);
        return this.prisma.staff.update({
            where: { id: staffId },
            data: { profilePhotoUrl: url },
            select: { id: true, profilePhotoUrl: true },
        });
    }
    async uploadDocument(staffId, file, docType) {
        await this.findOne(staffId);
        const { url } = await this.storage.uploadStaffDocument(staffId, file.buffer, file.mimetype, file.originalname, docType);
        return this.prisma.staffDocument.create({
            data: {
                staffId,
                type: docType,
                fileUrl: url,
            },
        });
    }
    async getDocuments(staffId) {
        return this.prisma.staffDocument.findMany({
            where: { staffId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async deleteDocument(docId) {
        return this.prisma.staffDocument.delete({ where: { id: docId } });
    }
    async getBankDetails(staffId) {
        return this.prisma.staffBankDetails.findUnique({ where: { staffId } });
    }
    async upsertBankDetails(staffId, data) {
        await this.findOne(staffId);
        return this.prisma.staffBankDetails.upsert({
            where: { staffId },
            create: { staffId, ...data },
            update: data,
        });
    }
    async findAllHomes() {
        return this.prisma.home.findMany({ orderBy: { name: 'asc' } });
    }
    async createHome(data) {
        return this.prisma.home.create({ data });
    }
};
exports.StaffProfilesService = StaffProfilesService;
exports.StaffProfilesService = StaffProfilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], StaffProfilesService);
//# sourceMappingURL=staff-profiles.service.js.map