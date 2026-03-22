import { OrganizationProfileService } from './organization-profile.service';
import { EmailService } from '../email/email.service';
import { Response } from 'express';
export declare class OrganizationProfileController {
    private readonly orgProfileService;
    private readonly emailService;
    private readonly logger;
    constructor(orgProfileService: OrganizationProfileService, emailService: EmailService);
    getProfile(): Promise<import("./organization-profile.service").OrganizationProfileData>;
    getPublicProfile(): Promise<{
        name: string;
        tagline1: string;
        tagline2: string;
        logoUrl: string;
        brandingPrimaryColor: string;
        phone1: string;
        phone2: string;
        email: string;
        website: string;
        pan: string;
        section80GText: string;
        homes: string[];
    }>;
    updateProfile(data: {
        name?: string;
        tagline1?: string;
        tagline2?: string;
        logoUrl?: string;
        brandingPrimaryColor?: string;
        reportHeaderText?: string;
        reportFooterText?: string;
        signatureImageUrl?: string;
        phone1?: string;
        phone2?: string;
        email?: string;
        website?: string;
        pan?: string;
        section80GText?: string;
        homes?: string[];
    }): Promise<import("./organization-profile.service").OrganizationProfileData>;
    uploadLogo(file: Express.Multer.File): Promise<{
        logoUrl: string;
    }>;
    uploadSignature(file: Express.Multer.File): Promise<{
        signatureImageUrl: string;
    }>;
    serveFile(filename: string, res: Response): Promise<void>;
    getEmailSettings(): Promise<{
        enableAutoEmail: boolean;
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpSecureTls: boolean;
        emailFromName: string;
        emailFromEmail: string;
        hasPassword: boolean;
        envConfigured: boolean;
        envSmtpUser: string;
        envSmtpHost: string;
    }>;
    updateEmailSettings(data: {
        enableAutoEmail?: boolean;
        smtpHost?: string;
        smtpPort?: number;
        smtpUser?: string;
        smtpPass?: string;
        smtpSecureTls?: boolean;
        emailFromName?: string;
        emailFromEmail?: string;
    }): Promise<{
        success: boolean;
        message: string;
        enableAutoEmail: boolean;
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpSecureTls: boolean;
        emailFromName: string;
        emailFromEmail: string;
        hasPassword: boolean;
    }>;
    testEmail(data: {
        testEmail: string;
    }): Promise<{
        success: boolean;
        error: string;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
    }>;
    getEmailConfigStatus(): Promise<import("../email/email.service").EmailConfigStatus>;
    getDonationNotificationSettings(): Promise<{
        enableDonationEmail: boolean;
        enableDonationWhatsApp: boolean;
        enablePledgeWhatsApp: boolean;
        enableSpecialDayWhatsApp: boolean;
        enableFollowUpWhatsApp: boolean;
        emailConfigured: boolean;
    }>;
    updateDonationNotificationSettings(data: {
        enableDonationEmail?: boolean;
        enableDonationWhatsApp?: boolean;
        enablePledgeWhatsApp?: boolean;
        enableSpecialDayWhatsApp?: boolean;
        enableFollowUpWhatsApp?: boolean;
    }): Promise<{
        success: boolean;
        enableDonationEmail: boolean;
        enableDonationWhatsApp: boolean;
        enablePledgeWhatsApp: boolean;
        enableSpecialDayWhatsApp: boolean;
        enableFollowUpWhatsApp: boolean;
    }>;
}
