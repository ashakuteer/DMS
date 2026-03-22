"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NgoDocumentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NgoDocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let NgoDocumentsService = NgoDocumentsService_1 = class NgoDocumentsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(NgoDocumentsService_1.name);
        this.uploadDir = path.join(process.cwd(), 'uploads', 'ngo-documents');
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }
    async findAll(params) {
        const { category, search, expiryStatus, page, limit } = params;
        const where = { isActive: true };
        if (category && category !== 'ALL') {
            where.category = category;
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { fileName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (expiryStatus === 'EXPIRED') {
            where.expiryDate = { lt: new Date() };
        }
        else if (expiryStatus === 'EXPIRING_SOON') {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            where.expiryDate = { gte: new Date(), lte: thirtyDaysFromNow };
        }
        else if (expiryStatus === 'VALID') {
            where.OR = [
                { expiryDate: null },
                { expiryDate: { gt: new Date() } },
            ];
            if (search) {
                where.AND = [
                    {
                        OR: [
                            { title: { contains: search, mode: 'insensitive' } },
                            { description: { contains: search, mode: 'insensitive' } },
                            { fileName: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                    {
                        OR: [
                            { expiryDate: null },
                            { expiryDate: { gt: new Date() } },
                        ],
                    },
                ];
                delete where.OR;
            }
        }
        const [items, total] = await Promise.all([
            this.prisma.ngoDocument.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    uploadedBy: { select: { id: true, name: true } },
                    _count: { select: { versions: true } },
                },
            }),
            this.prisma.ngoDocument.count({ where }),
        ]);
        const stats = await this.getStats();
        return {
            items,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            stats,
        };
    }
    async getStats() {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const [totalDocs, expiredCount, expiringSoonCount, categoryBreakdown] = await Promise.all([
            this.prisma.ngoDocument.count({ where: { isActive: true } }),
            this.prisma.ngoDocument.count({
                where: { isActive: true, expiryDate: { lt: now } },
            }),
            this.prisma.ngoDocument.count({
                where: {
                    isActive: true,
                    expiryDate: { gte: now, lte: thirtyDaysFromNow },
                },
            }),
            this.prisma.ngoDocument.groupBy({
                by: ['category'],
                where: { isActive: true },
                _count: true,
            }),
        ]);
        return {
            totalDocs,
            expiredCount,
            expiringSoonCount,
            validCount: totalDocs - expiredCount - expiringSoonCount,
            categoryBreakdown: categoryBreakdown.map((c) => ({
                category: c.category,
                count: c._count,
            })),
        };
    }
    async findOne(id, userId) {
        const doc = await this.prisma.ngoDocument.findUnique({
            where: { id },
            include: {
                uploadedBy: { select: { id: true, name: true } },
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    include: {
                        uploadedBy: { select: { id: true, name: true } },
                    },
                },
                _count: { select: { versions: true } },
            },
        });
        if (!doc || !doc.isActive) {
            throw new common_1.NotFoundException('Document not found');
        }
        await this.prisma.ngoDocumentAccessLog.create({
            data: { documentId: id, userId, action: 'VIEW' },
        });
        return doc;
    }
    async upload(file, data, userId) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const maxSize = 25 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('File size exceeds 25MB limit');
        }
        const timestamp = Date.now();
        const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storageName = `${timestamp}-${safeFileName}`;
        const filePath = path.join(this.uploadDir, storageName);
        fs.writeFileSync(filePath, file.buffer);
        const doc = await this.prisma.ngoDocument.create({
            data: {
                title: data.title,
                description: data.description || null,
                category: data.category,
                fileName: file.originalname,
                filePath: storageName,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
                uploadedById: userId,
            },
            include: {
                uploadedBy: { select: { id: true, name: true } },
            },
        });
        await this.prisma.ngoDocumentVersion.create({
            data: {
                documentId: doc.id,
                versionNumber: 1,
                fileName: file.originalname,
                filePath: storageName,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                changeNote: 'Initial upload',
                uploadedById: userId,
            },
        });
        await this.prisma.ngoDocumentAccessLog.create({
            data: { documentId: doc.id, userId, action: 'UPLOAD' },
        });
        return doc;
    }
    async uploadNewVersion(id, file, changeNote, userId) {
        const doc = await this.prisma.ngoDocument.findUnique({ where: { id } });
        if (!doc || !doc.isActive) {
            throw new common_1.NotFoundException('Document not found');
        }
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const maxSize = 25 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('File size exceeds 25MB limit');
        }
        const newVersion = doc.currentVersion + 1;
        const timestamp = Date.now();
        const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storageName = `${timestamp}-${safeFileName}`;
        const filePath = path.join(this.uploadDir, storageName);
        fs.writeFileSync(filePath, file.buffer);
        const [updatedDoc] = await this.prisma.$transaction([
            this.prisma.ngoDocument.update({
                where: { id },
                data: {
                    fileName: file.originalname,
                    filePath: storageName,
                    mimeType: file.mimetype,
                    sizeBytes: file.size,
                    currentVersion: newVersion,
                },
                include: {
                    uploadedBy: { select: { id: true, name: true } },
                },
            }),
            this.prisma.ngoDocumentVersion.create({
                data: {
                    documentId: id,
                    versionNumber: newVersion,
                    fileName: file.originalname,
                    filePath: storageName,
                    mimeType: file.mimetype,
                    sizeBytes: file.size,
                    changeNote: changeNote || `Version ${newVersion}`,
                    uploadedById: userId,
                },
            }),
            this.prisma.ngoDocumentAccessLog.create({
                data: { documentId: id, userId, action: 'VERSION_UPLOAD' },
            }),
        ]);
        return updatedDoc;
    }
    async update(id, data, userId) {
        const doc = await this.prisma.ngoDocument.findUnique({ where: { id } });
        if (!doc || !doc.isActive) {
            throw new common_1.NotFoundException('Document not found');
        }
        const updateData = {};
        if (data.title !== undefined)
            updateData.title = data.title;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.category !== undefined)
            updateData.category = data.category;
        if (data.expiryDate !== undefined) {
            updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
        }
        const updated = await this.prisma.ngoDocument.update({
            where: { id },
            data: updateData,
            include: {
                uploadedBy: { select: { id: true, name: true } },
            },
        });
        await this.prisma.ngoDocumentAccessLog.create({
            data: { documentId: id, userId, action: 'UPDATE' },
        });
        return updated;
    }
    async remove(id, userId) {
        const doc = await this.prisma.ngoDocument.findUnique({ where: { id } });
        if (!doc || !doc.isActive) {
            throw new common_1.NotFoundException('Document not found');
        }
        await this.prisma.ngoDocument.update({
            where: { id },
            data: { isActive: false },
        });
        await this.prisma.ngoDocumentAccessLog.create({
            data: { documentId: id, userId, action: 'DELETE' },
        });
        return { message: 'Document deleted' };
    }
    async getFilePath(id, userId, versionId) {
        let filePath;
        let fileName;
        let mimeType;
        if (versionId) {
            const version = await this.prisma.ngoDocumentVersion.findUnique({
                where: { id: versionId },
                include: { document: true },
            });
            if (!version || !version.document.isActive) {
                throw new common_1.NotFoundException('Version not found');
            }
            filePath = version.filePath;
            fileName = version.fileName;
            mimeType = version.mimeType;
        }
        else {
            const doc = await this.prisma.ngoDocument.findUnique({ where: { id } });
            if (!doc || !doc.isActive) {
                throw new common_1.NotFoundException('Document not found');
            }
            filePath = doc.filePath;
            fileName = doc.fileName;
            mimeType = doc.mimeType;
        }
        const fullPath = path.join(this.uploadDir, filePath);
        if (!fs.existsSync(fullPath)) {
            throw new common_1.NotFoundException('File not found on server');
        }
        await this.prisma.ngoDocumentAccessLog.create({
            data: { documentId: id, userId, action: 'DOWNLOAD' },
        });
        return { fullPath, fileName, mimeType };
    }
    async getAccessLog(id) {
        const doc = await this.prisma.ngoDocument.findUnique({ where: { id } });
        if (!doc || !doc.isActive) {
            throw new common_1.NotFoundException('Document not found');
        }
        return this.prisma.ngoDocumentAccessLog.findMany({
            where: { documentId: id },
            orderBy: { accessedAt: 'desc' },
            take: 50,
            include: {
                user: { select: { id: true, name: true } },
            },
        });
    }
    async getExpiringDocuments(daysAhead = 30) {
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + daysAhead);
        return this.prisma.ngoDocument.findMany({
            where: {
                isActive: true,
                expiryDate: { gte: now, lte: future },
            },
            orderBy: { expiryDate: 'asc' },
            include: {
                uploadedBy: { select: { id: true, name: true, email: true } },
            },
        });
    }
    async getExpiredDocuments() {
        return this.prisma.ngoDocument.findMany({
            where: {
                isActive: true,
                expiryDate: { lt: new Date() },
            },
            orderBy: { expiryDate: 'asc' },
            include: {
                uploadedBy: { select: { id: true, name: true, email: true } },
            },
        });
    }
};
exports.NgoDocumentsService = NgoDocumentsService;
exports.NgoDocumentsService = NgoDocumentsService = NgoDocumentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NgoDocumentsService);
//# sourceMappingURL=ngo-documents.service.js.map