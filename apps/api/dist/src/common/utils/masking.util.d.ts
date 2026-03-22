export declare function maskPhone(phone: string | null | undefined): string | null;
export declare function maskEmail(email: string | null | undefined): string | null;
export interface MaskOptions {
    maskPhone?: boolean;
    maskEmail?: boolean;
}
export declare function maskDonorData<T extends Record<string, unknown>>(donor: T, options?: MaskOptions): T;
export declare function maskDonorInDonation<T extends Record<string, unknown>>(donation: T): T;
