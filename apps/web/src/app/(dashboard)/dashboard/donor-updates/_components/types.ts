export interface DonorUpdate {
  id: string;
  title: string;
  content: string;
  photos: string[];
  relatedBeneficiaryIds: string[];
  relatedHomeTypes: string[];
  isDraft: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string };
  beneficiaries: { id: string; fullName: string; homeType: string; code: string }[];
  dispatchCount: number;
}

export interface DonorResult {
  id: string;
  donorCode: string;
  firstName: string;
  lastName: string | null;
  personalEmail: string | null;
  officialEmail: string | null;
  whatsappPhone: string | null;
  primaryPhone: string | null;
}

export interface BeneficiaryResult {
  id: string;
  fullName: string;
  homeType: string;
  code: string;
}

export interface DispatchItem {
  id: string;
  updateTitle: string;
  updateId: string;
  donorName: string;
  donorCode: string;
  donorId: string;
  channel: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

export interface PreviewData {
  update: DonorUpdate;
  emailHtml: string;
  whatsappText: string;
  emailSubject: string;
}
