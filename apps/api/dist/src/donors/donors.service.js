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
exports.DonorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const donors_crud_service_1 = require("./donors.crud.service");
const donors_import_service_1 = require("./import/donors-import.service");
const donors_export_service_1 = require("./donors.export.service");
const storage_service_1 = require("../storage/storage.service");
const donors_timeline_service_1 = require("./donors.timeline.service");
let DonorsService = class DonorsService {
    constructor(prisma, auditService, storageService, crud, importService, exportService, timelineService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.storageService = storageService;
        this.crud = crud;
        this.importService = importService;
        this.exportService = exportService;
        this.timelineService = timelineService;
    }
    async getActiveDonorOrThrow(id) {
        const donor = await this.prisma.donor.findFirst({
            where: { id, isDeleted: false },
            select: { id: true, profilePicUrl: true, assignedToUserId: true },
        });
        if (!donor) {
            throw new common_1.NotFoundException("Donor not found");
        }
        return donor;
    }
    findAll(user, options = {}) {
        return this.crud.findAll(user, options);
    }
    findOne(user, id) {
        return this.crud.findOne(user, id);
    }
    lookupByPhone(phone) {
        return this.crud.lookupByPhone(phone);
    }
    create(user, data, ipAddress, userAgent) {
        return this.crud.create(user, data, ipAddress, userAgent);
    }
    update(user, id, data, ipAddress, userAgent) {
        return this.crud.update(user, id, data, ipAddress, userAgent);
    }
    softDelete(user, id, deleteReason, ipAddress, userAgent) {
        return this.crud.softDelete(user, id, deleteReason, ipAddress, userAgent);
    }
    restore(user, id) {
        return this.crud.restore(user, id);
    }
    findArchived(user, search, page, limit) {
        return this.crud.findArchived(user, search, page, limit);
    }
    assignDonor(id, assignedToUserId) {
        return this.crud.assignDonor(id, assignedToUserId);
    }
    bulkReassignDonors(fromUserId, toUserId) {
        return this.crud.bulkReassignDonors(fromUserId, toUserId);
    }
    countDonorsByAssignee(userId) {
        return this.crud.countDonorsByAssignee(userId);
    }
    getTimeline(user, donorId, options = {}) {
        return this.timelineService.getTimeline(user, donorId, options);
    }
    parseImportFile(file) {
        return this.importService.parseImportFile(file);
    }
    detectDuplicatesInBatch(rows, columnMapping) {
        return this.importService.detectDuplicates(rows, columnMapping);
    }
    executeBulkImport(user, rows, columnMapping, actions, ipAddress, userAgent) {
        return this.importService.executeBulkImport(user, rows, columnMapping, actions);
    }
    generateBulkTemplate() {
        throw new common_1.NotFoundException("Bulk template generation is not implemented yet");
    }
    bulkUpload(file, user, mode = "upsert", ipAddress, userAgent) {
        return this.importService.bulkUpload(file, user);
    }
    exportDonors(user, filters = {}, ipAddress, userAgent) {
        return this.exportService.exportDonors(user, filters, ipAddress, userAgent);
    }
    exportMasterDonorExcel(user, filters = {}, ipAddress, userAgent) {
        return this.exportService.exportMasterDonorExcel(user, filters, ipAddress, userAgent);
    }
    async uploadPhoto(user, id, file) {
        const donor = await this.getActiveDonorOrThrow(id);
        if (donor.profilePicUrl) {
            await this.storageService.deleteDonorPhoto(donor.profilePicUrl);
        }
        const { url } = await this.storageService.uploadDonorPhoto(id, file.buffer, file.mimetype, file.originalname);
        await this.prisma.donor.update({
            where: { id },
            data: { profilePicUrl: url },
        });
        return { profilePicUrl: url };
    }
    async requestFullAccess(user, donorId, reason, ipAddress, userAgent) {
        await this.getActiveDonorOrThrow(donorId);
        await this.auditService.logFullAccessRequest(user.id, donorId, reason, ipAddress, userAgent);
        return {
            success: true,
            message: "Full access request has been logged for admin review",
        };
    }
    async checkDuplicate(phone, email) {
        if (!phone && !email) {
            return { duplicates: [] };
        }
        const conditions = [];
        if (phone) {
            conditions.push({ primaryPhone: phone });
            conditions.push({ alternatePhone: phone });
            conditions.push({ whatsappPhone: phone });
        }
        if (email) {
            conditions.push({
                personalEmail: { equals: email, mode: "insensitive" },
            });
            conditions.push({
                officialEmail: { equals: email, mode: "insensitive" },
            });
        }
        const duplicates = await this.prisma.donor.findMany({
            where: {
                isDeleted: false,
                OR: conditions,
            },
            select: {
                id: true,
                donorCode: true,
                firstName: true,
                lastName: true,
                primaryPhone: true,
                personalEmail: true,
            },
            take: 5,
        });
        return { duplicates };
    }
    async assignTelecaller(user, donorId, assignedToUserId, ipAddress, userAgent) {
        const donor = await this.getActiveDonorOrThrow(donorId);
        const oldAssignee = donor.assignedToUserId;
        const updated = await this.prisma.donor.update({
            where: { id: donorId },
            data: { assignedToUserId },
        });
        if (oldAssignee !== assignedToUserId) {
            await this.auditService.logDonorAssignmentChange(user.id, donorId, oldAssignee, assignedToUserId, ipAddress, userAgent);
        }
        return updated;
    }
};
exports.DonorsService = DonorsService;
exports.DonorsService = DonorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        storage_service_1.StorageService,
        donors_crud_service_1.DonorsCrudService,
        donors_import_service_1.DonorsImportService,
        donors_export_service_1.DonorsExportService,
        donors_timeline_service_1.DonorsTimelineService])
], DonorsService);
//# sourceMappingURL=donors.service.js.map