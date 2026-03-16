export interface DonorBirthday {
  donorId: string;
  donorCode: string;
  donorName: string;
  firstName: string;
  lastName: string | null;
  dobDay: number;
  dobMonth: number;
  daysUntil: number;
  isToday: boolean;
  hasEmail: boolean;
  hasWhatsApp: boolean;
  personalEmail: string | null;
  officialEmail: string | null;
  whatsappPhone: string | null;
  beneficiaries: {
    id: string;
    name: string;
    homeType: string;
    privacyProtected: boolean;
  }[];
  whatsappText: string;
  emailSubject: string;
  emailHtml: string;
  imageUrl: string | null;
}

export interface BeneficiaryBirthday {
  beneficiaryId: string;
  beneficiaryCode: string;
  beneficiaryName: string;
  homeType: string;
  dobDay: number;
  dobMonth: number;
  daysUntil: number;
  isToday: boolean;
  photoUrl: string | null;
  latestUpdate: string | null;
  sponsors: {
    donorId: string;
    donorCode: string;
    donorName: string;
    hasEmail: boolean;
    hasWhatsApp: boolean;
  }[];
}

export interface SentLogEntry {
  id: string;
  type: string;
  channel: string;
  donorId: string;
  donorName: string;
  donorCode: string;
  beneficiaryIds: string[] | null;
  status: string;
  createdAt: string;
  createdBy: string;
}

export interface SentLogResponse {
  logs: SentLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TemplateItem {
  id: string;
  key: string;
  name: string;
  subject: string | null;
  body: string;
  channel: string;
  variables: string[];
}
