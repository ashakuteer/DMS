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
exports.DonorsImportService = void 0;
const common_1 = require("@nestjs/common");
const import_normalizer_service_1 = require("./import-normalizer.service");
const duplicates_service_1 = require("./duplicates.service");
const executor_service_1 = require("./executor.service");
const donors_import_parser_service_1 = require("./donors-import-parser.service");
let DonorsImportService = class DonorsImportService {
    constructor(parser, normalizer, duplicates, executor) {
        this.parser = parser;
        this.normalizer = normalizer;
        this.duplicates = duplicates;
        this.executor = executor;
    }
    async parseImportFile(file) {
        return this.parser.parseImportFile(file);
    }
    async detectDuplicates(rows, mapping) {
        return this.duplicates.detectDuplicates(rows, mapping);
    }
    async executeBulkImport(user, rows, mapping, actions) {
        return this.executor.executeBulkImport(user, rows, mapping, actions);
    }
    async bulkUpload(file, user) {
        return this.executor.bulkUpload(file, user);
    }
};
exports.DonorsImportService = DonorsImportService;
exports.DonorsImportService = DonorsImportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [donors_import_parser_service_1.DonorsImportParserService,
        import_normalizer_service_1.ImportNormalizerService,
        duplicates_service_1.DuplicatesService,
        executor_service_1.ExecutorService])
], DonorsImportService);
//# sourceMappingURL=donors-import.service.js.map