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
exports.BeneficiaryDocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BeneficiaryDocumentsService = class BeneficiaryDocumentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDocuments(user, ownerType, ownerId) {
        const where = { ownerType };
        if (ownerId)
            where.ownerId = ownerId;
        return this.prisma.document.findMany({
            where,
            include: {
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async createDocument(user, dto) {
        return this.prisma.document.create({
            data: {
                ...dto,
                createdById: user.id,
            },
        });
    }
    async getDocumentById(user, docId) {
        return this.prisma.document.findUnique({
            where: { id: docId },
        });
    }
};
exports.BeneficiaryDocumentsService = BeneficiaryDocumentsService;
exports.BeneficiaryDocumentsService = BeneficiaryDocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BeneficiaryDocumentsService);
//# sourceMappingURL=beneficiary-documents.service.js.map