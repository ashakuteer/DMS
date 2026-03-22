"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiaryHealthService = void 0;
const common_1 = require("@nestjs/common");
let BeneficiaryHealthService = class BeneficiaryHealthService {
    async getMetrics(beneficiaryId) {
        return [];
    }
    async addMetric(user, beneficiaryId, dto) {
        return { status: "ok" };
    }
    async addHealthEvent(user, beneficiaryId, dto) {
        return { status: "created" };
    }
    async sendHealthEventToSponsors(user, eventId) {
        return { status: "queued" };
    }
    async getHealthEvents(beneficiaryId) {
        return [];
    }
    async getHealthTimeline(beneficiaryId) {
        return [];
    }
    async exportHealthHistoryPdf(beneficiaryId) {
        return [];
    }
};
exports.BeneficiaryHealthService = BeneficiaryHealthService;
exports.BeneficiaryHealthService = BeneficiaryHealthService = __decorate([
    (0, common_1.Injectable)()
], BeneficiaryHealthService);
//# sourceMappingURL=beneficiary-health.service.js.map