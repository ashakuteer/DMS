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
var HealthScoreScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthScoreScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const health_score_service_1 = require("./health-score.service");
let HealthScoreScheduler = HealthScoreScheduler_1 = class HealthScoreScheduler {
    constructor(healthScoreService) {
        this.healthScoreService = healthScoreService;
        this.logger = new common_1.Logger(HealthScoreScheduler_1.name);
    }
    async recalculateHealthScores() {
        this.logger.log('Running daily health score recalculation and insights cache refresh...');
        try {
            const result = await this.healthScoreService.recalculateAllHealthScores();
            this.logger.log(`Health score recalculation completed. Updated: ${result.updated}, Errors: ${result.errors}. Insight cards will reflect updated health data.`);
        }
        catch (error) {
            this.logger.error('Failed to recalculate health scores:', error);
        }
    }
};
exports.HealthScoreScheduler = HealthScoreScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_5AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthScoreScheduler.prototype, "recalculateHealthScores", null);
exports.HealthScoreScheduler = HealthScoreScheduler = HealthScoreScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [health_score_service_1.HealthScoreService])
], HealthScoreScheduler);
//# sourceMappingURL=health-score.scheduler.js.map