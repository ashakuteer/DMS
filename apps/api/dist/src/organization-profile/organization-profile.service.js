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
var OrganizationProfileService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrganizationProfileService = OrganizationProfileService_1 = class OrganizationProfileService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(OrganizationProfileService_1.name);
        this.cache = null;
        this.cacheExpiry = 0;
        this.CACHE_TTL_MS = 5 * 60 * 1000;
    }
    async getProfile() {
        const now = Date.now();
        if (this.cache && now < this.cacheExpiry) {
            return this.cache;
        }
        let profile = await this.prisma.organizationProfile.findFirst();
        if (!profile) {
            profile = await this.prisma.organizationProfile.create({
                data: {},
            });
            this.logger.log('Created default organization profile');
        }
        this.cache = this.mapProfileToData(profile);
        this.cacheExpiry = now + this.CACHE_TTL_MS;
        return this.cache;
    }
    mapProfileToData(profile) {
        return {
            id: profile.id,
            name: profile.name,
            tagline1: profile.tagline1,
            tagline2: profile.tagline2,
            logoUrl: profile.logoUrl,
            brandingPrimaryColor: profile.brandingPrimaryColor || '#2E7D32',
            reportHeaderText: profile.reportHeaderText,
            reportFooterText: profile.reportFooterText,
            signatureImageUrl: profile.signatureImageUrl,
            phone1: profile.phone1,
            phone2: profile.phone2,
            email: profile.email,
            website: profile.website,
            pan: profile.pan,
            section80GText: profile.section80GText,
            homes: profile.homes,
            enableAutoEmail: profile.enableAutoEmail,
            enableDonationEmail: profile.enableDonationEmail,
            enableDonationWhatsApp: profile.enableDonationWhatsApp,
            enablePledgeWhatsApp: profile.enablePledgeWhatsApp,
            enableSpecialDayWhatsApp: profile.enableSpecialDayWhatsApp,
            enableFollowUpWhatsApp: profile.enableFollowUpWhatsApp,
            smtpHost: profile.smtpHost,
            smtpPort: profile.smtpPort,
            smtpUser: profile.smtpUser,
            smtpPass: profile.smtpPass,
            smtpSecureTls: profile.smtpSecureTls,
            emailFromName: profile.emailFromName,
            emailFromEmail: profile.emailFromEmail,
        };
    }
    async updateProfile(data) {
        let profile = await this.prisma.organizationProfile.findFirst();
        if (!profile) {
            profile = await this.prisma.organizationProfile.create({
                data: {
                    ...data,
                },
            });
        }
        else {
            profile = await this.prisma.organizationProfile.update({
                where: { id: profile.id },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
            });
        }
        this.cache = this.mapProfileToData(profile);
        this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;
        this.logger.log('Organization profile updated');
        return this.cache;
    }
    clearCache() {
        this.cache = null;
        this.cacheExpiry = 0;
    }
    async getPhoneFormatted() {
        const profile = await this.getProfile();
        return `${profile.phone1} / ${profile.phone2}`;
    }
};
exports.OrganizationProfileService = OrganizationProfileService;
exports.OrganizationProfileService = OrganizationProfileService = OrganizationProfileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationProfileService);
//# sourceMappingURL=organization-profile.service.js.map