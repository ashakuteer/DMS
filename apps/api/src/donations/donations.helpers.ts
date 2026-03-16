export function getHomeTypeLabel(homeType?: string): string {
  switch (homeType) {
    case 'GIRLS_HOME':
      return 'Girls Home';
    case 'BLIND_BOYS_HOME':
      return 'Blind Boys Home';
    case 'OLD_AGE_HOME':
      return 'Old Age Home';
    case 'GENERAL':
      return 'General';
    default:
      return '-';
  }
}
