import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

export type MessageType = 'OTP' | 'WHATSAPP';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  async sendOtp(phone: string): Promise<{ message: string }> {
    const normalizedPhone = this.normalizePhone(phone);

    // Rate limit: max 5 OTP requests per phone per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await this.prisma.otp.count({
      where: {
        phone: normalizedPhone,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentOtps >= 5) {
      throw new BadRequestException(
        'Too many OTP requests. Please try again after an hour.',
      );
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to DB (clear previous ones for this phone first)
    await this.prisma.otp.deleteMany({ where: { phone: normalizedPhone } });
    await this.prisma.otp.create({
      data: { phone: normalizedPhone, code, expiresAt },
    });

    // Route by message type — OTP always goes via SMS (plain E.164 format)
    await this.dispatch({
      messageType: 'OTP',
      to: normalizedPhone,
      code,
    });

    return { message: 'OTP sent successfully' };
  }

  /**
   * Central dispatch — routes message based on type:
   *   OTP      → SMS via TWILIO_PHONE (plain E.164, no "whatsapp:" prefix)
   *   WHATSAPP → WhatsApp via TWILIO_WHATSAPP_NUMBER or Twilio Sandbox
   */
  private async dispatch(opts: {
    messageType: MessageType;
    to: string;
    code: string;
  }): Promise<void> {
    const { messageType, to, code } = opts;
    const body = `Your Asha Kuteer DMS login OTP is ${code}. Valid for 5 minutes. Do not share this with anyone.`;

    if (messageType === 'OTP') {
      // SMS: from TWILIO_PHONE (E.164), to E.164 — no whatsapp: prefix
      const sent = await this.whatsappService.sendSms(to, body);
      if (!sent) {
        // Fallback: log OTP so testing still works without a valid Twilio SMS number
        this.logger.warn(`[OTP][FALLBACK] OTP for ${to}: ${code}`);
      }
    } else {
      // WhatsApp: from whatsapp:+14155238886 (sandbox) or TWILIO_WHATSAPP_NUMBER
      //           to whatsapp:+91XXXXXXXXXX — DO NOT mix channels
      const sent = await this.whatsappService.sendWhatsApp(to, body);
      if (!sent) {
        this.logger.warn(`[WhatsApp][FALLBACK] OTP for ${to}: ${code}`);
      }
    }
  }

  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{ id: string; email: string; role: string; name: string }> {
    const normalizedPhone = this.normalizePhone(phone);

    const otp = await this.prisma.otp.findFirst({
      where: { phone: normalizedPhone },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new UnauthorizedException(
        'No OTP found for this phone number. Please request a new one.',
      );
    }

    if (new Date() > otp.expiresAt) {
      await this.prisma.otp.delete({ where: { id: otp.id } });
      throw new UnauthorizedException('OTP has expired. Please request a new one.');
    }

    if (otp.code !== code) {
      throw new UnauthorizedException('Invalid OTP. Please check and try again.');
    }

    // OTP valid — delete immediately (one-time use)
    await this.prisma.otp.delete({ where: { id: otp.id } });

    // Find user by phone number
    const user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException(
        'No account found for this phone number. Please contact your administrator.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account is deactivated. Please contact your administrator.',
      );
    }

    return user;
  }

  private normalizePhone(phone: string): string {
    const trimmed = phone.trim();
    if (!trimmed.startsWith('+') && trimmed.length > 10) {
      return `+${trimmed}`;
    }
    return trimmed;
  }
}
