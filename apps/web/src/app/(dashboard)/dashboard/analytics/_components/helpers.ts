export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
];

export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export const homeLabels: Record<string, string> = {
  GIRLS_HOME: "Girls Home",
  BLIND_BOYS_HOME: "Blind Boys Home",
  OLD_AGE_HOME: "Old Age Home",
  GENERAL: "General",
  UNSPECIFIED: "Not Specified",
  ORPHAN_GIRLS: "Girls Home",
  BLIND_BOYS: "Blind Boys Home",
  OLD_AGE: "Old Age Home",
};

export const typeLabels: Record<string, string> = {
  CASH: "Cash",
  ANNADANAM: "Annadanam",
  GROCERIES: "Groceries",
  GROCERY: "Grocery",
  MEDICINES: "Medicines",
  RICE_BAGS: "Rice Bags",
  STATIONERY: "Stationery",
  SPORTS_KITS: "Sports Kits",
  USED_ITEMS: "Used Items",
  PREPARED_FOOD: "Prepared Food",
  KIND: "In-Kind",
  OTHER: "Other",
};

export const occasionLabels: Record<string, string> = {
  DOB_SELF: "Birthday",
  DOB_SPOUSE: "Spouse Birthday",
  DOB_CHILD: "Child Birthday",
  ANNIVERSARY: "Anniversary",
  DEATH_ANNIVERSARY: "Death Anniversary",
  OTHER: "Other",
};
