import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
export interface ReceiptData {
    receiptNumber: string;
    donationDate: Date;
    donorName: string;
    donationAmount: number;
    currency: string;
    paymentMode?: string | null;
    donationType: string;
    remarks?: string;
    donorAddress?: string;
    donorEmail?: string;
    donorPAN?: string;
    transactionRef?: string;
    designatedHome?: string | null;
    receiptType?: 'GENERAL' | 'TAX';
}
export interface AcknowledgementData {
    ackNumber: string;
    donationDate: Date;
    donorName: string;
    donationType: string;
    estimatedValue?: number;
    currency?: string;
    designatedHome?: string | null;
    remarks?: string;
    donorEmail?: string;
}
export declare function isInKindDonation(donationType: string): boolean;
export declare class ReceiptService {
    private orgProfileService;
    private readonly logger;
    constructor(orgProfileService: OrganizationProfileService);
    private numberToWords;
    private formatDate;
    private formatPaymentMode;
    private formatDonationType;
    private formatHome;
    private drawHeader;
    private drawTitleBand;
    private drawField;
    private drawRule;
    private drawFooter;
    private drawHomesBar;
    generateReceiptPDF(data: ReceiptData): Promise<Buffer>;
    generateAcknowledgementPDF(data: AcknowledgementData): Promise<Buffer>;
}
