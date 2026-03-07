export interface Donor {
  id: string;
  donorCode: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  primaryPhone?: string;
  primaryPhoneCode?: string;
  alternatePhone?: string;
  whatsappPhone?: string;
  personalEmail?: string;
  officialEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  profession?: string;
  approximateAge?: number;
  gender?: string;
  incomeSpectrum?: string;
  religion?: string;
  donationFrequency?: string;
  notes?: string;
  prefEmail?: boolean;
  prefWhatsapp?: boolean;
  prefSms?: boolean;
  prefReminders?: boolean;
  timezone?: string;
  category: string;
  isUnder18Helper?: boolean;
  isSeniorCitizen?: boolean;
  isSingleParent?: boolean;
  isDisabled?: boolean;
  sourceOfDonor?: string;
  sourceDetails?: string;
  pan?: string;
  profilePicUrl?: string;
  createdAt: string;
  updatedAt: string;
  healthScore?: number;
  healthStatus?: "GREEN" | "YELLOW" | "RED";
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  supportPreferences?: string[];
  donations?: Donation[];
  pledges?: Pledge[];
  specialOccasions?: SpecialOccasion[];
  familyMembers?: FamilyMember[];
}

export interface Donation {
  id: string;
  donationDate: string;
  donationAmount: string;
  currency: string;
  donationType: string;
  donationMode: string;
  receiptNumber?: string;
  remarks?: string;
  communicationResults?: {
    emailStatus?: string;
    whatsAppStatus?: string;
    emailError?: string;
    whatsAppError?: string;
    whatsAppMessageId?: string;
  };
}

export interface DonationFormData {
  donationAmount: string;
  donationDate: string;
  donationMode: string;
  donationType: string;
  designatedHome?: string;
  remarks: string;
}

export interface Pledge {
  id: string;
  pledgeType: string;
  pledgeTypeLabel?: string;
  amount?: number;
  quantity?: string;
  currency: string;
  expectedFulfillmentDate: string;
  status: string;
  notes?: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
  fulfilledDonation?: {
    id: string;
    receiptNumber: string;
    donationAmount: number;
  };
}

export interface PledgeFormData {
  pledgeType: string;
  amount: string;
  quantity: string;
  expectedFulfillmentDate: string;
  notes: string;
}

export interface SpecialOccasion {
  id: string;
  type: string;
  month: number;
  day: number;
  relatedPersonName?: string;
  notes?: string;
}

export interface FamilyMember {
  id: string;
  relationType: string;
  name: string;
  birthMonth?: number;
  birthDay?: number;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface FamilyMemberFormData {
  name: string;
  relationType: string;
  birthMonth: string;
  birthDay: string;
  phone: string;
  email: string;
  notes: string;
}

export interface SpecialOccasionFormData {
  type: string;
  month: string;
  day: string;
  relatedPersonName: string;
  notes: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Template {
  id: string;
  type: string;
  name: string;
  description: string | null;
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
}

export interface CommunicationLog {
  id: string;
  donorId: string;
  donationId?: string;
  templateId?: string;
  channel: "EMAIL" | "WHATSAPP";
  type: "THANK_YOU" | "RECEIPT" | "FOLLOW_UP" | "GREETING" | "GENERAL";
  status: "SENT" | "FAILED" | "OPENED" | "TRIGGERED";
  recipient?: string;
  subject?: string;
  messagePreview?: string;
  errorMessage?: string;
  createdAt: string;
  sentBy?: {
    id: string;
    name: string;
    role: string;
  };
  template?: {
    id: string;
    name: string;
    type: string;
  };
  donation?: {
    id: string;
    receiptNumber: string;
    donationAmount: number;
  };
}

export interface BeneficiaryUpdate {
  id: string;
  title: string;
  content: string;
  updateType: string;
  createdAt: string;
}

export interface SponsoredBeneficiary {
  id: string;
  beneficiaryId: string;
  sponsorshipType: string;
  amount?: number;
  currency: string;
  inKindItem?: string;
  frequency: string;
  isActive: boolean;
  status?: string;
  dueDayOfMonth?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  notes?: string;
  beneficiary: {
    id: string;
    code: string;
    fullName: string;
    homeType: string;
    photoUrl?: string;
    status: string;
    updates?: BeneficiaryUpdate[];
  };
}

export interface TimelineItem {
  id: string;
  type: string;
  date: string;
  title: string;
  description: string;
  amount?: number;
  currency?: string;
  status?: string;
  metadata?: Record<string, any>;
}
