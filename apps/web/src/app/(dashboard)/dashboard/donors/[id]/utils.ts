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
    SELF: "Self",
    SELF_AND_SPOUSE: "Self & Spouse",
    PARENTS: "Parents",
    GRANDPARENTS: "Grandparents",
    GRANDCHILDREN: "Grandchildren",
    FAMILY: "Family",
    SPOUSE: "Spouse",
    SON: "Son",
    DAUGHTER: "Daughter",
    CHILD: "Child",
    FATHER: "Father",
    MOTHER: "Mother",
    BROTHER: "Brother",
    SISTER: "Sister",
    SIBLING: "Sibling",
    FATHER_IN_LAW: "Father-in-law",
    MOTHER_IN_LAW: "Mother-in-law",
    BROTHER_IN_LAW: "Brother-in-law",
    SISTER_IN_LAW: "Sister-in-law",
    SON_IN_LAW: "Son-in-law",
    DAUGHTER_IN_LAW: "Daughter-in-law",
    IN_LAW: "In-law",
    GRANDFATHER: "Grandfather",
    GRANDMOTHER: "Grandmother",
    GRANDPARENT: "Grandparent",
    GRANDSON: "Grandson",
    GRANDDAUGHTER: "Granddaughter",
    GRANDCHILD: "Grandchild",
    COUSIN: "Cousin",
    UNCLE: "Uncle",
    AUNT: "Aunt",
    FIANCE: "Fiancé",
    FIANCEE: "Fiancée",
    FRIEND: "Friend",
    COLLEAGUE: "Colleague",
    BOSS: "Boss",
    MENTOR: "Mentor",
    OTHER: "Other",
  };

  return map[type || ""] || type || "-";
}

export function getUnifiedOccasionTypeLabel(occasionType?: string) {
  const map: Record<string, string> = {
    BIRTHDAY_SELF: "Birthday (Self)",
    BIRTHDAY: "Birthday",
    ANNIVERSARY_SELF: "Wedding Anniversary (Self)",
    ANNIVERSARY: "Wedding Anniversary",
    MEMORIAL_DAY: "Memorial Day",
    OTHER: "Other",
  };
  return map[occasionType || ""] || occasionType || "-";
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
export function getPledgeTypeLabel(type: string) {
  const labels: Record<string, string> = {
    MONEY: "Money",
    RICE: "Rice",
    GROCERIES: "Groceries",
    MEDICINES: "Medicines",
    MEAL_SPONSOR: "Meal Sponsor",
    VISIT: "Visit",
    OTHER: "Other",
  };
  return labels[type] || type;
}

export function getPledgeStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "FULFILLED":
      return "default";
    case "POSTPONED":
      return "outline";
    case "CANCELLED":
      return "destructive";
    default:
      return "secondary";
  }
}

export interface LoyaltyTier {
  label: string;
  colorClass: string;
  years: number;
}

export function getDonorLoyaltyTier(donorSince?: string | null): LoyaltyTier {
  if (!donorSince) {
    return { label: "New Donor", colorClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", years: 0 };
  }
  const years = new Date().getFullYear() - new Date(donorSince).getFullYear();
  if (years >= 7) return { label: "Champion Donor", colorClass: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", years };
  if (years >= 3) return { label: "Loyal Donor",    colorClass: "bg-[#E6F4F1] text-[#5FA8A8] dark:bg-[#5FA8A8]/20 dark:text-[#A8D5D1]", years };
  if (years >= 1) return { label: "Active Donor",   colorClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", years };
  return { label: "New Donor", colorClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", years };
}
