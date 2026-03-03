import { Module } from "@nestjs/common";
import { DonationsController } from "./donations.controller";
import { DonationsService } from "./donations.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { ReceiptModule } from "../receipt/receipt.module";
import { EmailModule } from "../email/email.module";
import { CommunicationLogModule } from "../communication-log/communication-log.module";
import { OrganizationProfileModule } from "../organization-profile/organization-profile.module";
import { CommunicationsModule } from "../communications/communications.module";
import { NotificationModule } from "../notifications/notification.module";

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    ReceiptModule,
    EmailModule,
    CommunicationLogModule,
    OrganizationProfileModule,
    CommunicationsModule,
    NotificationModule,
  ],
  controllers: [DonationsController],
  providers: [DonationsService],
  exports: [DonationsService],
})
export class DonationsModule {}
