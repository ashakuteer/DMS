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
exports.StaffProfilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const staff_profiles_service_1 = require("./staff-profiles.service");
const FILE_LIMIT = { limits: { fileSize: 5 * 1024 * 1024 } };
let StaffProfilesController = class StaffProfilesController {
    constructor(service) {
        this.service = service;
    }
    findAllHomes() {
        return this.service.findAllHomes();
    }
    createHome(body) {
        return this.service.createHome(body);
    }
    findAll(homeId, designation, status) {
        return this.service.findAll({ homeId, designation, status });
    }
    create(body) {
        return this.service.create(body);
    }
    uploadPhoto(file, staffId) {
        return this.service.uploadPhoto(staffId, file);
    }
    uploadDocument(file, staffId, type) {
        return this.service.uploadDocument(staffId, file, type);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, body) {
        return this.service.update(id, body);
    }
    remove(id) {
        return this.service.remove(id);
    }
    getDocuments(id) {
        return this.service.getDocuments(id);
    }
    deleteDocument(docId) {
        return this.service.deleteDocument(docId);
    }
    getBankDetails(id) {
        return this.service.getBankDetails(id);
    }
    upsertBankDetails(id, body) {
        return this.service.upsertBankDetails(id, body);
    }
};
exports.StaffProfilesController = StaffProfilesController;
__decorate([
    (0, common_1.Get)('homes'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StaffProfilesController.prototype, "findAllHomes", null);
__decorate([
    (0, common_1.Post)('homes'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaffProfilesController.prototype, "createHome", null);
__decorate([
    (0, common_1.Get)('staff-profiles'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('homeId')),
    __param(1, (0, common_1.Query)('designation')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], StaffProfilesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('staff-profiles'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaffProfilesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('staff-profiles/upload-photo'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', FILE_LIMIT)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('staffId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StaffProfilesController.prototype, "uploadPhoto", null);
__decorate([
    (0, common_1.Post)('staff-profiles/upload-document'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', FILE_LIMIT)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('staffId')),
    __param(2, (0, common_1.Body)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], StaffProfilesController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Get)('staff-profiles/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaffProfilesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('staff-profiles/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StaffProfilesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('staff-profiles/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaffProfilesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('staff-profiles/:id/documents'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaffProfilesController.prototype, "getDocuments", null);
__decorate([
    (0, common_1.Delete)('staff-profiles/documents/:docId'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('docId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaffProfilesController.prototype, "deleteDocument", null);
__decorate([
    (0, common_1.Get)('staff-profiles/:id/bank-details'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaffProfilesController.prototype, "getBankDetails", null);
__decorate([
    (0, common_1.Post)('staff-profiles/:id/bank-details'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StaffProfilesController.prototype, "upsertBankDetails", null);
exports.StaffProfilesController = StaffProfilesController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [staff_profiles_service_1.StaffProfilesService])
], StaffProfilesController);
//# sourceMappingURL=staff-profiles.controller.js.map