import { DonorHealth } from './reports.types';

export function calculateDonorHealth(lastDonationDate: Date | null): DonorHealth {
  if (!lastDonationDate) return 'DORMANT';

  const daysSince = Math.floor(
    (Date.now() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSince < 60) return 'HEALTHY';
  if (daysSince < 120) return 'AT_RISK';
  return 'DORMANT';
}

export function getFinancialYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month >= 3) {
    return `FY ${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `FY ${year - 1}-${year.toString().slice(-2)}`;
  }
}

export function getFYDates(fyType: 'current' | 'last'): { start: Date; end: Date } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let fyStartYear: number;
  if (currentMonth >= 3) {
    fyStartYear = fyType === 'current' ? currentYear : currentYear - 1;
  } else {
    fyStartYear = fyType === 'current' ? currentYear - 1 : currentYear - 2;
  }

  const start = new Date(fyStartYear, 3, 1);
  const end = new Date(fyStartYear + 1, 2, 31, 23, 59, 59);

  return { start, end };
}

export function buildDateFilter(filter: { startDate?: string; endDate?: string }) {
  const where: any = {};
  if (filter.startDate) {
    where.donationDate = { ...where.donationDate, gte: new Date(filter.startDate) };
  }
  if (filter.endDate) {
    where.donationDate = { ...where.donationDate, lte: new Date(filter.endDate) };
  }
  return where;
}

export function formatLakh(amount: number): string {
  const lakh = amount / 100000;
  if (lakh >= 1) {
    return `Rs. ${lakh.toFixed(2)} Lakh`;
  } else if (amount >= 1000) {
    return `Rs. ${(amount / 1000).toFixed(2)}K`;
  }
  return `Rs. ${amount.toFixed(0)}`;
}
