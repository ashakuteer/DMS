import { Module, forwardRef } from "@nestjs/common";
import { DonorsController } from "./donors.controller";
import { DonorsService } from "./donors.service";
import { DonorsCrudService } from "./donors.crud.service";
import { DonorDuplicatesService } from "./donor-duplicates.service";
import { DonorsEngagementService } from "./donors.engagement.service";
import { DonorsImportService } from "./donors.import.service";
import { DonorsExportService } from "./donors.export.service";
import { DonorsTimelineService } from "./donors.timeline.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { StorageModule } from "../storage/storage.module";
import { BeneficiariesModule } from "../beneficiaries/beneficiaries.module";

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    StorageModule,
    forwardRef(() => BeneficiariesModule),
  ],
  controllers: [DonorsController],
  providers: [
    DonorsService,
    DonorDuplicatesService,
    DonorsEngagementService,
    DonorsImportService,
    DonorsExportService,
    DonorsTimelineService,
  ],
  exports: [
    DonorsService,
    DonorDuplicatesService,
  ],
})
export class DonorsModule {}
