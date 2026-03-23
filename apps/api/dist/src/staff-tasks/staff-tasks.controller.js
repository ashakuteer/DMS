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
exports.StaffTasksController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const staff_tasks_service_1 = require("./staff-tasks.service");
let StaffTasksController = class StaffTasksController {
    constructor(staffTasksService) {
        this.staffTasksService = staffTasksService;
    }
    isAdminOrManager(role) {
        return role === client_1.Role.FOUNDER || role === client_1.Role.ADMIN;
    }
    async findAll(status, priority, assignedToId, category, search, page, limit, isRecurring, req) {
        const filters = {
            status,
            priority,
            category,
            search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        };
        if (isRecurring !== undefined && isRecurring !== '') {
            filters.isRecurring = isRecurring === 'true';
        }
        if (this.isAdminOrManager(req.user.role)) {
            filters.assignedToId = assignedToId || undefined;
        }
        else {
            filters.assignedToId = req.user.id;
        }
        return this.staffTasksService.findAll(filters);
    }
    async getStats(userId, req) {
        if (this.isAdminOrManager(req.user.role)) {
            return this.staffTasksService.getStats(userId || undefined);
        }
        return this.staffTasksService.getStats(req.user.id);
    }
    async getStaffList() {
        return this.staffTasksService.getStaffList();
    }
    async getStaffPerformance(userId, year) {
        return this.staffTasksService.getStaffPerformance(userId, year ? parseInt(year) : undefined);
    }
    async getKanbanBoard(assignedToId, req) {
        if (this.isAdminOrManager(req.user.role)) {
            return this.staffTasksService.getKanbanBoard(assignedToId || undefined);
        }
        return this.staffTasksService.getKanbanBoard(req.user.id);
    }
    async findOne(id, req) {
        const task = await this.staffTasksService.findOne(id);
        if (!this.isAdminOrManager(req.user.role) && task.assignedToId !== req.user.id) {
            throw new common_1.ForbiddenException('You can only view tasks assigned to you');
        }
        return task;
    }
    async create(body, req) {
        const assignedToId = this.isAdminOrManager(req.user.role)
            ? body.assignedToId || req.user.id
            : req.user.id;
        return this.staffTasksService.create({
            title: body.title,
            description: body.description,
            status: body.status,
            priority: body.priority,
            category: body.category,
            assignedToId,
            linkedDonorId: body.linkedDonorId,
            dueDate: body.dueDate,
            notes: body.notes,
        }, req.user.id);
    }
    async update(id, body, req) {
        if (!this.isAdminOrManager(req.user.role)) {
            const task = await this.staffTasksService.findOne(id);
            if (task.assignedToId !== req.user.id) {
                throw new common_1.ForbiddenException('You can only update tasks assigned to you');
            }
        }
        return this.staffTasksService.update(id, body, req.user.id);
    }
    async updateStatus(id, body, req) {
        if (!this.isAdminOrManager(req.user.role)) {
            const task = await this.staffTasksService.findOne(id);
            if (task.assignedToId !== req.user.id) {
                throw new common_1.ForbiddenException('You can only update tasks assigned to you');
            }
        }
        return this.staffTasksService.updateTaskStatus(id, body.status, req.user.id, {
            minutesTaken: body.minutesTaken,
            startedAt: body.startedAt,
            completedAt: body.completedAt,
            notes: body.notes,
        });
    }
    async remove(id) {
        return this.staffTasksService.delete(id);
    }
    async calculatePerformance(body) {
        return this.staffTasksService.calculatePerformance(body.userId, body.month, body.year);
    }
};
exports.StaffTasksController = StaffTasksController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('priority')),
    __param(2, (0, common_1.Query)('assignedToId')),
    __param(3, (0, common_1.Query)('category')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __param(7, (0, common_1.Query)('isRecurring')),
    __param(8, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], StaffTasksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StaffTasksController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('staff-list'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StaffTasksController.prototype, "getStaffList", null);
__decorate([
    (0, common_1.Get)('staff/:userId/performance'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StaffTasksController.prototype, "getStaffPerformance", null);
__decorate([
    (0, common_1.Get)('kanban'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('assignedToId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StaffTasksController.prototype, "getKanbanBoard", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StaffTasksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StaffTasksController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], StaffTasksController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], StaffTasksController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffTasksController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('calculate-performance'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StaffTasksController.prototype, "calculatePerformance", null);
exports.StaffTasksController = StaffTasksController = __decorate([
    (0, common_1.Controller)('staff-tasks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [staff_tasks_service_1.StaffTasksService])
], StaffTasksController);
//# sourceMappingURL=staff-tasks.controller.js.map