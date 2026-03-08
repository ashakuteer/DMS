import { Role, HomeType } from "@prisma/client";

export interface UserContext {
  id: string;
  role: Role;
  email: string;
}

export interface CreateBeneficiaryDto {
  fullName: string;
  homeType: HomeType;
  gender?: string;
  approxAge?: number;
  schoolOrCollege?: string;
  educationClassOrRole?: string;
  photoUrl?: string;
}

export interface UpdateBeneficiaryDto extends Partial<CreateBeneficiaryDto> {
  status?: string;
}

export interface CreateSponsorshipDto {
  donorId: string;
  sponsorshipType: string;
  amount?: number;
  currency?: string;
  frequency?: string;
}

export interface UpdateSponsorshipDto extends Partial<CreateSponsorshipDto> {
  isActive?: boolean;
}

export interface CreateBeneficiaryUpdateDto {
  title: string;
  content: string;
}

export interface CreateTimelineEventDto {
  eventType: string;
  eventDate: string;
  description: string;
}

export interface CreateMetricDto {
  heightCm?: number;
  weightKg?: number;
}

export interface CreateProgressCardDto {
  academicYear: string;
  term: string;
  classGrade: string;
}
export interface CreateHealthEventDto {
  eventDate: string;
  title: string;
  description: string;
  severity?: string;
  requiresDonorUpdate?: boolean;
  shareWithDonor?: boolean;
  documentId?: string;
}

export interface CreateDocumentDto {
  ownerType: string;
  ownerId?: string;
  docType: string;
  title: string;
  description?: string;
  storageBucket: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  isSensitive?: boolean;
  shareWithDonor?: boolean;
}

export interface CreateReportCampaignDto {
  name: string;
  type: 'QUARTERLY' | 'ANNUAL';
  periodStart: string;
  periodEnd: string;
  documentId?: string;
  target?: 'ALL_DONORS' | 'SPONSORS_ONLY' | 'CUSTOM';
}
