import { Injectable } from "@nestjs/common";

@Injectable()
export class ImportNormalizerService {

  normalizePhone(phone?: string): string | null {
    if (!phone) return null;

    const cleaned = String(phone).replace(/[\\s\\-()\\+]/g, "");

    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return cleaned.slice(2);
    }

    if (cleaned.length >= 10) {
      return cleaned.slice(-10);
    }

    return cleaned;
  }

  normalizeEmail(email?: string): string | null {
    if (!email) return null;

    const trimmed = email.trim().toLowerCase();

    if (trimmed.includes("@") && trimmed.includes(".")) {
      return trimmed;
    }

    return null;
  }
}
