import { fetchWithAuth } from "./auth";

export type WhatsAppTemplateKey =
  | "DONATION_THANK_YOU"
  | "PLEDGE_DUE"
  | "SPECIAL_DAY_WISH"
  | "FOLLOWUP_REMINDER";

function normalizeToE164(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("91") && cleaned.length >= 12) return `+${cleaned}`;
  return `+91${cleaned}`;
}

export async function sendWhatsAppByKey(
  donorId: string,
  phone: string,
  templateKey: WhatsAppTemplateKey,
  variables?: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
  const toE164 = normalizeToE164(phone);
  const res = await fetchWithAuth("/api/communications/whatsapp/send-by-key", {
    method: "POST",
    body: JSON.stringify({ donorId, toE164, templateKey, variables }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: data.message || "Failed to send WhatsApp" };
  }
  return { success: true };
}

export async function sendWhatsAppDirect(
  donorId: string,
  phone: string,
  message: string,
  logType?: string,
): Promise<{ success: boolean; error?: string }> {
  const toE164 = normalizeToE164(phone);
  const res = await fetchWithAuth("/api/communications/whatsapp/send-freeform", {
    method: "POST",
    body: JSON.stringify({ donorId, toE164, message, type: logType }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.message || "Failed to send WhatsApp" };
  }
  return { success: true };
}
