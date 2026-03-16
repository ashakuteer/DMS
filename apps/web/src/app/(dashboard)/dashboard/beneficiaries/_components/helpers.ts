export const HOME_TYPES = [
  { value: "all", label: "All Homes" },
  { value: "ORPHAN_GIRLS", label: "Orphan Girls Home" },
  { value: "BLIND_BOYS", label: "Visually Challenged Boys Home" },
  { value: "OLD_AGE", label: "Old Age Home" },
];

export const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export const SPONSORED_OPTIONS = [
  { value: "all", label: "All" },
  { value: "true", label: "Sponsored" },
  { value: "false", label: "Not Sponsored" },
];

export const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export function getHomeTypeBadgeColor(homeType: string): string {
  switch (homeType) {
    case 'ORPHAN_GIRLS':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
    case 'BLIND_BOYS':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'OLD_AGE':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
}

export function getHomeTypeLabel(homeType: string): string {
  switch (homeType) {
    case 'ORPHAN_GIRLS':
      return 'Orphan Girls';
    case 'BLIND_BOYS':
      return 'Blind Boys';
    case 'OLD_AGE':
      return 'Old Age';
    default:
      return homeType;
  }
}

export function formatAge(dobDay?: number, dobMonth?: number, approxAge?: number): string {
  if (approxAge) {
    return `~${approxAge} yrs`;
  }
  if (dobMonth) {
    const month = MONTHS.find(m => m.value === dobMonth);
    if (dobDay) {
      return `${month?.label} ${dobDay}`;
    }
    return month?.label || '-';
  }
  return '-';
}
