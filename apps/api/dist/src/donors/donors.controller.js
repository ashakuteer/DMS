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
exports.DonorsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const donors_service_1 = require("./donors.service");
const donor_duplicates_service_1 = require("./donor-duplicates.service");
const donor_fundraising_service_1 = require("./donor-fundraising.service");
const beneficiaries_service_1 = require("../beneficiaries/beneficiaries.service");
const client_1 = require("@prisma/client");
let DonorsController = class DonorsController {
    constructor(donorsService, donorDuplicatesService, donorFundraisingService, beneficiariesService) {
        this.donorsService = donorsService;
        this.donorDuplicatesService = donorDuplicatesService;
        this.donorFundraisingService = donorFundraisingService;
        this.beneficiariesService = beneficiariesService;
    }
    getClientInfo(req) {
        const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.socket?.remoteAddress ||
            "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";
        return { ipAddress, userAgent };
    }
    async findAll(user, page, limit, search, sortBy, sortOrder, category, city, country, religion, assignedToUserId, donationFrequency, healthStatus, supportPreferences) {
        return this.donorsService.findAll(user, {
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            search,
            sortBy,
            sortOrder,
            category,
            city,
            country,
            religion,
            assignedToUserId,
            donationFrequency,
            healthStatus,
            supportPreferences,
        });
    }
    async checkDuplicate(phone, email) {
        return this.donorsService.checkDuplicate(phone, email);
    }
    async lookupByPhone(phone) {
        if (!phone) {
            throw new common_1.BadRequestException("Phone number is required");
        }
        return this.donorsService.lookupByPhone(phone);
    }
    async downloadBulkTemplate(res) {
        const buffer = await this.donorsService.generateBulkTemplate();
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", 'attachment; filename="donor-import-template.xlsx"');
        res.send(buffer);
    }
    async bulkUpload(user, file, mode, req) {
        if (!file) {
            throw new common_1.BadRequestException("No file uploaded");
        }
        const { ipAddress, userAgent } = this.getClientInfo(req);
        const uploadMode = mode === "insert_only" ? "insert_only" : "upsert";
        return this.donorsService.bulkUpload(file, user, uploadMode, ipAddress, userAgent);
    }
    async exportDonors(user, search, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donorsService.exportDonors(user, { search }, ipAddress, userAgent);
    }
    async exportMasterDonorExcel(user, home, donorType, activity, req, res) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        const buffer = await this.donorsService.exportMasterDonorExcel(user, { home, donorType, activity }, ipAddress, userAgent);
        const filename = `master-donor-export-${new Date().toISOString().split("T")[0]}.xlsx`;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async findDuplicates() {
        throw new common_1.BadRequestException("Duplicate donor listing is not implemented in DuplicatesService yet");
    }
    async mergeDuplicates() {
        throw new common_1.BadRequestException("Duplicate donor merge is not implemented in DuplicatesService yet");
    }
    async bulkReassignDonors(body) {
        if (!body.fromUserId || !body.toUserId) {
            throw new common_1.BadRequestException("fromUserId and toUserId are required");
        }
        if (body.fromUserId === body.toUserId) {
            throw new common_1.BadRequestException("Source and target staff cannot be the same");
        }
        return this.donorsService.bulkReassignDonors(body.fromUserId, body.toUserId);
    }
    async countDonorsByAssignee(userId) {
        const count = await this.donorsService.countDonorsByAssignee(userId);
        return { count };
    }
    async findArchived(user, search, page, limit) {
        return this.donorsService.findArchived(user, search, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    }
    async findOne(user, id) {
        return this.donorsService.findOne(user, id);
    }
    async create(user, data, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donorsService.create(user, data, ipAddress, userAgent);
    }
    async update(user, id, data, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donorsService.update(user, id, data, ipAddress, userAgent);
    }
    async remove(user, id, req, reason) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donorsService.softDelete(user, id, reason, ipAddress, userAgent);
    }
    async restore(user, id) {
        return this.donorsService.restore(user, id);
    }
    async requestFullAccess(user, id, reason, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donorsService.requestFullAccess(user, id, reason, ipAddress, userAgent);
    }
    async parseImportFile(file) {
        if (!file) {
            throw new common_1.BadRequestException("No file uploaded");
        }
        return this.donorsService.parseImportFile(file);
    }
    async detectDuplicates(data) {
        return this.donorsService.detectDuplicatesInBatch(data.rows, data.columnMapping);
    }
    async executeBulkImport(user, data, req) {
        const { ipAddress, userAgent } = this.getClientInfo(req);
        return this.donorsService.executeBulkImport(user, data.rows, data.columnMapping, data.actions, ipAddress, userAgent);
    }
    async getDonorSponsorships(id) {
        return this.beneficiariesService.getDonorSponsorships(id);
    }
    async getTimeline(user, id, page, limit, startDate, endDate, types) {
        return this.donorsService.getTimeline(user, id, {
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            startDate,
            endDate,
            types: types ? types.split(",") : undefined,
        });
    }
    async assignTelecaller(user, donorId, assignedToUserId, req) {
        const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.socket?.remoteAddress ||
            "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";
        return this.donorsService.assignTelecaller(user, donorId, assignedToUserId, ipAddress, userAgent);
    }
    async assignDonor(id, body) {
        return this.donorsService.assignDonor(id, body.assignedToUserId);
    }
    async getHealthScore(id) {
        return this.donorFundraisingService.getHealthScore(id);
    }
    async getPrediction(id) {
        return this.donorFundraisingService.getPrediction(id);
    }
    async uploadPhoto(user, id, file) {
        if (!file) {
            throw new common_1.BadRequestException("No photo uploaded");
        }
        return this.donorsService.uploadPhoto(user, id, file);
    }
};
exports.DonorsController = DonorsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __param(3, (0, common_1.Query)("search")),
    __param(4, (0, common_1.Query)("sortBy")),
    __param(5, (0, common_1.Query)("sortOrder")),
    __param(6, (0, common_1.Query)("category")),
    __param(7, (0, common_1.Query)("city")),
    __param(8, (0, common_1.Query)("country")),
    __param(9, (0, common_1.Query)("religion")),
    __param(10, (0, common_1.Query)("assignedToUserId")),
    __param(11, (0, common_1.Query)("donationFrequency")),
    __param(12, (0, common_1.Query)("healthStatus")),
    __param(13, (0, common_1.Query)("supportPreferences")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("check-duplicate"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)("phone")),
    __param(1, (0, common_1.Query)("email")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "checkDuplicate", null);
__decorate([
    (0, common_1.Get)("lookup"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)("phone")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "lookupByPhone", null);
__decorate([
    (0, common_1.Get)("bulk-template"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "downloadBulkTemplate", null);
__decorate([
    (0, common_1.Post)("bulk-upload"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (file.mimetype ===
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                file.originalname.match(/\.xlsx$/i)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException("Only Excel (.xlsx) files are allowed"), false);
            }
        },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Query)("mode")),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "bulkUpload", null);
__decorate([
    (0, common_1.Get)("export"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("search")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "exportDonors", null);
__decorate([
    (0, common_1.Get)("export/master-excel"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("home")),
    __param(2, (0, common_1.Query)("donorType")),
    __param(3, (0, common_1.Query)("activity")),
    __param(4, (0, common_1.Req)()),
    __param(5, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "exportMasterDonorExcel", null);
__decorate([
    (0, common_1.Get)("duplicates"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "findDuplicates", null);
__decorate([
    (0, common_1.Post)("duplicates/merge"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "mergeDuplicates", null);
__decorate([
    (0, common_1.Post)("bulk-reassign"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "bulkReassignDonors", null);
__decorate([
    (0, common_1.Get)("count-by-assignee/:userId"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "countDonorsByAssignee", null);
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
], DonorsController.prototype, "findArchived", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Body)("reason")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, String]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(":id/restore"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)(":id/request-access"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("reason")),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "requestFullAccess", null);
__decorate([
    (0, common_1.Post)("bulk-import/parse"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowedMimes = [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
                "text/csv",
            ];
            if (allowedMimes.includes(file.mimetype) ||
                file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException("Only Excel (.xlsx, .xls) and CSV files are allowed"), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "parseImportFile", null);
__decorate([
    (0, common_1.Post)("bulk-import/detect-duplicates"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "detectDuplicates", null);
__decorate([
    (0, common_1.Post)("bulk-import/execute"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "executeBulkImport", null);
__decorate([
    (0, common_1.Get)(":id/sponsorships"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "getDonorSponsorships", null);
__decorate([
    (0, common_1.Get)(":id/timeline"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("page")),
    __param(3, (0, common_1.Query)("limit")),
    __param(4, (0, common_1.Query)("startDate")),
    __param(5, (0, common_1.Query)("endDate")),
    __param(6, (0, common_1.Query)("types")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "getTimeline", null);
__decorate([
    (0, common_1.Patch)(":id/assign-telecaller"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("assignedToUserId")),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "assignTelecaller", null);
__decorate([
    (0, common_1.Patch)(":id/assign"),
    (0, permissions_decorator_1.RequirePermission)("donors", "assign"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "assignDonor", null);
__decorate([
    (0, common_1.Get)(":id/health-score"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "getHealthScore", null);
__decorate([
    (0, common_1.Get)(":id/prediction"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "getPrediction", null);
__decorate([
    (0, common_1.Post)(":id/upload-photo"),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("photo", {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 3 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException("Only jpg, jpeg, png, webp files are allowed"), false);
            }
        },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DonorsController.prototype, "uploadPhoto", null);
exports.DonorsController = DonorsController = __decorate([
    (0, common_1.Controller)("donors"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => beneficiaries_service_1.BeneficiariesService))),
    __metadata("design:paramtypes", [donors_service_1.DonorsService,
        donor_duplicates_service_1.DuplicatesService,
        donor_fundraising_service_1.DonorFundraisingService,
        beneficiaries_service_1.BeneficiariesService])
], DonorsController);
//# sourceMappingURL=donors.controller.js.map