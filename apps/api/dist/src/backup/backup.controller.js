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
exports.BackupController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const backup_service_1 = require("./backup.service");
const audit_service_1 = require("../audit/audit.service");
let BackupController = class BackupController {
    constructor(backupService, auditService) {
        this.backupService = backupService;
        this.auditService = auditService;
    }
    async getBackupHistory() {
        return this.backupService.getBackupHistory();
    }
    async createBackup(req, res) {
        const user = req.user;
        const { stream, filename, backupId } = await this.backupService.createBackup(user.id);
        try {
            await this.auditService.log({
                userId: user.id,
                action: client_1.AuditAction.DATA_EXPORT,
                entityType: 'BACKUP',
                entityId: backupId,
                metadata: { filename, type: 'full_backup' },
            });
        }
        catch { }
        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        stream.pipe(res);
    }
    async restoreFromBackup(file, req) {
        if (!file) {
            throw new common_1.BadRequestException('No backup file provided');
        }
        if (!file.originalname.endsWith('.zip')) {
            throw new common_1.BadRequestException('Backup file must be a ZIP archive');
        }
        const user = req.user;
        const result = await this.backupService.restoreFromBackup(file.buffer, user.id);
        try {
            await this.auditService.log({
                userId: user.id,
                action: client_1.AuditAction.DATA_EXPORT,
                entityType: 'BACKUP_RESTORE',
                metadata: {
                    filename: file.originalname,
                    tablesRestored: result.tablesRestored,
                    recordCounts: result.recordCounts,
                    type: 'restore',
                },
            });
        }
        catch { }
        return result;
    }
};
exports.BackupController = BackupController;
__decorate([
    (0, common_1.Get)('history'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "getBackupHistory", null);
__decorate([
    (0, common_1.Post)('create'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "createBackup", null);
__decorate([
    (0, common_1.Post)('restore'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 100 * 1024 * 1024 } })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "restoreFromBackup", null);
exports.BackupController = BackupController = __decorate([
    (0, common_1.Controller)('backup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [backup_service_1.BackupService,
        audit_service_1.AuditService])
], BackupController);
//# sourceMappingURL=backup.controller.js.map