import { Controller, Post, Body, HttpCode, Logger } from "@nestjs/common";
import { CommunicationsService } from "./communications.service";

@Controller("webhooks/twilio")
export class TwilioWebhookController {
  private readonly logger = new Logger(TwilioWebhookController.name);

  constructor(private readonly service: CommunicationsService) {}

  @Post("status")
  @HttpCode(200)
  async handleStatusCallback(
    @Body()
    body: {
      MessageSid?: string;
      MessageStatus?: string;
      ErrorCode?: string;
      ErrorMessage?: string;
    },
  ) {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = body;

    if (!MessageSid || !MessageStatus) {
      this.logger.warn("Received webhook without MessageSid or MessageStatus");
      return { received: true };
    }

    this.logger.log(
      `Twilio status webhook: SID=${MessageSid} Status=${MessageStatus}`,
    );

    await this.service.updateStatusFromWebhook(
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage,
    );

    return { received: true };
  }
}
