import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as twilio from 'twilio';

@Injectable()
export class OtpService {
  private twilioClient: twilio.Twilio | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    if (accountSid && authToken) {
      this.twilioClient = twilio.default(accountSid, authToken);
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

    // Save OTP to DB (delete previous ones for this phone first)
    await this.prisma.otp.deleteMany({ where: { phone: normalizedPhone } });
    await this.prisma.otp.create({
      data: { phone: normalizedPhone, code, expiresAt },
    });

    // Send via Twilio
    if (this.twilioClient) {
      const fromPhone = this.configService.get<string>('TWILIO_PHONE');
      if (!fromPhone) {
        throw new ServiceUnavailableException('SMS service is not configured (TWILIO_PHONE missing)');
      }
      try {
        await this.twilioClient.messages.create({
          body: `Your Asha Kuteer DMS login OTP is ${code}. Valid for 5 minutes. Do not share this with anyone.`,
          from: fromPhone,
          to: normalizedPhone,
        });
      } catch (err: any) {
        console.error('Twilio send error:', err.message);
        throw new ServiceUnavailableException(
          'Failed to send OTP. Please check your phone number and try again.',
        );
      }
    } else {
      // Dev mode: log OTP to console (Twilio not configured)
      console.warn(`[DEV] OTP for ${normalizedPhone}: ${code}`);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{ userId: string; email: string; role: string; name: string }> {
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

    // OTP valid — delete it immediately
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
    // Add + prefix if missing and looks like an international number
    if (!trimmed.startsWith('+') && trimmed.length > 10) {
      return `+${trimmed}`;
    }
    return trimmed;
  }
}
