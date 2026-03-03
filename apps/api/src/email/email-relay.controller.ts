import {
  Controller,
  Post,
  Body,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('email-relay')
export class EmailRelayController {
  constructor(private readonly emailService: EmailService) {}

  @Public()
  @Post('send')
  async relaySend(@Body() body: any, @Req() req: any) {
    const secret = req.headers['x-relay-secret'];
    const expectedSecret = process.env.EMAIL_RELAY_SECRET || process.env.SESSION_SECRET;
    if (!secret || !expectedSecret || secret !== expectedSecret) {
      throw new BadRequestException('Unauthorized relay request');
    }
    if (!body.to || !body.subject) {
      throw new BadRequestException('to and subject are required');
    }
    const attachments = (body.attachments || []).map((att: any) => ({
      filename: att.filename,
      content: att.encoding === 'base64' ? Buffer.from(att.content, 'base64') : att.content,
      contentType: att.contentType,
    }));
    const result = await this.emailService.sendEmail({
      to: body.to,
      subject: body.subject,
      html: body.html,
      text: body.text,
      attachments: attachments.length ? attachments : undefined,
      featureType: 'RELAY',
    });
    return result;
  }
}
