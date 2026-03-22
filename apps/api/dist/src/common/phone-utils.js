"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeToE164 = normalizeToE164;
function normalizeToE164(rawPhone, phoneCode) {
    if (!rawPhone || typeof rawPhone !== "string") {
        return null;
    }
    let normalized = rawPhone.replace(/[^\d+]/g, "");
    if (!normalized) {
        return null;
    }
    if (normalized.startsWith("+")) {
        const digitsOnly = normalized.substring(1).replace(/[^\d]/g, "");
        const numberPart = digitsOnly.replace(/^0+/, "");
        if (numberPart.length < 10) {
            return null;
        }
        return `+${numberPart}`;
    }
    let digits = normalized.replace(/^0+/, "");
    if (!digits) {
        return null;
    }
    let code = phoneCode || "91";
    if (code.startsWith("+")) {
        code = code.substring(1);
    }
    code = code.replace(/^0+/, "");
    const e164 = `+${code}${digits}`;
    const finalDigits = e164.substring(1).replace(/[^\d]/g, "");
    if (finalDigits.length < 10) {
        return null;
    }
    return e164;
}
//# sourceMappingURL=phone-utils.js.map