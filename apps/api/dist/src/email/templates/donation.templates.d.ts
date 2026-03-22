export type DonationEmailType = 'GENERAL' | 'TAX' | 'KIND';
export interface DonationTemplateParams {
    donorName: string;
    receiptNumber: string;
    donationAmount?: number;
    currency?: string;
    donationDate?: Date;
    donationMode?: string;
    donationType?: string;
    donorPAN?: string;
    kindDescription?: string;
    org: {
        name: string;
        regNumber?: string;
        phone1?: string;
        phone2?: string;
        email?: string;
        website?: string;
        tagline1?: string;
        tagline2?: string;
    };
}
export declare function getGeneralThankYouTemplate(params: DonationTemplateParams): {
    subject: string;
    html: string;
    text: string;
};
export declare function getTaxReceiptTemplate(params: DonationTemplateParams): {
    subject: string;
    html: string;
    text: string;
};
export declare function getKindDonationTemplate(params: DonationTemplateParams): {
    subject: string;
    html: string;
    text: string;
};
export declare function getDonationEmailTemplate(type: DonationEmailType, params: DonationTemplateParams): {
    subject: string;
    html: string;
    text: string;
};
