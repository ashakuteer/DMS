"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OrganizationProfileController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationProfileController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const organization_profile_service_1 = require("./organization-profile.service");
const email_service_1 = require("../email/email.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'organization');
let OrganizationProfileController = OrganizationProfileController_1 = class OrganizationProfileController {
    constructor(orgProfileService, emailService) {
        this.orgProfileService = orgProfileService;
        this.emailService = emailService;
        this.logger = new common_1.Logger(OrganizationProfileController_1.name);
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }
    }
    async getProfile() {
        return this.orgProfileService.getProfile();
    }
    async getPublicProfile() {
        const profile = await this.orgProfileService.getProfile();
        if (!profile) {
            return null;
        }
        return {
            name: profile.name,
            tagline1: profile.tagline1,
            tagline2: profile.tagline2,
            logoUrl: profile.logoUrl,
            brandingPrimaryColor: profile.brandingPrimaryColor,
            phone1: profile.phone1,
            phone2: profile.phone2,
            email: profile.email,
            website: profile.website,
            pan: profile.pan,
            section80GText: profile.section80GText,
            homes: profile.homes,
        };
    }
    async updateProfile(data) {
        return this.orgProfileService.updateProfile(data);
    }
    async uploadLogo(file) {
        if (!file) {
            throw new common_1.HttpException('No file uploaded', common_1.HttpStatus.BAD_REQUEST);
        }
        const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new common_1.HttpException('Only PNG, JPEG, WebP, and SVG images are allowed', common_1.HttpStatus.BAD_REQUEST);
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new common_1.HttpException('File size must be under 5MB', common_1.HttpStatus.BAD_REQUEST);
        }
        const ext = path.extname(file.originalname) || '.png';
        const filename = `logo_${Date.now()}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        fs.writeFileSync(filepath, file.buffer);
        const logoUrl = `/api/organization-profile/files/${filename}`;
        await this.orgProfileService.updateProfile({ logoUrl });
        this.logger.log(`Logo uploaded: ${filename}`);
        return { logoUrl };
    }
    async uploadSignature(file) {
        if (!file) {
            throw new common_1.HttpException('No file uploaded', common_1.HttpStatus.BAD_REQUEST);
        }
        const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new common_1.HttpException('Only PNG, JPEG, and WebP images are allowed', common_1.HttpStatus.BAD_REQUEST);
        }
        if (file.size > 2 * 1024 * 1024) {
            throw new common_1.HttpException('File size must be under 2MB', common_1.HttpStatus.BAD_REQUEST);
        }
        const ext = path.extname(file.originalname) || '.png';
        const filename = `signature_${Date.now()}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        fs.writeFileSync(filepath, file.buffer);
        const signatureImageUrl = `/api/organization-profile/files/${filename}`;
        await this.orgProfileService.updateProfile({ signatureImageUrl });
        this.logger.log(`Signature uploaded: ${filename}`);
        return { signatureImageUrl };
    }
    async serveFile(filename, res) {
        const safeName = path.basename(filename);
        const filepath = path.join(UPLOAD_DIR, safeName);
        if (!fs.existsSync(filepath)) {
            throw new common_1.HttpException('File not found', common_1.HttpStatus.NOT_FOUND);
        }
        const ext = path.extname(safeName).toLowerCase();
        const mimeMap = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
        };
        res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        fs.createReadStream(filepath).pipe(res);
    }
    async getEmailSettings() {
        const profile = await this.orgProfileService.getProfile();
        const configStatus = this.emailService.getConfigStatus();
        return {
            enableAutoEmail: profile.enableAutoEmail,
            smtpHost: profile.smtpHost,
            smtpPort: profile.smtpPort,
            smtpUser: profile.smtpUser,
            smtpSecureTls: profile.smtpSecureTls,
            emailFromName: profile.emailFromName,
            emailFromEmail: profile.emailFromEmail,
            hasPassword: !!profile.smtpPass,
            envConfigured: configStatus.configured,
            envSmtpUser: configStatus.smtpUser,
            envSmtpHost: configStatus.smtpHost,
        };
    }
    async updateEmailSettings(data) {
        if (data.emailFromEmail) {
            const plainEmailRegex = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
            const hasNameFormat = /<[^>]+>/.test(data.emailFromEmail);
            if (hasNameFormat || !plainEmailRegex.test(data.emailFromEmail)) {
                throw new common_1.HttpException('From Email must be a plain email address (e.g., noreply@example.com). Do not include name or angle brackets.', common_1.HttpStatus.BAD_REQUEST);
            }
        }
        try {
            this.orgProfileService.clearCache();
            const result = await this.orgProfileService.updateProfile(data);
            return {
                success: true,
                message: 'Email settings saved successfully',
                enableAutoEmail: result.enableAutoEmail,
                smtpHost: result.smtpHost,
                smtpPort: result.smtpPort,
                smtpUser: result.smtpUser,
                smtpSecureTls: result.smtpSecureTls,
                emailFromName: result.emailFromName,
                emailFromEmail: result.emailFromEmail,
                hasPassword: !!result.smtpPass,
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.HttpException(`Failed to save email settings: ${errorMsg}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async testEmail(data) {
        const configStatus = this.emailService.getConfigStatus();
        if (!configStatus.configured) {
            return {
                success: false,
                error: `Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables. ${configStatus.error || ''}`
            };
        }
        this.logger.log(`Sending test email to ${data.testEmail} using SMTP_USER: ${configStatus.smtpUser}`);
        try {
            const profile = await this.orgProfileService.getProfile();
            const result = await this.emailService.sendEmail({
                to: data.testEmail,
                subject: `Test Email from ${profile.name}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>This is a test email from <strong>${profile.name}</strong>.</p>
            <p>If you received this email, your SMTP settings are configured correctly.</p>
            <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Sent via SMTP_USER: ${configStatus.smtpUser}<br/>
              SMTP_HOST: ${configStatus.smtpHost}
            </p>
          </div>
        `,
                text: `This is a test email from ${profile.name}.\n\nIf you received this email, your SMTP settings are configured correctly.\n\nSent via SMTP_USER: ${configStatus.smtpUser}`,
                featureType: 'TEST',
            });
            if (result.success) {
                return { success: true, message: `Test email sent successfully via ${configStatus.smtpUser}` };
            }
            else {
                return { success: false, error: result.error };
            }
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Test email failed: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
    }
    async getEmailConfigStatus() {
        return this.emailService.getConfigStatus();
    }
    async getDonationNotificationSettings() {
        const profile = await this.orgProfileService.getProfile();
        const configStatus = this.emailService.getConfigStatus();
        return {
            enableDonationEmail: profile.enableDonationEmail,
            enableDonationWhatsApp: profile.enableDonationWhatsApp,
            enablePledgeWhatsApp: profile.enablePledgeWhatsApp,
            enableSpecialDayWhatsApp: profile.enableSpecialDayWhatsApp,
            enableFollowUpWhatsApp: profile.enableFollowUpWhatsApp,
            emailConfigured: configStatus.configured,
        };
    }
    async updateDonationNotificationSettings(data) {
        this.orgProfileService.clearCache();
        const result = await this.orgProfileService.updateProfile(data);
        return {
            success: true,
            enableDonationEmail: result.enableDonationEmail,
            enableDonationWhatsApp: result.enableDonationWhatsApp,
            enablePledgeWhatsApp: result.enablePledgeWhatsApp,
            enableSpecialDayWhatsApp: result.enableSpecialDayWhatsApp,
            enableFollowUpWhatsApp: result.enableFollowUpWhatsApp,
        };
    }
};
exports.OrganizationProfileController = OrganizationProfileController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrganizationProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('public'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrganizationProfileController.prototype, "getPublicProfile", null);
__decorate([
    (0, common_1.Put)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrganizationProfileController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('upload-logo'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrganizationProfileController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Post)('upload-signature'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrganizationProfileController.prototype, "uploadSignature", null);
__decorate([
    (0, common_1.Get)('files/:filename'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrganizationProfileController.prototype, "serveFile", null);
__decorate([
    (0, common_1.Get)('email-settings'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrganizationProfileController.prototype, "getEmailSettings", null);
__decorate([
    (0, common_1.Put)('email-settings'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrganizationProfileController.prototype, "updateEmailSettings", null);
__decorate([
    (0, common_1.Post)('test-email'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrganizationProfileController.prototype, "testEmail", null);
__decorate([
    (0, common_1.Get)('email-config-status'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrganizationProfileController.prototype, "getEmailConfigStatus", null);
__decorate([
    (0, common_1.Get)('donation-notification-settings'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrganizationProfileController.prototype, "getDonationNotificationSettings", null);
__decorate([
    (0, common_1.Put)('donation-notification-settings'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrganizationProfileController.prototype, "updateDonationNotificationSettings", null);
exports.OrganizationProfileController = OrganizationProfileController = OrganizationProfileController_1 = __decorate([
    (0, common_1.Controller)('organization-profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [organization_profile_service_1.OrganizationProfileService,
        email_service_1.EmailService])
], OrganizationProfileController);
//# sourceMappingURL=organization-profile.controller.js.map