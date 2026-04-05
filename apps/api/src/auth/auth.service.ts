import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private emailService: EmailService,
  ) {}

  /**
   * SHA-256 hash of a high-entropy token for deterministic DB lookup.
   * Used for refreshToken and resetPasswordToken — NOT for passwords
   * (passwords use bcrypt). SHA-256 is appropriate here because the
   * tokens are cryptographically random (256-bit entropy).
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

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

      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);

      await this.auditService.log({
        userId: user.id,
        action: AuditAction.LOGIN,
        entityType: 'USER',
        entityId: user.id,
      });

      this.logger.log(`Login successful for user id=${user.id}`);
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          assignedHome: user.assignedHome ?? null,
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
      this.logger.error('Auth error during login', error instanceof Error ? error.stack : String(error));
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async logout(userId: string) {
    // Invalidate the stored refresh token hash so old tokens are rejected
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

      if (!user || !user.isActive) {
        throw new ForbiddenException('Access denied');
      }

      // Validate the incoming refresh token against the stored hash.
      // If the user logged out or reset their password, refreshToken will be
      // null and this check will correctly reject the old token.
      if (!user.refreshToken) {
        throw new ForbiddenException('Access denied');
      }
      const incomingHash = this.hashToken(dto.refreshToken);
      if (incomingHash !== user.refreshToken) {
        throw new ForbiddenException('Access denied');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);

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
      if (error instanceof ForbiddenException) throw error;
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
      // Map short aliases to full login emails
      const ALIAS_MAP: Record<string, string> = {
        'founder': 'founder@ngo.org',
        'admin': 'admin@ngo.org',
        'staff': 'staff@ngo.org',
      };
      const raw = dto.identifier.trim();
      const resolved = ALIAS_MAP[raw.toLowerCase()] ?? raw;

      this.logger.log('Password reset requested');

      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: resolved },
            { username: raw },
          ],
        },
      });

      if (!user || !user.isActive) {
        return { message: 'If that account exists, a reset link has been sent to the admin.' };
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = this.hashToken(rawToken);
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: expires,
        },
      });

      const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000';
      const resetLink = `${appUrl}/reset-password?token=${rawToken}`;
      const adminEmail = process.env.RECOVERY_EMAIL || 'ashakuteer@gmail.com';

      const displayId = user.username || user.email;
      const roleBadgeColor = user.role === 'FOUNDER' ? '#7c3aed' : user.role === 'ADMIN' ? '#1d4ed8' : '#0f766e';

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0f2847 0%, #1a4480 100%); padding: 32px 40px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Asha Kuteer Foundation</h1>
            <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 13px;">Donor Management System — Admin Alert</p>
          </div>

          <div style="padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px;">Password Reset Request</h2>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
              A password reset was requested for the following user:
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #64748b; font-size: 13px; padding: 6px 0; width: 120px;">Email</td>
                  <td style="color: #0f172a; font-size: 15px; font-weight: 600; padding: 6px 0; font-family: monospace;">${user.email}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 13px; padding: 6px 0;">Full Name</td>
                  <td style="color: #0f172a; font-size: 14px; padding: 6px 0;">${user.name}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 13px; padding: 6px 0;">Role</td>
                  <td style="padding: 6px 0;">
                    <span style="display: inline-block; background: ${roleBadgeColor}; color: #ffffff;
                                 font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px;
                                 letter-spacing: 0.5px;">
                      ${user.role}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-size: 13px; padding: 6px 0;">Expires</td>
                  <td style="color: #0f172a; font-size: 14px; padding: 6px 0;">1 hour from now</td>
                </tr>
              </table>
            </div>

            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
              Click the button below to set a new password for this account, then share the new credentials with the user:
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetLink}"
                 style="display: inline-block; background: #f97316; color: #ffffff; text-decoration: none;
                        font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 8px;
                        letter-spacing: 0.3px;">
                Reset Password for ${displayId}
              </a>
            </div>

            <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">
              If the button doesn't work, copy and paste this link:
            </p>
            <p style="color: #3b82f6; font-size: 12px; word-break: break-all; margin: 6px 0 24px 0;">
              ${resetLink}
            </p>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 8px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.6;">
                If this request was not made by you or the user, please ignore this email and no changes will be made.
                <br/>This is an automated message from the DMS. Please do not reply.
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

      const text = `Password Reset Request\n\nEmail: ${user.email}\nName: ${user.name}\nRole: ${user.role}\n\nReset link (expires in 1 hour):\n${resetLink}\n\n— Asha Kuteer Foundation DMS`;

      this.logger.log(`Sending reset email to admin for user id=${user.id}`);

      const emailResult = await this.emailService.sendEmail({
        to: adminEmail,
        subject: `DMS Password Reset — ${displayId} (${user.role})`,
        html,
        text,
        featureType: 'MANUAL',
      });

      if (!emailResult.success) {
        this.logger.warn('Failed to send password reset email', emailResult.error);
      }

      return { message: 'If that account exists, a reset link has been sent to the admin.' };
    } catch (error) {
      this.logger.error('Error in forgotPassword', error instanceof Error ? error.stack : String(error));
      return { message: 'If that account exists, a reset link has been sent to the admin.' };
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    // Hash the incoming token with SHA-256 to compare against the stored hash
    const hashedToken = this.hashToken(dto.token);

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
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

  // Public wrapper used by OTP verify flow in AuthController
  async generateTokensPublic(userId: string, email: string, role: Role) {
    return this.generateTokens(userId, email, role);
  }

  async logOtpLogin(userId: string) {
    await this.auditService.log({
      userId,
      action: AuditAction.LOGIN,
      entityType: 'USER',
      entityId: userId,
    });
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

    // Store the SHA-256 hash of the refresh token so it can be validated on
    // refresh and invalidated on logout / password reset. The raw token is
    // returned to the client; the hash never leaves the server.
    const hashedRefreshToken = this.hashToken(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });

    return { accessToken, refreshToken };
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
