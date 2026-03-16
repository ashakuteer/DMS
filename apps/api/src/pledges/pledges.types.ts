import { Role, PledgeStatus } from '@prisma/client';

export interface PledgeQueryOptions {
  page?: number;
  limit?: number;
  donorId?: string;
  status?: PledgeStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FulfillPledgeDto {
  donationId?: string;
  donationAmount?: number;
  donationDate?: string;
  donationMode?: string;
  donationType?: string;
  remarks?: string;
  autoCreateDonation?: boolean;
}

export interface UserContext {
  id: string;
  role: Role;
  email: string;
}
