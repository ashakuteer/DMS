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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SponsorshipsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SponsorDispatchesController = exports.BeneficiaryUpdatesController = exports.SponsorshipsController = exports.ReportCampaignsController = exports.BeneficiariesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const beneficiaries_service_1 = require("./beneficiaries.service");
const client_1 = require("@prisma/client");
const storage_service_1 = require("../storage/storage.service");
let BeneficiariesController = class BeneficiariesController {
    constructor(beneficiariesService, storageService) {
        this.beneficiariesService = beneficiariesService;
        this.storageService = storageService;
    }
    async findAll(user, page, limit, search, homeType, status, sponsored, classGrade, school, academicYear) {
        return this.beneficiariesService.findAll(user, {
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            search,
            homeType: homeType,
            status: status,
            sponsored: sponsored === 'true' ? true : sponsored === 'false' ? false : undefined,
            classGrade: classGrade || undefined,
            school: school || undefined,
            academicYear: academicYear || undefined,
        });
    }
    async exportExcel(user) {
        return this.beneficiariesService.exportToExcel(user);
    }
    async downloadBulkTemplate() {
        throw new common_1.BadRequestException("Beneficiary bulk template download is disabled.");
    }
    async bulkUpload(user, file, mode) {
        throw new common_1.BadRequestException("Beneficiary bulk upload is disabled.");
    }
    async findArchived(user, search, page, limit) {
        return this.beneficiariesService.findArchived(user, search, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    }
    async quickSearch(q) {
        return this.beneficiariesService.quickSearch(q ?? '');
    }
    async findById(id) {
        return this.beneficiariesService.findById(id);
    }
    async create(user, dto) {
        return this.beneficiariesService.create(user, dto);
    }
    async update(user, id, dto) {
        return this.beneficiariesService.update(user, id, dto);
    }
    async delete(user, id, reason) {
        return this.beneficiariesService.delete(user, id, reason);
    }
    async restore(user, id) {
        return this.beneficiariesService.restore(user, id);
    }
    async uploadPhoto(id, file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const existing = await this.beneficiariesService.findById(id);
        if (existing?.photoPath) {
            await this.storageService.deletePhoto(existing.photoPath);
        }
        const { path, url } = await this.storageService.uploadPhoto(id, file.buffer, file.mimetype, file.originalname);
        await this.beneficiariesService.updatePhoto(id, url, path);
        return { photoUrl: url, photoPath: path };
    }
    async deletePhoto(id) {
        const beneficiary = await this.beneficiariesService.findById(id);
        if (beneficiary?.photoPath) {
            await this.storageService.deletePhoto(beneficiary.photoPath);
        }
        await this.beneficiariesService.updatePhoto(id, null, null);
        return { success: true };
    }
    async linkExistingPhoto(id, body) {
        if (!body.photoUrl || typeof body.photoUrl !== 'string') {
            throw new common_1.BadRequestException('Photo URL is required');
        }
        const url = body.photoUrl.trim();
        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                throw new Error('Invalid protocol');
            }
        }
        catch {
            throw new common_1.BadRequestException('Invalid URL format. Must be a valid https URL.');
        }
        const supabaseUrl = process.env.SUPABASE_URL;
        if (supabaseUrl) {
            const supabaseDomain = new URL(supabaseUrl).hostname;
            const urlDomain = new URL(url).hostname;
            if (urlDomain !== supabaseDomain) {
                throw new common_1.BadRequestException(`Photo URL must be from your Supabase storage (${supabaseDomain}). External URLs are not allowed.`);
            }
        }
        let photoPath = body.photoPath || null;
        if (!photoPath && url.includes('/beneficiary-photos/')) {
            const pathMatch = url.split('/beneficiary-photos/')[1];
            if (pathMatch) {
                photoPath = decodeURIComponent(pathMatch);
            }
        }
        await this.beneficiariesService.updatePhoto(id, url, photoPath);
        return { photoUrl: url, photoPath };
    }
    async getSponsors(id) {
        return this.beneficiariesService.getSponsors(id);
    }
    async addSponsor(user, id, dto) {
        return this.beneficiariesService.addSponsor(user, id, dto);
    }
    async getUpdates(id) {
        return this.beneficiariesService.getUpdates(id);
    }
    async addUpdate(user, id, dto) {
        return this.beneficiariesService.addUpdate(user, id, dto);
    }
    async getTimelineEvents(id) {
        return this.beneficiariesService.getTimelineEvents(id);
    }
    async addTimelineEvent(id, dto) {
        return this.beneficiariesService.addTimelineEvent(id, dto);
    }
    async getMetrics(id) {
        return this.beneficiariesService.getMetrics(id);
    }
    async addMetric(user, id, dto) {
        return this.beneficiariesService.addMetric(user, id, dto);
    }
    async getProgressCards(id) {
        return this.beneficiariesService.getProgressCards(id);
    }
    async addProgressCard(user, id, dto) {
        return this.beneficiariesService.addProgressCard(user, id, dto);
    }
    async getEducationTimeline(id) {
        return this.beneficiariesService.getEducationTimeline(id);
    }
    async exportEducationSummary(id, res) {
        const pdfBuffer = await this.beneficiariesService.exportEducationSummaryPdf(id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="education-summary-${id}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    async getHealthEvents(id) {
        return this.beneficiariesService.getHealthEvents(id);
    }
    async addHealthEvent(user, id, dto) {
        return this.beneficiariesService.addHealthEvent(user, id, dto);
    }
    async notifySponsorsOfHealthEvent(user, eventId) {
        return this.beneficiariesService.sendHealthEventToSponsors(user, eventId);
    }
    async getHealthTimeline(id) {
        return this.beneficiariesService.getHealthTimeline(id);
    }
    async exportHealthHistoryPdf(id, res) {
        const pdfBuffer = await this.beneficiariesService.exportHealthHistoryPdf(id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="health-history-${id}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    async getDocuments(user, id) {
        return this.beneficiariesService.getDocuments(user, 'BENEFICIARY', id);
    }
    async createDocument(user, id, file, body) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const { path: storagePath, url: publicUrl } = await this.storageService.uploadDocument(`documents/beneficiaries/${id}`, file.buffer, file.mimetype, file.originalname);
        const dto = {
            ownerType: 'BENEFICIARY',
            ownerId: id,
            docType: body.docType || 'OTHER',
            title: body.title || file.originalname,
            description: body.description,
            storageBucket: 'uploads',
            storagePath: publicUrl,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            isSensitive: body.isSensitive === 'true' || body.isSensitive === true,
            shareWithDonor: body.shareWithDonor === 'true' || body.shareWithDonor === true,
        };
        return this.beneficiariesService.createDocument(user, dto);
    }
    async getDocument(user, docId) {
        return this.beneficiariesService.getDocumentById(user, docId);
    }
};
exports.BeneficiariesController = BeneficiariesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('homeType')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('sponsored')),
    __param(7, (0, common_1.Query)('classGrade')),
    __param(8, (0, common_1.Query)('school')),
    __param(9, (0, common_1.Query)('academicYear')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('export/excel'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "exportExcel", null);
__decorate([
    (0, common_1.Get)("bulk-template"),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "downloadBulkTemplate", null);
__decorate([
    (0, common_1.Post)("bulk-upload"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.includes("spreadsheet") ||
                file.mimetype.includes("excel") ||
                file.originalname.endsWith(".xlsx")) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException("Only .xlsx files are allowed"), false);
            }
        },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Query)("mode")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "bulkUpload", null);
__decorate([
    (0, common_1.Get)("archived"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("search")),
    __param(2, (0, common_1.Query)("page")),
    __param(3, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "findArchived", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "quickSearch", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)(':id/photo'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                return callback(new common_1.BadRequestException('Only image files are allowed'), false);
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "uploadPhoto", null);
__decorate([
    (0, common_1.Delete)(':id/photo'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "deletePhoto", null);
__decorate([
    (0, common_1.Post)(':id/photo/link'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "linkExistingPhoto", null);
__decorate([
    (0, common_1.Get)(':id/sponsors'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "getSponsors", null);
__decorate([
    (0, common_1.Post)(':id/sponsors'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "addSponsor", null);
__decorate([
    (0, common_1.Get)(':id/updates'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "getUpdates", null);
__decorate([
    (0, common_1.Post)(':id/updates'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "addUpdate", null);
__decorate([
    (0, common_1.Get)(':id/timeline'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "getTimelineEvents", null);
__decorate([
    (0, common_1.Post)(':id/timeline'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "addTimelineEvent", null);
__decorate([
    (0, common_1.Get)(':id/metrics'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Post)(':id/metrics'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "addMetric", null);
__decorate([
    (0, common_1.Get)(':id/progress-cards'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "getProgressCards", null);
__decorate([
    (0, common_1.Post)(':id/progress-cards'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "addProgressCard", null);
__decorate([
    (0, common_1.Get)(':id/education-timeline'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "getEducationTimeline", null);
__decorate([
    (0, common_1.Get)(':id/education-summary/export'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "exportEducationSummary", null);
__decorate([
    (0, common_1.Get)(':id/health-events'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "getHealthEvents", null);
__decorate([
    (0, common_1.Post)(':id/health-events'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "addHealthEvent", null);
__decorate([
    (0, common_1.Post)('health-events/:eventId/notify-sponsors'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "notifySponsorsOfHealthEvent", null);
__decorate([
    (0, common_1.Get)(':id/health-timeline'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "getHealthTimeline", null);
__decorate([
    (0, common_1.Get)(':id/health-history/export'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "exportHealthHistoryPdf", null);
__decorate([
    (0, common_1.Get)(':id/documents'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "getDocuments", null);
__decorate([
    (0, common_1.Post)(':id/documents'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "createDocument", null);
__decorate([
    (0, common_1.Get)('documents/:docId'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('docId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "getDocument", null);
exports.BeneficiariesController = BeneficiariesController = __decorate([
    (0, common_1.Controller)('beneficiaries'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [beneficiaries_service_1.BeneficiariesService,
        storage_service_1.StorageService])
], BeneficiariesController);
let ReportCampaignsController = class ReportCampaignsController {
    constructor(beneficiariesService) {
        this.beneficiariesService = beneficiariesService;
    }
    async findAll() {
        return this.beneficiariesService.getReportCampaigns();
    }
    async create(user, dto) {
        return this.beneficiariesService.createReportCampaign(user, dto);
    }
    async sendEmails(user, id) {
        return this.beneficiariesService.queueReportCampaignEmails(user, id);
    }
};
exports.ReportCampaignsController = ReportCampaignsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportCampaignsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportCampaignsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReportCampaignsController.prototype, "sendEmails", null);
exports.ReportCampaignsController = ReportCampaignsController = __decorate([
    (0, common_1.Controller)('report-campaigns'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [beneficiaries_service_1.BeneficiariesService])
], ReportCampaignsController);
let SponsorshipsController = SponsorshipsController_1 = class SponsorshipsController {
    constructor(beneficiariesService) {
        this.beneficiariesService = beneficiariesService;
        this.logger = new common_1.Logger(SponsorshipsController_1.name);
    }
    async getDue(window) {
        const windowDays = parseInt(window || '7', 10);
        return this.beneficiariesService.getDueSponsorships(windowDays);
    }
    async getSummary() {
        return this.beneficiariesService.getSponsorshipSummary();
    }
    async getByDonor(donorId) {
        return this.beneficiariesService.getDonorSponsorships(donorId);
    }
    async getByBeneficiary(beneficiaryId) {
        return this.beneficiariesService.getSponsorshipsByBeneficiary(beneficiaryId);
    }
    async create(user, dto) {
        this.logger.log(`POST /api/sponsorships - body: ${JSON.stringify(dto)}`);
        return this.beneficiariesService.createSponsorshipForDonor(user, dto);
    }
    async update(user, id, dto) {
        return this.beneficiariesService.updateSponsorship(user, id, dto);
    }
    async delete(id) {
        return this.beneficiariesService.deleteSponsorship(id);
    }
    async sendUpdate(user, id) {
        return this.beneficiariesService.sendUpdateToSponsor(user.id, id);
    }
    async markPaid(user, id, body) {
        return this.beneficiariesService.markSponsorshipPaid(user, id, body);
    }
    async sendEmail(user, id) {
        return this.beneficiariesService.sendSponsorshipReminderEmail(id);
    }
    async queueEmail(id) {
        return this.beneficiariesService.queueSponsorshipReminderEmail(id);
    }
    async skip(user, id) {
        return this.beneficiariesService.skipSponsorshipMonth(user, id);
    }
    async getHistory(id) {
        return this.beneficiariesService.getSponsorshipHistory(id);
    }
};
exports.SponsorshipsController = SponsorshipsController;
__decorate([
    (0, common_1.Get)('due'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('window')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SponsorshipsController.prototype, "getDue", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SponsorshipsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('donor/:donorId'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('donorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SponsorshipsController.prototype, "getByDonor", null);
__decorate([
    (0, common_1.Get)('beneficiary/:beneficiaryId'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('beneficiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SponsorshipsController.prototype, "getByBeneficiary", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SponsorshipsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SponsorshipsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SponsorshipsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/send-update'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SponsorshipsController.prototype, "sendUpdate", null);
__decorate([
    (0, common_1.Post)(':id/mark-paid'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SponsorshipsController.prototype, "markPaid", null);
__decorate([
    (0, common_1.Post)(':id/send-email'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SponsorshipsController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Post)(':id/queue-email'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SponsorshipsController.prototype, "queueEmail", null);
__decorate([
    (0, common_1.Post)(':id/skip'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SponsorshipsController.prototype, "skip", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SponsorshipsController.prototype, "getHistory", null);
exports.SponsorshipsController = SponsorshipsController = SponsorshipsController_1 = __decorate([
    (0, common_1.Controller)('sponsorships'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [beneficiaries_service_1.BeneficiariesService])
], SponsorshipsController);
let BeneficiaryUpdatesController = class BeneficiaryUpdatesController {
    constructor(beneficiariesService) {
        this.beneficiariesService = beneficiariesService;
    }
    async delete(id) {
        return this.beneficiariesService.deleteUpdate(id);
    }
    async getSponsorsForUpdate(id) {
        const update = await this.beneficiariesService.getUpdateWithBeneficiary(id);
        const sponsors = await this.beneficiariesService.getSponsorsForUpdate(update.beneficiaryId);
        return {
            update: {
                id: update.id,
                title: update.title,
                content: update.content,
                updateType: update.updateType,
                isPrivate: update.isPrivate,
            },
            sponsors,
        };
    }
    async sendToSponsors(user, id, body) {
        return this.beneficiariesService.sendUpdateToSponsors(user, id);
    }
};
exports.BeneficiaryUpdatesController = BeneficiaryUpdatesController;
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiaryUpdatesController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)(':id/sponsors'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BeneficiaryUpdatesController.prototype, "getSponsorsForUpdate", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BeneficiaryUpdatesController.prototype, "sendToSponsors", null);
exports.BeneficiaryUpdatesController = BeneficiaryUpdatesController = __decorate([
    (0, common_1.Controller)('beneficiary-updates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [beneficiaries_service_1.BeneficiariesService])
], BeneficiaryUpdatesController);
let SponsorDispatchesController = class SponsorDispatchesController {
    constructor(beneficiariesService) {
        this.beneficiariesService = beneficiariesService;
    }
    async markCopied(id) {
        return this.beneficiariesService.markDispatchCopied(id);
    }
};
exports.SponsorDispatchesController = SponsorDispatchesController;
__decorate([
    (0, common_1.Patch)(':id/copied'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SponsorDispatchesController.prototype, "markCopied", null);
exports.SponsorDispatchesController = SponsorDispatchesController = __decorate([
    (0, common_1.Controller)('sponsor-dispatches'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [beneficiaries_service_1.BeneficiariesService])
], SponsorDispatchesController);
//# sourceMappingURL=beneficiaries.controller.js.map