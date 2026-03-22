"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NgoDocumentsModule = void 0;
const common_1 = require("@nestjs/common");
const ngo_documents_controller_1 = require("./ngo-documents.controller");
const ngo_documents_service_1 = require("./ngo-documents.service");
const ngo_documents_scheduler_1 = require("./ngo-documents.scheduler");
const prisma_module_1 = require("../prisma/prisma.module");
let NgoDocumentsModule = class NgoDocumentsModule {
};
exports.NgoDocumentsModule = NgoDocumentsModule;
exports.NgoDocumentsModule = NgoDocumentsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [ngo_documents_controller_1.NgoDocumentsController],
        providers: [ngo_documents_service_1.NgoDocumentsService, ngo_documents_scheduler_1.NgoDocumentsScheduler],
        exports: [ngo_documents_service_1.NgoDocumentsService],
    })
], NgoDocumentsModule);
//# sourceMappingURL=ngo-documents.module.js.map