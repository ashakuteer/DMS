import { Module } from "@nestjs/common";
import { DonationsController } from "./donations.controller";
import { DonationsService } from "./donations.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { ReceiptModule } from "../receipt/receipt.module";
import { EmailModule } from "../email/email.module";
import { CommunicationLogModule } from "../communication-log/communication-log.module";
import { OrganizationProfileModule } from "../organization-profile/organization-profile.module";
import { WhatsappModule } from "../whatsapp/whatsapp.module";
import { CommunicationsModule } from "../communications/communications.module";

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    ReceiptModule,
    EmailModule,
    CommunicationLogModule,
    OrganizationProfileModule,
    WhatsappModule,
    CommunicationsModule,
  ],
  controllers: [DonationsController],
  providers: [DonationsService],
  exports: [DonationsService],
})
export class DonationsModule {}
