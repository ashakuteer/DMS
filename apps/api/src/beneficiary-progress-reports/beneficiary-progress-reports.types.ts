export interface GenerateProgressReportDto {
  beneficiaryId: string;
  title?: string;
  periodStart: string;
  periodEnd: string;
  includePhotos?: boolean;
  includeHealth?: boolean;
  includeEducation?: boolean;
  includeUpdates?: boolean;
}

export interface UserContext {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export interface ProgressReportData {
  beneficiary: {
    fullName: string;
    code: string;
    homeType: string;
    gender?: string;
    approxAge?: number;
    photoUrl?: string;
    joinDate?: string;
    educationClassOrRole?: string;
    schoolOrCollege?: string;
    currentHealthStatus?: string;
    hobbies?: string;
    dreamCareer?: string;
    favouriteSubject?: string;
  };
  period: { start: string; end: string; label: string };
  healthEvents: {
    date: string;
    title: string;
    description: string;
    severity: string;
  }[];
  healthMetrics: {
    date: string;
    heightCm?: number;
    weightKg?: number;
    healthStatus: string;
    notes?: string;
  }[];
  progressCards: {
    academicYear: string;
    term: string;
    classGrade: string;
    school?: string;
    percentage?: number;
    remarks?: string;
  }[];
  updates: {
    date: string;
    type: string;
    title: string;
    content: string;
    mediaUrls: string[];
  }[];
  sponsors: { name: string; code: string }[];
  photos: string[];
}
