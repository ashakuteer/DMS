import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, SendOtpDto, VerifyOtpDto } from './dto';
export declare class AuthController {
    private authService;
    private otpService;
    constructor(authService: AuthService, otpService: OtpService);
    register(dto: RegisterDto): Promise<{
        user: any;
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            isActive: any;
            assignedHome: any;
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
            id: any;
            email: any;
            name: any;
            role: any;
            isActive: any;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    getProfile(user: any): Promise<any>;
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
