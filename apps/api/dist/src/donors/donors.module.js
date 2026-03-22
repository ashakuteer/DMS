"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const storage_module_1 = require("../storage/storage.module");
const beneficiaries_module_1 = require("../beneficiaries/beneficiaries.module");
const donors_controller_1 = require("./donors.controller");
const donors_service_1 = require("./donors.service");
const donors_export_service_1 = require("./donors.export.service");
const donors_crud_service_1 = require("./donors.crud.service");
const donors_timeline_service_1 = require("./donors.timeline.service");
const donors_engagement_service_1 = require("./donors.engagement.service");
const donor_duplicates_service_1 = require("./donor-duplicates.service");
const donor_fundraising_service_1 = require("./donor-fundraising.service");
const donors_import_service_1 = require("./import/donors-import.service");
const donors_import_parser_service_1 = require("./import/donors-import-parser.service");
const import_normalizer_service_1 = require("./import/import-normalizer.service");
const duplicates_service_1 = require("./import/duplicates.service");
const executor_service_1 = require("./import/executor.service");
let DonorsModule = class DonorsModule {
};
exports.DonorsModule = DonorsModule;
exports.DonorsModule = DonorsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            storage_module_1.StorageModule,
            (0, common_1.forwardRef)(() => beneficiaries_module_1.BeneficiariesModule),
        ],
        controllers: [donors_controller_1.DonorsController],
        providers: [
            prisma_service_1.PrismaService,
            audit_service_1.AuditService,
            donors_service_1.DonorsService,
            donors_export_service_1.DonorsExportService,
            donors_crud_service_1.DonorsCrudService,
            donors_timeline_service_1.DonorsTimelineService,
            donors_engagement_service_1.DonorsEngagementService,
            donor_duplicates_service_1.DuplicatesService,
            donor_fundraising_service_1.DonorFundraisingService,
            donors_import_service_1.DonorsImportService,
            donors_import_parser_service_1.DonorsImportParserService,
            import_normalizer_service_1.ImportNormalizerService,
            duplicates_service_1.DuplicatesService,
            executor_service_1.ExecutorService,
        ],
        exports: [donors_service_1.DonorsService],
    })
], DonorsModule);
//# sourceMappingURL=donors.module.js.map