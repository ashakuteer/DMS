"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
let OtpService = OtpService_1 = class OtpService {
    constructor(prisma, whatsappService) {
        this.prisma = prisma;
        this.whatsappService = whatsappService;
        this.logger = new common_1.Logger(OtpService_1.name);
    }
    async sendOtp(phone) {
        const normalizedPhone = this.normalizePhone(phone);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentOtps = await this.prisma.otp.count({
            where: {
                phone: normalizedPhone,
                createdAt: { gte: oneHourAgo },
            },
        });
        if (recentOtps >= 5) {
            throw new common_1.BadRequestException('Too many OTP requests. Please try again after an hour.');
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await this.prisma.otp.deleteMany({ where: { phone: normalizedPhone } });
        await this.prisma.otp.create({
            data: { phone: normalizedPhone, code, expiresAt },
        });
        const sent = await this.whatsappService.sendOtpTemplate(normalizedPhone, code);
        if (!sent) {
            this.logger.warn(`[OtpService] WhatsApp delivery failed. Check logs for OTP.`);
        }
        return { message: 'OTP sent successfully' };
    }
    async verifyOtp(phone, code) {
        const normalizedPhone = this.normalizePhone(phone);
        const otp = await this.prisma.otp.findFirst({
            where: { phone: normalizedPhone },
            orderBy: { createdAt: 'desc' },
        });
        if (!otp) {
            throw new common_1.UnauthorizedException('No OTP found for this phone number. Please request a new one.');
        }
        if (new Date() > otp.expiresAt) {
            await this.prisma.otp.delete({ where: { id: otp.id } });
            throw new common_1.UnauthorizedException('OTP has expired. Please request a new one.');
        }
        if (otp.code !== code) {
            throw new common_1.UnauthorizedException('Invalid OTP. Please check and try again.');
        }
        await this.prisma.otp.delete({ where: { id: otp.id } });
        const user = await this.prisma.user.findUnique({
            where: { phone: normalizedPhone },
            select: { id: true, email: true, name: true, role: true, isActive: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('No account found for this phone number. Please contact your administrator.');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Your account is deactivated. Please contact your administrator.');
        }
        return user;
    }
    normalizePhone(phone) {
        const trimmed = phone.trim();
        if (!trimmed.startsWith('+') && trimmed.length > 10) {
            return `+${trimmed}`;
        }
        return trimmed;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsappService])
], OtpService);
//# sourceMappingURL=otp.service.js.map