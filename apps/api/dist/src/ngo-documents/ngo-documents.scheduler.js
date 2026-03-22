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
var NgoDocumentsScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NgoDocumentsScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const ngo_documents_service_1 = require("./ngo-documents.service");
let NgoDocumentsScheduler = NgoDocumentsScheduler_1 = class NgoDocumentsScheduler {
    constructor(ngoDocumentsService) {
        this.ngoDocumentsService = ngoDocumentsService;
        this.logger = new common_1.Logger(NgoDocumentsScheduler_1.name);
    }
    async checkExpiringDocuments() {
        try {
            const expiring = await this.ngoDocumentsService.getExpiringDocuments(30);
            const expired = await this.ngoDocumentsService.getExpiredDocuments();
            if (expiring.length > 0) {
                this.logger.warn(`${expiring.length} NGO document(s) expiring within 30 days:`);
                expiring.forEach((doc) => {
                    this.logger.warn(`  - "${doc.title}" (${doc.category}) expires on ${doc.expiryDate?.toISOString().split('T')[0]}`);
                });
            }
            if (expired.length > 0) {
                this.logger.error(`${expired.length} NGO document(s) have EXPIRED:`);
                expired.forEach((doc) => {
                    this.logger.error(`  - "${doc.title}" (${doc.category}) expired on ${doc.expiryDate?.toISOString().split('T')[0]}`);
                });
            }
            if (expiring.length === 0 && expired.length === 0) {
                this.logger.log('No expiring or expired NGO documents found.');
            }
        }
        catch (error) {
            this.logger.error('Error checking document expiry', error);
        }
    }
};
exports.NgoDocumentsScheduler = NgoDocumentsScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_8AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NgoDocumentsScheduler.prototype, "checkExpiringDocuments", null);
exports.NgoDocumentsScheduler = NgoDocumentsScheduler = NgoDocumentsScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ngo_documents_service_1.NgoDocumentsService])
], NgoDocumentsScheduler);
//# sourceMappingURL=ngo-documents.scheduler.js.map