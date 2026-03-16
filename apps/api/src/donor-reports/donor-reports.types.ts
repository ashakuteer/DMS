import { DonorReportType } from '@prisma/client';

export interface GenerateReportDto {
  type: DonorReportType;
  periodStart: string;
  periodEnd: string;
  donorId?: string;
  campaignId?: string;
  templateId?: string;
  title?: string;
}

export interface UserContext {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export interface ReportData {
  period: { start: string; end: string; label: string };
  summary: {
    totalDonations: number;
    totalAmount: number;
    uniqueDonors: number;
    beneficiariesSupported: number;
    activeSponsorships: number;
    campaignsActive: number;
  };
  donationsByType: { type: string; count: number; amount: number }[];
  donationsByPurpose: { type: string; count: number; amount: number }[];
  donationsByHome: { type: string; count: number; amount: number }[];
  donationsByMonth: { month: string; count: number; amount: number }[];
  topDonors: { name: string; code: string; amount: number; count: number }[];
  beneficiaries: { name: string; home: string; sponsors: number }[];
  campaigns: { name: string; goal: number; raised: number; status: string }[];
  usageSummary: { category: string; amount: number; percentage: number }[];
  donorDetail?: {
    name: string;
    code: string;
    email: string;
    totalDonated: number;
    donationCount: number;
    sponsoredBeneficiaries: { name: string; home: string }[];
    donations: { date: string; amount: number; type: string; receipt: string; purpose: string }[];
  };
}
