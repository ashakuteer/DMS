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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../../audit/audit.service");
let ExecutorService = class ExecutorService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async executeBulkImport(user, rows, mapping, actions, ip, agent) {
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const action = actions[i] || "skip";
            if (action === "skip")
                continue;
            const data = {};
            Object.keys(mapping).forEach((key) => {
                data[key] = row[mapping[key]];
            });
            if (action === "create") {
                await this.prisma.donor.create({
                    data: {
                        ...data,
                        createdById: user.id,
                    },
                    select: { id: true },
                });
            }
        }
        await this.auditService.logDataExport(user.id, "Bulk Import", { rows: rows.length }, rows.length, ip, agent);
        return { success: true };
    }
    async bulkUpload(file, user) {
        return {
            message: "Bulk upload started",
            user: user.id,
        };
    }
};
exports.ExecutorService = ExecutorService;
exports.ExecutorService = ExecutorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ExecutorService);
//# sourceMappingURL=executor.service.js.map