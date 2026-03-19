import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { Role, AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingByEmail) {
      throw new ConflictException('A user with this email already exists');
    }

    if (dto.phone) {
      const existingByPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingByPhone) {
        throw new ConflictException('A user with this phone number already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        phone: dto.phone || null,
        role: dto.role || Role.STAFF,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!user.isActive) {
        throw new ForbiddenException('Account is deactivated');
      }

      console.log('User found:', user.email);
      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      await this.auditService.log({
        userId: user.id,
        action: AuditAction.LOGIN,
        entityType: 'USER',
        entityId: user.id,
      });

      console.log('Login success for:', user.email);
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        },
        tokens,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Auth error:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.LOGOUT,
      entityType: 'USER',
      entityId: userId,
    });

    return { message: 'Logged out successfully' };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.getJwtRefreshSecret(),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new ForbiddenException('Access denied');
      }

      const isRefreshTokenValid = await bcrypt.compare(dto.refreshToken, user.refreshToken);
      if (!isRefreshTokenValid) {
        throw new ForbiddenException('Access denied');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        },
        tokens,
      };
    } catch (error) {
      throw new ForbiddenException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        return { message: 'If that email is registered, a reset link has been sent.' };
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: rawToken,
          resetPasswordExpires: expires,
        },
      });

      const appUrl = process.env.APP_URL || 'http://localhost:5000';
      const resetLink = `${appUrl}/reset-password?token=${rawToken}`;
      const firstName = user.name?.split(' ')[0] || user.name || 'there';

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0f2847 0%, #1a4480 100%); padding: 32px 40px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Asha Kuteer Foundation</h1>
            <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 13px;">Donor Management System</p>
          </div>

          <div style="padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px;">Password Reset Request</h2>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">
              Hi ${firstName},
            </p>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
              We received a request to reset the password for your account (<strong>${user.email}</strong>).
              Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}"
                 style="display: inline-block; background: #f97316; color: #ffffff; text-decoration: none;
                        font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 8px;
                        letter-spacing: 0.3px;">
                Reset My Password
              </a>
            </div>

            <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #3b82f6; font-size: 12px; word-break: break-all; margin: 6px 0 24px 0;">
              ${resetLink}
            </p>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 8px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.6;">
                If you did not request a password reset, please ignore this email — your password will remain unchanged.
                <br/>This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>

          <div style="text-align: center; padding: 20px 40px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Asha Kuteer Foundation. All rights reserved.
            </p>
          </div>
        </div>
      `;

      const text = `Hi ${firstName},\n\nWe received a request to reset your password for ${user.email}.\n\nClick this link to reset your password (expires in 1 hour):\n${resetLink}\n\nIf you did not request this, please ignore this email.\n\n— Asha Kuteer Foundation`;

      const emailResult = await this.emailService.sendEmail({
        to: user.email,
        subject: 'Reset your password — Asha Kuteer Foundation',
        html,
        text,
        featureType: 'MANUAL',
      });

      if (emailResult.success) {
        return {
          message: 'A password reset link has been sent to your email address.',
        };
      } else {
        console.error('Failed to send reset email:', emailResult.error);
        return {
          message: 'Password reset token generated. Email delivery failed — use the token below.',
          resetToken: rawToken,
          expiresAt: expires,
        };
      }
    } catch (error) {
      console.error('Auth error:', error);
      return { message: 'If that email is registered, a reset link has been sent.' };
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: dto.token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        refreshToken: null,
      },
    });

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  private async generateTokens(userId: string, email: string, role: Role) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.getJwtSecret(),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.getJwtRefreshSecret(),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  private getJwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return secret;
  }

  private getJwtRefreshSecret(): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }
    return secret;
  }
}
