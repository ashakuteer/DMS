import { useState, useCallback, useEffect } from "react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import type { Donation, Donor, Template } from "../types";

export function useDonorCommunication(
  donorId: string,
  donor?: Donor | null,
  externalDonations?: Donation[]
) {
  const [communicationLogs, setCommunicationLogs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const user = authStorage.getUser();
  const canSendWhatsApp = hasPermission(user?.role, "communication", "whatsapp");
  const canSendEmail = hasPermission(user?.role, "communication", "email");
  const hasWhatsAppNumber = !!(donor?.whatsappPhone || donor?.primaryPhone);
  const hasEmail = !!(donor?.personalEmail || donor?.officialEmail);
  const donorName = donor
    ? [donor.firstName, donor.middleName, donor.lastName].filter(Boolean).join(" ") || donor.donorCode
    : "";

  const effectiveDonations = externalDonations ?? donations;

  const fetchCommunicationLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/communication-logs/donor/${donorId}`);
      if (res.ok) {
        const data = await res.json();
        setCommunicationLogs(data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  }, []);

  const fetchDonations = useCallback(async () => {
    if (externalDonations) return;
    try {
      const res = await fetchWithAuth(`/api/donations?donorId=${donorId}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setDonations(data.items || []);
      }
    } catch {
      console.error("Failed to fetch donations for communication");
    }
  }, [donorId, externalDonations]);

  useEffect(() => {
    fetchCommunicationLogs();
    fetchTemplates();
    fetchDonations();
  }, [fetchCommunicationLogs, fetchTemplates, fetchDonations]);

  const resolvePlaceholders = useCallback((template: string, donation?: Donation): string => {
    let result = template;
    result = result.replace(/\{\{donorName\}\}/g, donorName);
    result = result.replace(/\{\{phone\}\}/g, donor?.primaryPhone || "");
    if (donation) {
      result = result.replace(/\{\{amount\}\}/g, donation.donationAmount || "");
      result = result.replace(/\{\{date\}\}/g, donation.donationDate || "");
      result = result.replace(/\{\{receipt\}\}/g, donation.receiptNumber || "");
    }
    return result;
  }, [donorName, donor]);

  const copyToClipboard = useCallback((text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => {
      console.error("Failed to copy to clipboard");
    });
  }, []);

  const openWhatsApp = useCallback((
    message: string,
    _templateId?: string,
    _donationId?: string,
    _type?: string,
  ) => {
    const phone = donor?.whatsappPhone || donor?.primaryPhone || "";
    if (!phone) return;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${encoded}`, "_blank");
  }, [donor]);

  const openEmailComposer = useCallback((
    _template: Template | null,
    _donation: Donation | null
  ) => {
    const email = donor?.personalEmail || donor?.officialEmail || "";
    if (!email) return;
    window.open(`mailto:${email}`, "_blank");
  }, [donor]);

  return {
    communicationLogs,
    templates,
    donations: effectiveDonations,
    loading,
    copiedField,
    canSendWhatsApp,
    canSendEmail,
    hasWhatsAppNumber,
    hasEmail,
    donorName,
    fetchCommunicationLogs,
    fetchTemplates,
    resolvePlaceholders,
    copyToClipboard,
    openWhatsApp,
    openEmailComposer,
  };
}
