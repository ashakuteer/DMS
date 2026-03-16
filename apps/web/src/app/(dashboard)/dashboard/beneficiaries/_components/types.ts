export interface Beneficiary {
  id: string;
  code: string;
  fullName: string;
  homeType: 'ORPHAN_GIRLS' | 'BLIND_BOYS' | 'OLD_AGE';
  gender?: string;
  dobDay?: number;
  dobMonth?: number;
  approxAge?: number;
  educationClassOrRole?: string;
  schoolOrCollege?: string;
  photoUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  protectPrivacy: boolean;
  activeSponsorsCount: number;
  createdAt: string;
}

export interface BeneficiariesResponse {
  data: Beneficiary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
