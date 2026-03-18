// ============ ENUMS ============

export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  TELECALLER = 'TELECALLER',
  ACCOUNTANT = 'ACCOUNTANT',
}

export enum DonorCategory {
  INDIVIDUAL = 'INDIVIDUAL',
  NGO = 'NGO',
  CSR_REP = 'CSR_REP',
  WHATSAPP_GROUP = 'WHATSAPP_GROUP',
  SOCIAL_MEDIA_PERSON = 'SOCIAL_MEDIA_PERSON',
  CROWD_PULLER = 'CROWD_PULLER',
  VISITOR_ENQUIRY = 'VISITOR_ENQUIRY',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum IncomeSpectrum {
  LOW = 'LOW',
  LOWER_MIDDLE = 'LOWER_MIDDLE',
  MIDDLE = 'MIDDLE',
  UPPER_MIDDLE = 'UPPER_MIDDLE',
  HIGH = 'HIGH',
  ULTRA_HIGH = 'ULTRA_HIGH',
}

export enum DonationMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  GPAY = 'GPAY',
  PHONEPE = 'PHONEPE',
  CHEQUE = 'CHEQUE',
  ONLINE = 'ONLINE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  KIND = 'KIND',
}

export enum DonationFrequency {
  ONE_TIME = 'ONE_TIME',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  HALF_YEARLY = 'HALF_YEARLY',
  YEARLY = 'YEARLY',
  OCCASIONAL = 'OCCASIONAL',
}

export enum DonationType {
  CASH = 'CASH',
  GROCERY = 'GROCERY',
  MEDICINES = 'MEDICINES',
  PREPARED_FOOD = 'PREPARED_FOOD',
  USED_ITEMS = 'USED_ITEMS',
  KIND = 'KIND',
}

export enum DonationMode {
  CASH = 'CASH',
  UPI = 'UPI',
  GPAY = 'GPAY',
  PHONEPE = 'PHONEPE',
  CHEQUE = 'CHEQUE',
  ONLINE = 'ONLINE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum SourceOfDonor {
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  GOOGLE = 'GOOGLE',
  JUSTDIAL = 'JUSTDIAL',
  FRIEND = 'FRIEND',
  SPONSOR = 'SPONSOR',
  WEBSITE = 'WEBSITE',
  WALK_IN = 'WALK_IN',
  REFERRAL = 'REFERRAL',
  OTHER = 'OTHER',
}

export enum OccasionType {
  DOB_SELF = 'DOB_SELF',
  DOB_SPOUSE = 'DOB_SPOUSE',
  DOB_CHILD = 'DOB_CHILD',
  ANNIVERSARY = 'ANNIVERSARY',
  DEATH_ANNIVERSARY = 'DEATH_ANNIVERSARY',
  OTHER = 'OTHER',
}

export enum FamilyRelationType {
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  SIBLING = 'SIBLING',
  GRANDPARENT = 'GRANDPARENT',
  OTHER = 'OTHER',
}

export enum PledgeStatus {
  PENDING = 'PENDING',
  FULFILLED = 'FULFILLED',
  NULLIFIED = 'NULLIFIED',
  POSTPONED = 'POSTPONED',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum AuditAction {
  DONOR_CREATE = 'DONOR_CREATE',
  DONOR_UPDATE = 'DONOR_UPDATE',
  DONOR_DELETE = 'DONOR_DELETE',
  DONOR_ASSIGNMENT_CHANGE = 'DONOR_ASSIGNMENT_CHANGE',
  DONATION_CREATE = 'DONATION_CREATE',
  DONATION_UPDATE = 'DONATION_UPDATE',
  DONATION_DELETE = 'DONATION_DELETE',
  RECEIPT_REGENERATE = 'RECEIPT_REGENERATE',
  DATA_EXPORT = 'DATA_EXPORT',
  ROLE_CHANGE = 'ROLE_CHANGE',
  FULL_ACCESS_REQUEST = 'FULL_ACCESS_REQUEST',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

// ============ INTERFACES ============

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Donor {
  id: string;
  donorCode: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  primaryPhone?: string;
  primaryPhoneCode?: string;
  alternatePhone?: string;
  alternatePhoneCode?: string;
  whatsappPhone?: string;
  whatsappPhoneCode?: string;
  personalEmail?: string;
  officialEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  profession?: string;
  approximateAge?: number;
  gender?: Gender;
  incomeSpectrum?: IncomeSpectrum;
  religion?: string;
  donationMethods: DonationMethod[];
  donationFrequency?: DonationFrequency;
  notes?: string;
  prefEmail: boolean;
  prefWhatsapp: boolean;
  prefSms: boolean;
  prefReminders: boolean;
  timezone: string;
  category: DonorCategory;
  isUnder18Helper: boolean;
  isSeniorCitizen: boolean;
  isSingleParent: boolean;
  isDisabled: boolean;
  sourceOfDonor?: SourceOfDonor;
  sourceDetails?: string;
  pan?: string;
  profilePicUrl?: string;
  assignedToUserId?: string;
  referredByDonorId?: string;
  createdById: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DonorSpecialOccasion {
  id: string;
  donorId: string;
  type: OccasionType;
  date: Date;
  relatedPersonName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DonorFamilyMember {
  id: string;
  donorId: string;
  relationType: FamilyRelationType;
  name: string;
  dateOfBirth?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Donation {
  id: string;
  donorId: string;
  donationDate: Date;
  donationAmount: number;
  currency: string;
  donationType: DonationType;
  donationMode: DonationMode;
  transactionId?: string;
  remarks?: string;
  homeId?: string;
  visitedHome: boolean;
  servedFood: boolean;
  receiptNumber?: string;
  financialYear?: string;
  receiptPdfUrl?: string;
  attachmentUrl?: string;
  campaignId?: string;
  createdById: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pledge {
  id: string;
  donorId: string;
  pledgeAmount: number;
  currency: string;
  expectedStartDate?: Date;
  expectedEndDate?: Date;
  status: PledgeStatus;
  notes?: string;
  createdById: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  goalAmount?: number;
  currency: string;
  status: CampaignStatus;
  createdById: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Beneficiary {
  id: string;
  name: string;
  description?: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  mediaUrls?: string[];
  createdById: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============ AUTH TYPES ============

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<User, 'createdAt' | 'updatedAt'>;
  tokens: AuthTokens;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// ============ API RESPONSE TYPES ============

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============ DASHBOARD TYPES ============

export interface DashboardStats {
  totalDonors: number;
  totalDonations: number;
  totalAmount: number;
  totalBeneficiaries: number;
  totalPledges: number;
  activeCampaigns: number;
  recentDonations: Donation[];
  monthlyTrends: {
    month: string;
    amount: number;
    count: number;
  }[];
}

// ============ CREATE/UPDATE DTOs ============

export interface CreateDonorDto {
  firstName: string;
  middleName?: string;
  lastName?: string;
  primaryPhone?: string;
  primaryPhoneCode?: string;
  alternatePhone?: string;
  alternatePhoneCode?: string;
  whatsappPhone?: string;
  whatsappPhoneCode?: string;
  personalEmail?: string;
  officialEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  profession?: string;
  approximateAge?: number;
  gender?: Gender;
  incomeSpectrum?: IncomeSpectrum;
  religion?: string;
  donationMethods?: DonationMethod[];
  donationFrequency?: DonationFrequency;
  notes?: string;
  prefEmail?: boolean;
  prefWhatsapp?: boolean;
  prefSms?: boolean;
  prefReminders?: boolean;
  timezone?: string;
  category?: DonorCategory;
  isUnder18Helper?: boolean;
  isSeniorCitizen?: boolean;
  isSingleParent?: boolean;
  isDisabled?: boolean;
  sourceOfDonor?: SourceOfDonor;
  sourceDetails?: string;
  pan?: string;
  profilePicUrl?: string;
  assignedToUserId?: string;
  referredByDonorId?: string;
}

export interface CreateDonationDto {
  donorId: string;
  donationDate: Date | string;
  donationAmount: number;
  currency?: string;
  donationType?: DonationType;
  donationMode?: DonationMode;
  transactionId?: string;
  remarks?: string;
  homeId?: string;
  visitedHome?: boolean;
  servedFood?: boolean;
  campaignId?: string;
}

export interface CreatePledgeDto {
  donorId: string;
  pledgeAmount: number;
  currency?: string;
  expectedStartDate?: Date | string;
  expectedEndDate?: Date | string;
  status?: PledgeStatus;
  notes?: string;
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  goalAmount?: number;
  currency?: string;
  status?: CampaignStatus;
}
