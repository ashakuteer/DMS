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
export declare class OrganizationProfileService {
    private prisma;
    private readonly logger;
    private cache;
    private cacheExpiry;
    private readonly CACHE_TTL_MS;
    constructor(prisma: PrismaService);
    getProfile(): Promise<OrganizationProfileData>;
    private mapProfileToData;
    updateProfile(data: Partial<Omit<OrganizationProfileData, 'id'>>): Promise<OrganizationProfileData>;
    clearCache(): void;
    getPhoneFormatted(): Promise<string>;
}
