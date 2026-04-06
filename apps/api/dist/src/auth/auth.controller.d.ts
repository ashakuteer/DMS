import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, SendOtpDto, VerifyOtpDto } from './dto';
export declare class AuthController {
    private authService;
    private otpService;
    constructor(authService: AuthService, otpService: OtpService);
    register(dto: RegisterDto): Promise<{
        user: {
            email: string;
            name: string;
            phone: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
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
    logout(user: any): Promise<{
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
    getProfile(user: any): Promise<{
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
        assignedHome: import("@prisma/client").$Enums.HomeAssignment;
        isActive: boolean;
        updatedAt: Date;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    sendOtp(dto: SendOtpDto): Promise<{
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            isActive: boolean;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
}
