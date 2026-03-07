export interface Beneficiary {
  id: string;
  code: string;
  fullName: string;
  homeType: "ORPHAN_GIRLS" | "BLIND_BOYS" | "OLD_AGE";
  gender?: string;
  dobDay?: number;
  dobMonth?: number;
  dobYear?: number;
  approxAge?: number;
  joinDate?: string;
  educationClassOrRole?: string;
  schoolOrCollege?: string;
  healthNotes?: string;
  currentHealthStatus?: string;
  background?: string;
  hobbies?: string;
  dreamCareer?: string;
  favouriteSubject?: string;
  favouriteGame?: string;
  favouriteActivityAtHome?: string;
  bestFriend?: string;
  sourceOfPrideOrHappiness?: string;
  funFact?: string;
  additionalNotes?: string;
  heightCmAtJoin?: number;
  weightKgAtJoin?: number;
  protectPrivacy: boolean;
  photoUrl?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  activeSponsorsCount: number;
  updatesCount: number;
  sponsorships: Sponsorship[];
  updates: BeneficiaryUpdate[];
  timelineEvents: TimelineEvent[];
  documents?: BeneficiaryDocument[];
  createdBy: {
    id: string;
    name: string;
  };
}

export interface SponsorshipHistoryEntry {
  id: string;
  oldStatus: string;
  newStatus: string;
  oldAmount?: number;
  newAmount?: number;
  note?: string;
  changedAt: string;
  changedBy?: {
    id: string;
    name: string;
  };
}

export interface Sponsorship {
  id: string;
  donorId: string;
  sponsorshipType: string;
  amount?: number;
  currency: string;
  inKindItem?: string;
  frequency: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  donor: {
    id: string;
    donorCode: string;
    firstName: string;
    lastName?: string;
    primaryPhone?: string;
    personalEmail?: string;
  };
}

export interface BeneficiaryUpdate {
  id: string;
  title: string;
  content: string;
  mediaUrls: string[];
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

export interface TimelineEvent {
  id: string;
  eventType: string;
  eventDate: string;
  description: string;
  createdAt: string;
}

export interface DonorSearchResult {
  id: string;
  donorCode: string;
  firstName: string;
  lastName?: string;
  primaryPhone?: string;
}

export interface BeneficiaryMetric {
  id: string;
  beneficiaryId: string;
  recordedOn: string;
  heightCm?: number;
  weightKg?: number;
  healthStatus?: string;
  notes?: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

export interface ProgressCard {
  id: string;
  beneficiaryId: string;
  academicYear: string;
  term: string;
  classGrade: string;
  school?: string;
  overallPercentage?: number;
  remarks?: string;
  fileDocumentId?: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  fileDocument?: {
    id: string;
    title: string;
    storagePath: string;
    mimeType: string;
  };
}

export interface HealthEvent {
  id: string;
  beneficiaryId: string;
  eventDate: string;
  title: string;
  description: string;
  severity: string;
  requiresDonorUpdate: boolean;
  shareWithDonor: boolean;
  documentId?: string;
  document?: {
    id: string;
    title: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
  };
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

export interface HealthTimelineItem {
  id: string;
  type: "METRIC" | "EVENT";
  date: string;
  title: string;
  summary: string;
  healthStatus?: string;
  heightCm?: number;
  weightKg?: number;
  severity?: string;
  shareWithDonor?: boolean;
  document?: {
    id: string;
    title: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
  };
  notes?: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface EducationTimelineItem {
  id: string;
  type: "PROGRESS_CARD" | "TIMELINE_EVENT";
  date: string;
  title: string;
  summary: string;
  academicYear?: string;
  term?: string;
  classGrade?: string;
  school?: string;
  overallPercentage?: number;
  remarks?: string;
  eventType?: string;
  fileDocument?: {
    id: string;
    title: string;
    storagePath: string;
    mimeType: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface BeneficiaryDocument {
  id: string;
  ownerType: string;
  ownerId: string;
  docType: string;
  title: string;
  description?: string;
  storageBucket: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  isSensitive: boolean;
  shareWithDonor: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}
