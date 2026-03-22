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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportCampaignsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const report_campaigns_service_1 = require("./report-campaigns.service");
const storage_service_1 = require("../storage/storage.service");
let ReportCampaignsController = class ReportCampaignsController {
    constructor(service, storageService) {
        this.service = service;
        this.storageService = storageService;
    }
    async findAll() {
        return this.service.findAll();
    }
    async searchDonors(query) {
        return this.service.searchDonors(query || '');
    }
    async findOne(id) {
        return this.service.findOne(id);
    }
    async getCampaignDonors(id) {
        return this.service.getCampaignDonors(id);
    }
    async create(body, user) {
        if (!body.name || !body.periodStart || !body.periodEnd) {
            throw new common_1.BadRequestException('Name, period start, and period end are required');
        }
        return this.service.create({
            name: body.name,
            type: body.type || 'QUARTERLY',
            periodStart: body.periodStart,
            periodEnd: body.periodEnd,
            target: body.target || 'ALL_DONORS',
            customDonorIds: body.customDonorIds,
            notes: body.notes,
        }, user);
    }
    async attachDocument(id, file, body, user) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const { path: storagePath, url: publicUrl } = await this.storageService.uploadDocument(`documents/reports/${id}`, file.buffer, file.mimetype, file.originalname);
        return this.service.attachDocument(id, {
            title: body.title || file.originalname,
            storagePath: publicUrl,
            storageBucket: 'uploads',
            mimeType: file.mimetype,
            sizeBytes: file.size,
        }, user);
    }
    async send(id, user) {
        return this.service.send(id, user);
    }
    async getWhatsAppText(id) {
        return this.service.getWhatsAppText(id);
    }
    async markWhatsAppSent(id, donorId, user) {
        return this.service.markWhatsAppSent(id, donorId, user);
    }
};
exports.ReportCampaignsController = ReportCampaignsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportCampaignsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search-donors'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportCampaignsController.prototype, "searchDonors", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportCampaignsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/donors'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportCampaignsController.prototype, "getCampaignDonors", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportCampaignsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/attach-document'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 25 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'application/pdf') {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Only PDF files are allowed'), false);
            }
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportCampaignsController.prototype, "attachDocument", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportCampaignsController.prototype, "send", null);
__decorate([
    (0, common_1.Get)(':id/whatsapp-text'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportCampaignsController.prototype, "getWhatsAppText", null);
__decorate([
    (0, common_1.Post)(':id/whatsapp-sent/:donorId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('donorId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportCampaignsController.prototype, "markWhatsAppSent", null);
exports.ReportCampaignsController = ReportCampaignsController = __decorate([
    (0, common_1.Controller)('report-campaigns'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:paramtypes", [report_campaigns_service_1.ReportCampaignsService,
        storage_service_1.StorageService])
], ReportCampaignsController);
//# sourceMappingURL=report-campaigns.controller.js.map