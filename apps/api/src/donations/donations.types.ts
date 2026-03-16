import { Role } from '@prisma/client';

export interface DonationQueryOptions {
  page?: number;
  limit?: number;
  donorId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  donationType?: string;
  donationHomeType?: string;
}

export interface UserContext {
  id: string;
  role: Role;
  email: string;
}

export type HomeTypeLabel = 'Girls Home' | 'Blind Boys Home' | 'Old Age Home' | 'General' | '-';
