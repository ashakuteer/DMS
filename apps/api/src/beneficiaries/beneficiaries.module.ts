import { Module, forwardRef } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { StorageModule } from "../storage/storage.module";
import { BeneficiariesModule } from "../beneficiaries/beneficiaries.module";

import { DonorsController } from "./donors.controller";
import { DonorsService } from "./donors.service";
import { DonorsExportService } from "./donors.export.service";
import { DonorsCrudService } from "./donors.crud.service";
import { DonorsTimelineService } from "./donors.timeline.service";
import { DonorsEngagementService } from "./donors.engagement.service";
import { DuplicatesService as DonorDuplicatesService } from "./donor-duplicates.service";

import { DonorsImportService } from "./import/donors-import.service";
import { DonorsImportParserService } from "./import/donors-import-parser.service";
import { ImportNormalizerService } from "./import/import-normalizer.service";
import { DuplicatesService as ImportDuplicatesService } from "./import/duplicates.service";
import { ExecutorService } from "./import/executor.service";

@Module({
  imports: [
    StorageModule,
    forwardRef(() => BeneficiariesModule),
  ],
  controllers: [DonorsController],
  providers: [
    PrismaService,
    AuditService,
    DonorsService,
    DonorsExportService,
    DonorsCrudService,
    DonorsTimelineService,
    DonorsEngagementService,
    DonorDuplicatesService,
    DonorsImportService,
    DonorsImportParserService,
    ImportNormalizerService,
    ImportDuplicatesService,
    ExecutorService,
  ],
  exports: [DonorsService],
})
export class DonorsModule {}
