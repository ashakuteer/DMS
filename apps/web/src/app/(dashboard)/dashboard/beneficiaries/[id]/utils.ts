import { format } from "date-fns";

/* -------------------------------- */
/* Home Type Helpers */
/* -------------------------------- */

export function getHomeTypeLabel(homeType: string) {
  switch (homeType) {
    case "ORPHAN_GIRLS":
      return "Orphan Girls Home";
    case "BLIND_BOYS":
      return "Visually Challenged Boys Home";
    case "OLD_AGE":
      return "Old Age Home";
    default:
      return homeType;
  }
}

export function getHomeTypeBadgeColor(homeType: string) {
  switch (homeType) {
    case "ORPHAN_GIRLS":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
    case "BLIND_BOYS":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "OLD_AGE":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "";
  }
}

/* -------------------------------- */
/* Age Formatting */
/* -------------------------------- */

export function formatAge(dobDay?: number, dobMonth?: number, dobYear?: number, approxAge?: number) {
  if (dobDay && dobMonth && dobYear) {
    const birthDate = new Date(dobYear, dobMonth - 1, dobDay);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return `${age} yrs`;
  }

  if (approxAge) {
    return `~${approxAge} yrs`;
  }

  return "Unknown";
}

/* -------------------------------- */
/* Currency */
/* -------------------------------- */

export function formatAmount(amount: number, currency: string = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/* -------------------------------- */
/* Sponsorship Status Badge */
/* -------------------------------- */

export function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "ACTIVE":
      return "default";

    case "PAUSED":
      return "secondary";

    case "COMPLETED":
      return "outline";

    case "STOPPED":
      return "destructive";

    default:
      return "secondary";
  }
}

/* -------------------------------- */
/* Health Helpers */
/* -------------------------------- */

export function getSeverityBadgeClass(severity: string) {
  switch (severity) {
    case "LOW":
      return "bg-green-100 text-green-800";

    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800";

    case "HIGH":
      return "bg-orange-100 text-orange-800";

    case "CRITICAL":
      return "bg-red-100 text-red-800";

    default:
      return "";
  }
}

export function getHealthStatusBadgeClass(status: string) {
  switch (status) {
    case "NORMAL":
      return "bg-green-100 text-green-800";

    case "SICK":
      return "bg-yellow-100 text-yellow-800";

    case "HOSPITALIZED":
      return "bg-red-100 text-red-800";

    case "UNDER_TREATMENT":
      return "bg-orange-100 text-orange-800";

    default:
      return "";
  }
}

export function getHealthStatusLabel(status: string) {
  switch (status) {
    case "NORMAL":
      return "Normal";

    case "SICK":
      return "Sick";

    case "HOSPITALIZED":
      return "Hospitalized";

    case "UNDER_TREATMENT":
      return "Under Treatment";

    default:
      return status;
  }
}

/* -------------------------------- */
/* Progress Term */
/* -------------------------------- */

export function getTermLabel(term: string) {
  switch (term) {
    case "TERM_1":
      return "Term 1";

    case "TERM_2":
      return "Term 2";

    case "TERM_3":
      return "Term 3";

    case "ANNUAL":
      return "Annual";

    default:
      return term;
  }
}

/* -------------------------------- */
/* File Size */
/* -------------------------------- */

export function formatFileSize(bytes: number) {
  if (!bytes) return "0 KB";

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;

  return `${mb.toFixed(2)} MB`;
}

/* -------------------------------- */
/* WhatsApp Message Generator */
/* -------------------------------- */

export function generateWhatsAppMessage(name: string, beneficiaryName: string) {
  return `Dear ${name},

Thank you for supporting ${beneficiaryName} through Asha Kuteer Foundation.

We truly appreciate your kindness and continued support.

Warm regards,
Asha Kuteer Foundation`;
}
