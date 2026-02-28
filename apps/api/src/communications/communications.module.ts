import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { TwilioWhatsAppService } from "./twilio-whatsapp.service";
import { CommunicationsService } from "./communications.service";
import { CommunicationsController } from "./communications.controller";
import { TwilioWebhookController } from "./twilio-webhook.controller";

@Module({
  imports: [PrismaModule],
  controllers: [CommunicationsController, TwilioWebhookController],
  providers: [TwilioWhatsAppService, CommunicationsService],
  exports: [CommunicationsService, TwilioWhatsAppService],
})
export class CommunicationsModule {}
