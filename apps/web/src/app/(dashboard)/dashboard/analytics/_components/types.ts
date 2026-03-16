export interface Summary {
  totalDonors: number;
  donationsThisMonth: number;
  donationsThisMonthTrend: number | null;
  donationsT12: number;
  donationCountThisMonth: number;
  donationCountTrend: number | null;
  activeSponsorships: number;
  activeSponsorshipsMonthlyTotal: number;
  overdueSponsorships: number;
  pledgesPendingCount: number;
  pledgesPendingAmount: number;
  donorsWithSpecialDaysNext30: number;
  donorsAtRisk: number;
}

export interface MonthlyData {
  month: string;
  amount: number;
  count: number;
}

export interface TypeData {
  type: string;
  amount: number;
  count: number;
}

export interface HomeData {
  home: string;
  amount: number;
  count: number;
}

export interface SponsorshipDueChart {
  month: string;
  activeDue: number;
  overdue: number;
}

export interface Charts {
  monthlyDonations: MonthlyData[];
  donationsByType: TypeData[];
  donationsByHome: HomeData[];
  sponsorshipsDue: SponsorshipDueChart[];
}

export interface TopDonor {
  donorId: string;
  donorCode: string;
  donorName: string;
  totalAmount: number;
  count: number;
  lastDonationDate: string | null;
}

export interface AtRiskDonor {
  donorId: string;
  donorCode: string;
  donorName: string;
  lastDonationDate: string;
  expectedNextDate: string;
  riskLevel: string;
  overdueDays: number;
  hasEmail: boolean;
  hasWhatsApp: boolean;
}

export interface PledgeItem {
  id: string;
  donorId: string;
  donorCode: string;
  donorName: string;
  pledgeType: string;
  amount: number | null;
  quantity: string | null;
  expectedDate: string;
  status: string;
  notes: string | null;
  hasEmail: boolean;
  hasWhatsApp: boolean;
}

export interface SponsorshipDue {
  id: string;
  donorId: string;
  donorCode: string;
  donorName: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryCode: string;
  homeType: string;
  amount: number;
  dueDay: number;
  isOverdue: boolean;
  isDueSoon: boolean;
  status: string;
  hasEmail: boolean;
  hasWhatsApp: boolean;
}

export interface SpecialDay {
  id: string;
  donorId: string;
  donorCode: string;
  donorName: string;
  type: string;
  relatedPersonName: string | null;
  date: string;
  month: number;
  day: number;
  assignedStaff: string | null;
  hasEmail: boolean;
  hasWhatsApp: boolean;
}
