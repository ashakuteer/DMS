export interface BrandingProfile {
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
}
export declare function resolveLocalFile(url: string | null): string | null;
export declare function resolveLogoPath(logoUrl: string | null): string | null;
export declare function addBrandedHeader(doc: PDFKit.PDFDocument, profile: BrandingProfile, reportTitle: string, options?: {
    headerHeight?: number;
    startY?: number;
    showDate?: boolean;
}): number;
export declare function addBrandedFooter(doc: PDFKit.PDFDocument, profile: BrandingProfile, options?: {
    showConfidential?: boolean;
    showPageNumbers?: boolean;
}): void;
export declare function addBrandedWatermark(doc: PDFKit.PDFDocument, orgName: string): void;
export declare function getBrandedPrimaryColor(profile: BrandingProfile): string;
export declare function addReceiptBranding(doc: PDFKit.PDFDocument, profile: BrandingProfile, options: {
    y: number;
    contentWidth: number;
    margin: number;
}): number;
export declare function addReceiptFooterBranding(doc: PDFKit.PDFDocument, profile: BrandingProfile, options: {
    y: number;
    contentWidth: number;
    margin: number;
}): number;
