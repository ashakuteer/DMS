import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

import { DonorsController } from "./donors.controller";
import { DonorsService } from "./donors.service";

import { DonorsImportService } from "./import/donors-import.service";
import { DonorsImportParserService } from "./import/donors-import-parser.service";
import { ImportNormalizerService } from "./import/import-normalizer.service";
import { DuplicatesService } from "./import/duplicates.service";
import { ExecutorService } from "./import/executor.service";

@Module({
  controllers: [DonorsController],

  providers: [
    PrismaService,
    AuditService,
    DonorsService,

    // Import services
    DonorsImportService,
    DonorsImportParserService,
    ImportNormalizerService,
    DuplicatesService,
    ExecutorService,
  ],

  exports: [
    DonorsService,
  ],
})
export class DonorsModule {}
