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
var SponsorshipReminderScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SponsorshipReminderScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const beneficiaries_service_1 = require("./beneficiaries.service");
let SponsorshipReminderScheduler = SponsorshipReminderScheduler_1 = class SponsorshipReminderScheduler {
    constructor(beneficiariesService) {
        this.beneficiariesService = beneficiariesService;
        this.logger = new common_1.Logger(SponsorshipReminderScheduler_1.name);
    }
    async autoQueueSponsorshipReminders() {
        this.logger.log('Running daily sponsorship reminder auto-queue...');
        try {
            const dueSponsorships = await this.beneficiariesService.getDueSponsorships();
            let queued = 0;
            let skipped = 0;
            let failed = 0;
            for (const s of dueSponsorships) {
                try {
                    const donorEmail = s?.donor?.personalEmail || s?.donor?.officialEmail;
                    if (!donorEmail) {
                        skipped++;
                        continue;
                    }
                    await this.beneficiariesService.queueSponsorshipReminderEmail(s.id);
                    queued++;
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : 'Unknown error';
                    if (msg.includes('already exists') ||
                        msg.includes('Unique constraint')) {
                        skipped++;
                    }
                    else {
                        failed++;
                        this.logger.warn(`Failed to queue reminder for sponsorship ${s.id}: ${msg}`);
                    }
                }
            }
            this.logger.log(`Sponsorship reminders finished. Queued=${queued}, Skipped=${skipped}, Failed=${failed}`);
        }
        catch (error) {
            this.logger.error('Failed to auto-queue sponsorship reminders', error);
        }
    }
};
exports.SponsorshipReminderScheduler = SponsorshipReminderScheduler;
__decorate([
    (0, schedule_1.Cron)('0 9 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SponsorshipReminderScheduler.prototype, "autoQueueSponsorshipReminders", null);
exports.SponsorshipReminderScheduler = SponsorshipReminderScheduler = SponsorshipReminderScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [beneficiaries_service_1.BeneficiariesService])
], SponsorshipReminderScheduler);
//# sourceMappingURL=sponsorship-reminder.scheduler.js.map