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
var TimeMachineStartupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeMachineStartupService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TimeMachineStartupService = TimeMachineStartupService_1 = class TimeMachineStartupService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TimeMachineStartupService_1.name);
    }
    async onModuleInit() {
        await this.verifyTimeMachineTable();
    }
    async verifyTimeMachineTable() {
        try {
            await this.prisma.$queryRaw `SELECT 1 FROM "time_machine_entries" LIMIT 1`;
            this.logger.log('time_machine_entries table is ready');
        }
        catch {
            this.logger.warn('time_machine_entries table not found — it must be created via migration before use');
        }
    }
};
exports.TimeMachineStartupService = TimeMachineStartupService;
exports.TimeMachineStartupService = TimeMachineStartupService = TimeMachineStartupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TimeMachineStartupService);
//# sourceMappingURL=time-machine-startup.service.js.map