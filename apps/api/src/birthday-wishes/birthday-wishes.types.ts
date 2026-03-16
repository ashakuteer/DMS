export interface UserContext {
  userId: string;
  role: string;
}

export interface BeneficiaryWishInfo {
  id: string;
  fullName: string;
  homeType: string;
  protectPrivacy: boolean;
  photoUrl: string | null;
}

export interface DonorBirthdayResult {
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
