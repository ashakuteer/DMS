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
exports.TimeMachineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
let TimeMachineService = class TimeMachineService {
    constructor(prisma, storageService) {
        this.prisma = prisma;
        this.storageService = storageService;
    }
    async findAll(params) {
        const { page = 1, limit = 20, category, home, search, year } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (category)
            where.category = category;
        if (home)
            where.home = home;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (year) {
            where.eventDate = {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${year + 1}-01-01`),
            };
        }
        const [entries, total] = await Promise.all([
            this.prisma.timeMachineEntry.findMany({
                where,
                orderBy: { eventDate: 'desc' },
                skip,
                take: limit,
                include: {
                    createdBy: {
                        select: { id: true, name: true },
                    },
                },
            }),
            this.prisma.timeMachineEntry.count({ where }),
        ]);
        return {
            entries,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const entry = await this.prisma.timeMachineEntry.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: { id: true, name: true },
                },
            },
        });
        if (!entry) {
            throw new common_1.NotFoundException(`Time Machine entry ${id} not found`);
        }
        return entry;
    }
    async create(userId, dto) {
        return this.prisma.timeMachineEntry.create({
            data: {
                title: dto.title,
                eventDate: new Date(dto.eventDate),
                description: dto.description,
                category: dto.category,
                home: dto.home,
                isPublic: dto.isPublic ?? false,
                createdById: userId,
            },
            include: {
                createdBy: {
                    select: { id: true, name: true },
                },
            },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.timeMachineEntry.update({
            where: { id },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.eventDate !== undefined && { eventDate: new Date(dto.eventDate) }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.category !== undefined && { category: dto.category }),
                ...(dto.home !== undefined && { home: dto.home }),
                ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
            },
            include: {
                createdBy: {
                    select: { id: true, name: true },
                },
            },
        });
    }
    async remove(id) {
        const entry = await this.findOne(id);
        if (entry.photos && entry.photos.length > 0) {
            for (const photoUrl of entry.photos) {
                await this.storageService.deleteTimeMachinePhoto(photoUrl).catch(() => { });
            }
        }
        await this.prisma.timeMachineEntry.delete({ where: { id } });
        return { success: true };
    }
    async uploadPhoto(id, file) {
        await this.findOne(id);
        const { url } = await this.storageService.uploadTimeMachinePhoto(id, file.buffer, file.mimetype, file.originalname);
        const entry = await this.prisma.timeMachineEntry.update({
            where: { id },
            data: {
                photos: {
                    push: url,
                },
            },
        });
        return { url, photos: entry.photos };
    }
    async deletePhoto(id, photoUrl) {
        const entry = await this.findOne(id);
        const photos = entry.photos.filter((p) => p !== photoUrl);
        await this.storageService.deleteTimeMachinePhoto(photoUrl).catch(() => { });
        await this.prisma.timeMachineEntry.update({
            where: { id },
            data: { photos },
        });
        return { success: true, photos };
    }
    async getAvailableYears() {
        const entries = await this.prisma.timeMachineEntry.findMany({
            select: { eventDate: true },
            orderBy: { eventDate: 'desc' },
        });
        const years = [...new Set(entries.map((e) => e.eventDate.getFullYear()))];
        return years.sort((a, b) => b - a);
    }
};
exports.TimeMachineService = TimeMachineService;
exports.TimeMachineService = TimeMachineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], TimeMachineService);
//# sourceMappingURL=time-machine.service.js.map