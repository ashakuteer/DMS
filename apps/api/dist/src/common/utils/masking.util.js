"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskPhone = maskPhone;
exports.maskEmail = maskEmail;
exports.maskDonorData = maskDonorData;
exports.maskDonorInDonation = maskDonorInDonation;
function maskPhone(phone) {
    if (!phone)
        return null;
    return phone
        .split('')
        .map((char, i) => (i === 0 ? char : i % 2 === 1 ? '*' : char))
        .join('');
}
function maskEmail(email) {
    if (!email)
        return null;
    const atIndex = email.indexOf('@');
    if (atIndex < 0)
        return '*****';
    const localPart = email.substring(0, atIndex);
    const domain = email.substring(atIndex);
    const maskedLocal = localPart
        .split('')
        .map((char, i) => (i % 2 === 1 ? '*' : char))
        .join('');
    return `${maskedLocal}${domain}`;
}
function maskDonorData(donor, options = { maskPhone: true, maskEmail: true }) {
    if (!donor)
        return donor;
    const masked = { ...donor };
    if (options.maskPhone) {
        if ('primaryPhone' in masked) {
            masked.primaryPhone = maskPhone(masked.primaryPhone);
        }
        if ('alternatePhone' in masked) {
            masked.alternatePhone = maskPhone(masked.alternatePhone);
        }
        if ('whatsappPhone' in masked) {
            masked.whatsappPhone = maskPhone(masked.whatsappPhone);
        }
    }
    if (options.maskEmail) {
        if ('personalEmail' in masked) {
            masked.personalEmail = maskEmail(masked.personalEmail);
        }
        if ('officialEmail' in masked) {
            masked.officialEmail = maskEmail(masked.officialEmail);
        }
    }
    return masked;
}
function maskDonorInDonation(donation) {
    if (!donation)
        return donation;
    const masked = { ...donation };
    if ('donor' in masked && masked.donor) {
        masked.donor = maskDonorData(masked.donor);
    }
    return masked;
}
//# sourceMappingURL=masking.util.js.map