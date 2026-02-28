import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface OrganizationProfileData {
  id: string;
  name: string;
  tagline1: string;
  tagline2: string;
  logoUrl: string | null;
  brandingPrimaryColor: string;
  reportHeaderText: string | null;
  reportFooterText: string | null;
  signatureImageUrl: string | null;
  phone1: string;
  phone2: string;
  email: string;
  website: string;
  pan: string;
  section80GText: string;
  homes: string[];
  enableAutoEmail: boolean;
  enableDonationEmail: boolean;
  enableDonationWhatsApp: boolean;
  enablePledgeWhatsApp: boolean;
  enableSpecialDayWhatsApp: boolean;
  enableFollowUpWhatsApp: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpSecureTls: boolean;
  emailFromName: string | null;
  emailFromEmail: string | null;
}

@Injectable()
export class OrganizationProfileService {
  private readonly logger = new Logger(OrganizationProfileService.name);
  private cache: OrganizationProfileData | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(private prisma: PrismaService) {}

  async getProfile(): Promise<OrganizationProfileData> {
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

  private mapProfileToData(profile: any): OrganizationProfileData {
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

  async updateProfile(data: Partial<Omit<OrganizationProfileData, 'id'>>): Promise<OrganizationProfileData> {
    let profile = await this.prisma.organizationProfile.findFirst();

    if (!profile) {
      profile = await this.prisma.organizationProfile.create({
        data: {
          ...data,
        },
      });
    } else {
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

  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }

  async getPhoneFormatted(): Promise<string> {
    const profile = await this.getProfile();
    return `${profile.phone1} / ${profile.phone2}`;
  }
}
