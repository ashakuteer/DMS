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
exports.TimeMachineController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const time_machine_service_1 = require("./time-machine.service");
const time_machine_dto_1 = require("./time-machine.dto");
const client_1 = require("@prisma/client");
let TimeMachineController = class TimeMachineController {
    constructor(timeMachineService) {
        this.timeMachineService = timeMachineService;
    }
    async findAll(page, limit, category, home, search, year) {
        return this.timeMachineService.findAll({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            category,
            home,
            search,
            year: year ? parseInt(year, 10) : undefined,
        });
    }
    async getAvailableYears() {
        return this.timeMachineService.getAvailableYears();
    }
    async findOne(id) {
        return this.timeMachineService.findOne(id);
    }
    async create(user, dto) {
        return this.timeMachineService.create(user.id, dto);
    }
    async update(id, dto) {
        return this.timeMachineService.update(id, dto);
    }
    async remove(id) {
        return this.timeMachineService.remove(id);
    }
    async uploadPhoto(id, file) {
        if (!file) {
            throw new common_1.BadRequestException('No photo uploaded');
        }
        return this.timeMachineService.uploadPhoto(id, file);
    }
    async deletePhoto(id, body) {
        if (!body.photoUrl) {
            throw new common_1.BadRequestException('photoUrl is required');
        }
        return this.timeMachineService.deletePhoto(id, body.photoUrl);
    }
};
exports.TimeMachineController = TimeMachineController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('home')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], TimeMachineController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('years'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TimeMachineController.prototype, "getAvailableYears", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TimeMachineController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, time_machine_dto_1.CreateTimeMachineEntryDto]),
    __metadata("design:returntype", Promise)
], TimeMachineController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, time_machine_dto_1.UpdateTimeMachineEntryDto]),
    __metadata("design:returntype", Promise)
], TimeMachineController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TimeMachineController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/photos'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Only jpg, jpeg, png, webp files are allowed'), false);
            }
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TimeMachineController.prototype, "uploadPhoto", null);
__decorate([
    (0, common_1.Delete)(':id/photos'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TimeMachineController.prototype, "deletePhoto", null);
exports.TimeMachineController = TimeMachineController = __decorate([
    (0, common_1.Controller)('time-machine'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [time_machine_service_1.TimeMachineService])
], TimeMachineController);
//# sourceMappingURL=time-machine.controller.js.map