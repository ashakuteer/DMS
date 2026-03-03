import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CommunicationsService } from "./communications.service";
import { WhatsAppTemplateKey } from "./twilio-whatsapp.service";
import { normalizeToE164 } from "../common/phone-utils";

@Controller("communications")
@UseGuards(JwtAuthGuard)
export class CommunicationsController {
  constructor(private readonly service: CommunicationsService) {}

  @Post("whatsapp/send-template")
  async sendWhatsAppTemplate(
    @Body()
    body: {
      donorId?: string;
      toE164: string;
      contentSid: string;
      variables?: Record<string, string>;
    },
    @Req() req: any,
  ) {
    if (!body.toE164 || !body.contentSid) {
      throw new HttpException(
        "toE164 and contentSid are required",
        HttpStatus.BAD_REQUEST,
      );
    }

    const normalized = normalizeToE164(body.toE164) || body.toE164;
    if (!/^\+\d{10,15}$/.test(normalized)) {
      throw new HttpException(
        "toE164 must be a valid E.164 phone number (e.g. +919876543210)",
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.service.sendWhatsAppTemplate(
      {
        donorId: body.donorId,
        toE164: normalized,
        contentSid: body.contentSid,
        variables: body.variables,
      },
      req.user?.id,
    );

    return result;
  }

  @Post("whatsapp/send-by-key")
  async sendByTemplateKey(
    @Body()
    body: {
      donorId: string;
      toE164: string;
      templateKey: WhatsAppTemplateKey;
      variables?: Record<string, string>;
    },
    @Req() req: any,
  ) {
    if (!body.donorId || !body.toE164 || !body.templateKey) {
      throw new HttpException(
        "donorId, toE164 and templateKey are required",
        HttpStatus.BAD_REQUEST,
      );
    }

    const validKeys: WhatsAppTemplateKey[] = [
      "DONATION_THANK_YOU",
      "PLEDGE_DUE",
      "SPECIAL_DAY_WISH",
      "FOLLOWUP_REMINDER",
    ];
    if (!validKeys.includes(body.templateKey)) {
      throw new HttpException(
        `Invalid templateKey. Valid values: ${validKeys.join(", ")}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const normalizedPhone = normalizeToE164(body.toE164) || body.toE164;
    if (!/^\+\d{10,15}$/.test(normalizedPhone)) {
      throw new HttpException(
        "toE164 must be a valid E.164 phone number (e.g. +919876543210)",
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.service.sendByTemplateKey(
      body.templateKey,
      body.donorId,
      normalizedPhone,
      body.variables,
      req.user?.id,
    );

    return result;
  }

  @Post("whatsapp/send-freeform")
  async sendFreeform(
    @Body()
    body: {
      donorId?: string;
      toE164: string;
      message: string;
      type?: string;
    },
    @Req() req: any,
  ) {
    if (!body.toE164 || !body.message) {
      throw new HttpException(
        "toE164 and message are required",
        HttpStatus.BAD_REQUEST,
      );
    }

    const normalizedPhone = normalizeToE164(body.toE164) || body.toE164;
    if (!/^\+\d{10,15}$/.test(normalizedPhone)) {
      throw new HttpException(
        "toE164 must be a valid E.164 phone number (e.g. +919876543210)",
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.service.sendFreeform(
      body.donorId || '',
      normalizedPhone,
      body.message,
      body.type,
      req.user?.id,
    );
  }

  @Get("whatsapp/templates")
  async getConfiguredTemplates() {
    return {
      configured: this.service.isWhatsAppConfigured(),
      templates: this.service.getConfiguredTemplates(),
    };
  }
}
