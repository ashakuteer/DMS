export function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatCurrency(amount?: number | string, currency = "INR") {
  if (!amount) return "-";

  const value = typeof amount === "string" ? Number(amount) : amount;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getSponsorStatusBadgeVariant(status?: string) {
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

export function formatMonthDay(month?: number, day?: number) {
  if (!month || !day) return "-";

  const date = new Date(2000, month - 1, day);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function getRelationTypeLabel(type?: string) {
  const map: Record<string, string> = {
    SPOUSE: "Spouse",
    CHILD: "Child",
    FATHER: "Father",
    MOTHER: "Mother",
    SIBLING: "Sibling",
    IN_LAW: "In-law",
    GRANDPARENT: "Grandparent",
    OTHER: "Other",
  };

  return map[type || ""] || type || "-";
}

export function getOccasionTypeLabel(type?: string) {
  const map: Record<string, string> = {
    DOB_SELF: "Birthday",
    DOB_SPOUSE: "Spouse Birthday",
    DOB_CHILD: "Child Birthday",
    ANNIVERSARY: "Anniversary",
    DEATH_ANNIVERSARY: "Memorial Day",
    OTHER: "Other",
  };

  return map[type || ""] || type || "-";
}
export function getCategoryColor(category: string) {
  switch (category) {
    case "INDIVIDUAL":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "CSR_REP":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "NGO":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "WHATSAPP_GROUP":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}
