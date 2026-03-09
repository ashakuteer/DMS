import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

import { DonorsController } from "./donors.controller";
import { DonorsService } from "./donors.service";

import { DonorsImportService } from "./import/donors-import.service";
import { DonorsImportParserService } from "./import/donors-import-parser.service";
import { DonorsImportNormalizerService } from "./import/donors-import-normalizer.service";
import { DonorsImportDuplicatesService } from "./import/donors-import-duplicates.service";
import { DonorsImportExecutorService } from "./import/donors-import-executor.service";

@Module({
  controllers: [DonorsController],

  providers: [
    PrismaService,
    AuditService,

    DonorsService,

    // Import services
    DonorsImportService,
    DonorsImportParserService,
    DonorsImportNormalizerService,
    DonorsImportDuplicatesService,
    DonorsImportExecutorService,
  ],

  exports: [
    DonorsService,
  ],
})
export class DonorsModule {}
