import { Module, forwardRef } from "@nestjs/common";
import { DonorsController } from "./donors.controller";
import { DonorsService } from "./donors.service";
import { DonorDuplicatesService } from "./donor-duplicates.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { StorageModule } from "../storage/storage.module";
import { BeneficiariesModule } from "../beneficiaries/beneficiaries.module";

@Module({
  imports: [PrismaModule, AuditModule, StorageModule, forwardRef(() => BeneficiariesModule)],
  controllers: [DonorsController],
  providers: [
    DonorsService,
    DonorDuplicatesService,
  ],
  exports: [
    DonorsService,
    DonorDuplicatesService,
  ],
})
export class DonorsModule {}
