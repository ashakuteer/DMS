"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorRelationsModule = void 0;
const common_1 = require("@nestjs/common");
const donor_relations_controller_1 = require("./donor-relations.controller");
const donor_relations_service_1 = require("./donor-relations.service");
const prisma_module_1 = require("../prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
let DonorRelationsModule = class DonorRelationsModule {
};
exports.DonorRelationsModule = DonorRelationsModule;
exports.DonorRelationsModule = DonorRelationsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_module_1.AuditModule],
        controllers: [donor_relations_controller_1.DonorRelationsController],
        providers: [donor_relations_service_1.DonorRelationsService],
        exports: [donor_relations_service_1.DonorRelationsService],
    })
], DonorRelationsModule);
//# sourceMappingURL=donor-relations.module.js.map