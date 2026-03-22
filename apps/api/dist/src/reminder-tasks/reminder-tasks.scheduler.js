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
var ReminderTasksScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderTasksScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const reminder_tasks_service_1 = require("./reminder-tasks.service");
let ReminderTasksScheduler = ReminderTasksScheduler_1 = class ReminderTasksScheduler {
    constructor(reminderTasksService) {
        this.reminderTasksService = reminderTasksService;
        this.logger = new common_1.Logger(ReminderTasksScheduler_1.name);
    }
    async generateDailyReminders() {
        this.logger.log('Running daily reminder generation...');
        try {
            const count = await this.reminderTasksService.generateSpecialDayReminders();
            this.logger.log(`Daily reminder generation completed. Generated ${count} tasks.`);
        }
        catch (error) {
            this.logger.error('Failed to generate daily reminders:', error);
        }
    }
    async processDailyAutoEmails() {
        this.logger.log('Processing daily auto emails for due reminders...');
        try {
            const result = await this.reminderTasksService.processAutoEmails();
            this.logger.log(`Auto email processing completed. Sent: ${result.sent}, Failed: ${result.failed}`);
        }
        catch (error) {
            this.logger.error('Failed to process auto emails:', error);
        }
    }
    async cleanupSnoozedReminders() {
        this.logger.log('Checking for unsnoozed reminders...');
    }
};
exports.ReminderTasksScheduler = ReminderTasksScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_6AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderTasksScheduler.prototype, "generateDailyReminders", null);
__decorate([
    (0, schedule_1.Cron)('0 8 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderTasksScheduler.prototype, "processDailyAutoEmails", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderTasksScheduler.prototype, "cleanupSnoozedReminders", null);
exports.ReminderTasksScheduler = ReminderTasksScheduler = ReminderTasksScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [reminder_tasks_service_1.ReminderTasksService])
], ReminderTasksScheduler);
//# sourceMappingURL=reminder-tasks.scheduler.js.map