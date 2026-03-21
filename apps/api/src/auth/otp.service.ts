import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Twilio from 'twilio';

@Injectable()
export class OtpService {
  private twilioClient: ReturnType<typeof Twilio> | null = null;
  private fromPhone: string | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const phone = this.configService.get<string>('TWILIO_PHONE');

    if (accountSid && authToken) {
      this.twilioClient = Twilio(accountSid, authToken);
      console.log('[OtpService] Twilio client initialized');
    } else {
      console.warn('[OtpService] Twilio not configured — OTPs will be logged to console only');
    }

    if (phone) {
      // Strip any "whatsapp:" prefix — we need the plain E.164 number for SMS
      this.fromPhone = phone.replace(/^whatsapp:/i, '').trim();
      console.log(`[OtpService] TWILIO_PHONE set to: ${this.fromPhone}`);
    } else {
      console.warn('[OtpService] TWILIO_PHONE not set — SMS will be skipped');
    }
  }

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

    // Attempt to send via Twilio SMS
    await this.sendSms(normalizedPhone, code);

    return { message: 'OTP sent successfully' };
  }

  private async sendSms(to: string, code: string): Promise<void> {
    const message = `Your Asha Kuteer DMS login OTP is ${code}. Valid for 5 minutes. Do not share this with anyone.`;

    // If Twilio client or phone not configured → fall back to console
    if (!this.twilioClient || !this.fromPhone) {
      console.warn(`[OtpService][DEV] Twilio not configured. OTP for ${to}: ${code}`);
      return;
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromPhone,
        to,
      });
      console.log(`[OtpService] SMS sent to ${to}, SID: ${result.sid}`);
    } catch (err: any) {
      // Log the OTP to console so development/testing still works
      // Do NOT throw — returning success lets the user proceed with the console OTP
      console.error(`[OtpService] Twilio error (${err.code}): ${err.message}`);
      console.warn(`[OtpService][FALLBACK] OTP for ${to}: ${code}`);
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
      throw new UnauthorizedException('No OTP found for this phone number. Please request a new one.');
    }

    if (new Date() > otp.expiresAt) {
      await this.prisma.otp.delete({ where: { id: otp.id } });
      throw new UnauthorizedException('OTP has expired. Please request a new one.');
    }

    if (otp.code !== code) {
      throw new UnauthorizedException('Invalid OTP. Please check and try again.');
    }

    // OTP valid — delete it immediately (one-time use)
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
      throw new UnauthorizedException('Your account is deactivated. Please contact your administrator.');
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
