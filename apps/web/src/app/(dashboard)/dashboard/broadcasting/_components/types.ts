export interface BroadcastFilters {
  gender?: string;
  religion?: string;
  city?: string;
  country?: string;
  category?: string;
  donationFrequency?: string;
  assignedToUserId?: string;
  supportPreferences?: string[];
  engagementLevel?: string;
  healthStatus?: string;
  ageMin?: number;
  ageMax?: number;
}

export interface PreviewResult {
  total: number;
  reachable: number;
  unreachable: number;
  sampleDonors: { id: string; name: string; contact: string }[];
}

export interface SendResult {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  details: { donorId: string; donorName: string; status: string; error?: string }[];
}

export interface WhatsAppTemplate {
  key: string;
  contentSid: string;
  name: string;
  description: string;
}

export interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  emailSubject: string;
  emailBody: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
}
