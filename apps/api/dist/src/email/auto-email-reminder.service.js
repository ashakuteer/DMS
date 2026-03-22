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
var AutoEmailReminderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoEmailReminderService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const special_days_processor_1 = require("./processors/special-days.processor");
const pledge_reminders_processor_1 = require("./processors/pledge-reminders.processor");
const beneficiary_birthday_processor_1 = require("./processors/beneficiary-birthday.processor");
const sponsorship_reminder_processor_1 = require("./processors/sponsorship-reminder.processor");
let AutoEmailReminderService = AutoEmailReminderService_1 = class AutoEmailReminderService {
    constructor(specialDays, pledges, beneficiaryBirthdays, sponsorships) {
        this.specialDays = specialDays;
        this.pledges = pledges;
        this.beneficiaryBirthdays = beneficiaryBirthdays;
        this.sponsorships = sponsorships;
        this.logger = new common_1.Logger(AutoEmailReminderService_1.name);
    }
    async runDailyReminderJob() {
        this.logger.log('Starting daily reminder job');
        const result = {
            specialDaysQueued: 0,
            pledgesQueued: 0,
            sponsorshipsQueued: 0,
            sent: 0,
            failed: 0,
            errors: []
        };
        try {
            const special = await this.specialDays.process();
            const pledges = await this.pledges.process();
            const birthdays = await this.beneficiaryBirthdays.process();
            const sponsorships = await this.sponsorships.process();
            result.specialDaysQueued = special.queued + birthdays.queued;
            result.pledgesQueued = pledges.queued;
            result.sponsorshipsQueued = sponsorships.queued;
            result.sent =
                special.sent +
                    pledges.sent +
                    birthdays.sent +
                    sponsorships.sent;
            result.failed =
                special.failed +
                    pledges.failed +
                    birthdays.failed +
                    sponsorships.failed;
            result.errors.push(...special.errors, ...pledges.errors, ...birthdays.errors, ...sponsorships.errors);
        }
        catch (error) {
            this.logger.error(error.message);
            result.errors.push(error.message);
        }
        return result;
    }
};
exports.AutoEmailReminderService = AutoEmailReminderService;
__decorate([
    (0, schedule_1.Cron)('0 9 * * *', { timeZone: 'Asia/Kolkata' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AutoEmailReminderService.prototype, "runDailyReminderJob", null);
exports.AutoEmailReminderService = AutoEmailReminderService = AutoEmailReminderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [special_days_processor_1.SpecialDaysProcessor,
        pledge_reminders_processor_1.PledgeRemindersProcessor,
        beneficiary_birthday_processor_1.BeneficiaryBirthdayProcessor,
        sponsorship_reminder_processor_1.SponsorshipReminderProcessor])
], AutoEmailReminderService);
//# sourceMappingURL=auto-email-reminder.service.js.map