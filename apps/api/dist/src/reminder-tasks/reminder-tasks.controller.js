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
exports.ReminderTasksController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const reminder_tasks_service_1 = require("./reminder-tasks.service");
let ReminderTasksController = class ReminderTasksController {
    constructor(reminderTasksService) {
        this.reminderTasksService = reminderTasksService;
    }
    async getReminders(user, filter = 'today') {
        return this.reminderTasksService.getReminders(user, filter);
    }
    async getStats() {
        return this.reminderTasksService.getStats();
    }
    async markDone(user, id) {
        return this.reminderTasksService.markDone(user, id);
    }
    async snooze(user, id, body) {
        return this.reminderTasksService.snooze(user, id, body.days);
    }
    async generateReminders() {
        const count = await this.reminderTasksService.generateSpecialDayReminders();
        return { message: `Generated ${count} reminder tasks`, count };
    }
    async logWhatsAppClick(user, id) {
        return this.reminderTasksService.logWhatsAppClick(user, id);
    }
    async sendEmail(user, id) {
        return this.reminderTasksService.sendManualEmail(user, id);
    }
    async processAutoEmails() {
        const result = await this.reminderTasksService.processAutoEmails();
        return { message: `Processed auto emails: ${result.sent} sent, ${result.failed} failed`, ...result };
    }
};
exports.ReminderTasksController = ReminderTasksController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReminderTasksController.prototype, "getReminders", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderTasksController.prototype, "getStats", null);
__decorate([
    (0, common_1.Patch)(':id/done'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReminderTasksController.prototype, "markDone", null);
__decorate([
    (0, common_1.Patch)(':id/snooze'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ReminderTasksController.prototype, "snooze", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderTasksController.prototype, "generateReminders", null);
__decorate([
    (0, common_1.Post)(':id/whatsapp-log'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReminderTasksController.prototype, "logWhatsAppClick", null);
__decorate([
    (0, common_1.Post)(':id/send-email'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReminderTasksController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Post)('process-auto-emails'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderTasksController.prototype, "processAutoEmails", null);
exports.ReminderTasksController = ReminderTasksController = __decorate([
    (0, common_1.Controller)('reminder-tasks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [reminder_tasks_service_1.ReminderTasksService])
], ReminderTasksController);
//# sourceMappingURL=reminder-tasks.controller.js.map