import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private auditService;
    private emailService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, auditService: AuditService, emailService: EmailService);
    private hashToken;
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            phone: string;
            isActive: boolean;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            isActive: true;
            assignedHome: import("@prisma/client").$Enums.HomeAssignment;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    refreshTokens(dto: RefreshTokenDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            isActive: true;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        assignedHome: import("@prisma/client").$Enums.HomeAssignment;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    generateTokensPublic(userId: string, email: string, role: Role): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logOtpLogin(userId: string): Promise<void>;
    private generateTokens;
    private getJwtSecret;
    private getJwtRefreshSecret;
}
