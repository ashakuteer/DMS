"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportNormalizerService = void 0;
const common_1 = require("@nestjs/common");
let ImportNormalizerService = class ImportNormalizerService {
    normalizePhone(phone) {
        if (!phone)
            return null;
        const cleaned = String(phone).replace(/[\s\-()+]/g, "");
        if (cleaned.startsWith("91") && cleaned.length === 12) {
            return cleaned.slice(2);
        }
        if (cleaned.length >= 10) {
            return cleaned.slice(-10);
        }
        return cleaned;
    }
    normalizeEmail(email) {
        if (!email)
            return null;
        const trimmed = email.trim().toLowerCase();
        if (trimmed.includes("@") && trimmed.includes(".")) {
            return trimmed;
        }
        return null;
    }
};
exports.ImportNormalizerService = ImportNormalizerService;
exports.ImportNormalizerService = ImportNormalizerService = __decorate([
    (0, common_1.Injectable)()
], ImportNormalizerService);
//# sourceMappingURL=import-normalizer.service.js.map