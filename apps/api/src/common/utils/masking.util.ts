export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return phone
    .split('')
    .map((char, i) => (i === 0 ? char : i % 2 === 1 ? '*' : char))
    .join('');
}

export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const atIndex = email.indexOf('@');
  if (atIndex < 0) return '*****';
  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex);
  const maskedLocal = localPart
    .split('')
    .map((char, i) => (i % 2 === 1 ? '*' : char))
    .join('');
  return `${maskedLocal}${domain}`;
}

export interface MaskOptions {
  maskPhone?: boolean;
  maskEmail?: boolean;
}

export function maskDonorData<T extends Record<string, unknown>>(
  donor: T,
  options: MaskOptions = { maskPhone: true, maskEmail: true },
): T {
  if (!donor) return donor;

  const masked = { ...donor } as Record<string, unknown>;

  if (options.maskPhone) {
    if ('primaryPhone' in masked) {
      masked.primaryPhone = maskPhone(masked.primaryPhone as string);
    }
    if ('alternatePhone' in masked) {
      masked.alternatePhone = maskPhone(masked.alternatePhone as string);
    }
    if ('whatsappPhone' in masked) {
      masked.whatsappPhone = maskPhone(masked.whatsappPhone as string);
    }
  }

  if (options.maskEmail) {
    if ('personalEmail' in masked) {
      masked.personalEmail = maskEmail(masked.personalEmail as string);
    }
    if ('officialEmail' in masked) {
      masked.officialEmail = maskEmail(masked.officialEmail as string);
    }
  }

  return masked as T;
}

export function maskDonorInDonation<T extends Record<string, unknown>>(
  donation: T,
): T {
  if (!donation) return donation;
  const masked = { ...donation } as Record<string, unknown>;

  if ('donor' in masked && masked.donor) {
    masked.donor = maskDonorData(masked.donor as Record<string, unknown>);
  }

  return masked as T;
}
