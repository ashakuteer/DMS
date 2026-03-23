"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Save, User, Phone, MapPin, Settings, Users,
  Camera, X, Tag, MessageCircle, Briefcase, Heart, Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { resolveImageUrl } from "@/lib/image-url";
import imageCompression from "browser-image-compression";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

const PRIMARY_ROLES = [
  { value: "INDIVIDUAL", label: "Individual", icon: User },
  { value: "CSR", label: "CSR", icon: Briefcase },
  { value: "VOLUNTEER", label: "Volunteer", icon: Heart },
  { value: "INFLUENCER", label: "Influencer", icon: Share2 },
];

const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

const INCOME_SPECTRUMS = [
  { value: "LOW", label: "Low" },
  { value: "LOWER_MIDDLE", label: "Lower Middle" },
  { value: "MIDDLE", label: "Middle" },
  { value: "UPPER_MIDDLE", label: "Upper Middle" },
  { value: "HIGH", label: "High" },
  { value: "ULTRA_HIGH", label: "Ultra High" },
];

const DONATION_FREQUENCIES = [
  { value: "ONE_TIME", label: "One Time" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BI_WEEKLY", label: "Bi-Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "BI_MONTHLY", label: "Bi-Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "HALF_YEARLY", label: "Half Yearly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "OCCASIONAL", label: "Occasional" },
  { value: "FESTIVAL_BASED", label: "Festival-Based" },
];

const SOURCES = [
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "GOOGLE", label: "Google" },
  { value: "JUSTDIAL", label: "JustDial" },
  { value: "FRIEND", label: "Friend" },
  { value: "SPONSOR", label: "Sponsor" },
  { value: "WEBSITE", label: "Website" },
  { value: "WALK_IN", label: "Walk In" },
  { value: "REFERRAL", label: "Referral" },
  { value: "OTHER", label: "Other" },
];

const SUPPORT_TYPES = [
  { value: "GROCERIES", label: "Groceries" },
  { value: "EDUCATION", label: "Education" },
  { value: "MEDICINES", label: "Medicines" },
  { value: "TOILETRIES", label: "Toiletries" },
  { value: "SPONSORSHIP", label: "Sponsorship" },
  { value: "GENERAL", label: "General" },
  { value: "SNACKS_SWEETS", label: "Snacks / Sweets" },
  { value: "IN_KIND", label: "In-Kind" },
  { value: "CASH", label: "Cash" },
];

const DONOR_TAGS = [
  "Champion Donor", "Regular Donor", "Festival Donor", "Anniversary Donor",
  "Birthday Donor", "Corporate Link", "Social Connector", "Event Organizer",
  "Food Donor", "Education Patron", "Health Patron", "Spiritual Donor", "Sponsorship",
];

const COMM_CHANNELS = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
  { value: "phone", label: "Phone Call" },
  { value: "in_person", label: "In Person" },
];

const COMM_METHODS = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
  { value: "phone", label: "Phone Call" },
];

const VOLUNTEER_TYPES = [
  { value: "FIELD", label: "Field Volunteer (Inmate Support)" },
  { value: "ADMIN", label: "Admin Volunteer (Organization Support)" },
];

const INMATES_SUPPORT_OPTIONS = [
  "Teaching", "Hospital Support", "Scribe", "Elder Care", "Child Care", "Counseling", "Recreation",
];

const ADMIN_SUPPORT_OPTIONS = [
  "Accounts", "Software / IT", "Administration", "Marketing", "Fundraising", "Event Management", "HR Support",
];

const CSR_SUPPORT_TYPES = [
  { value: "FINANCIAL", label: "Financial / Cash" },
  { value: "IN_KIND", label: "In-Kind / Materials" },
  { value: "EMPLOYEE_ENGAGEMENT", label: "Employee Engagement" },
  { value: "SKILLS_BASED", label: "Skills-Based" },
  { value: "SPONSORSHIP", label: "Event Sponsorship" },
  { value: "MIXED", label: "Mixed / Multiple" },
];

const WORK_MODES = [
  { value: "ONSITE", label: "On-site" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
];

const ENGAGEMENT_LEVELS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const INFLUENCE_TYPES = [
  "Social Media", "Community Leader", "Celebrity", "Blogger/Vlogger",
  "Religious Leader", "Corporate Network", "NGO Network",
];

const CONTRIBUTION_TYPES = [
  "Fundraising", "Awareness", "Recruitment", "Event Promotion",
  "Content Creation", "Financial Referral",
];

const RELATIONSHIP_STRENGTHS = [
  { value: "COLD", label: "Cold" },
  { value: "WARM", label: "Warm" },
  { value: "HOT", label: "Hot" },
  { value: "CHAMPION", label: "Champion" },
];

const MEETING_STATUSES = [
  { value: "NOT_INITIATED", label: "Not Initiated" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FOLLOW_UP_NEEDED", label: "Follow-up Needed" },
];

const RELIGIONS = [
  { value: "Hinduism", label: "Hinduism" },
  { value: "Islam", label: "Islam" },
  { value: "Christianity", label: "Christianity" },
  { value: "Buddhism", label: "Buddhism" },
  { value: "Sikhism", label: "Sikhism" },
  { value: "Atheist", label: "Atheist" },
  { value: "Unknown", label: "Unknown" },
  { value: "Not interested to disclose", label: "Not interested to disclose" },
];

export default function EditDonorPage() {
  const router = useRouter();
  const params = useParams();
  const donorId = params.id as string;
  console.log("Route donorId:", params.id);
  const { toast } = useToast();
  const user = authStorage.getUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [donorCode, setDonorCode] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("individual");
  const [idType, setIdType] = useState<"PAN" | "AADHAR">("PAN");

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    primaryPhone: "",
    primaryPhoneCode: "+91",
    alternatePhone: "",
    alternatePhoneCode: "+91",
    whatsappPhone: "",
    whatsappPhoneCode: "+91",
    personalEmail: "",
    officialEmail: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    profession: "",
    donorSince: "",
    approximateAge: "",
    gender: "",
    incomeSpectrum: "",
    religion: "",
    notes: "",
    timezone: "Asia/Kolkata",
    primaryRole: "INDIVIDUAL",
    additionalRoles: [] as string[],
    donorTags: [] as string[],
    communicationChannels: [] as string[],
    preferredCommunicationMethod: "",
    communicationNotes: "",
    sourceOfDonor: "",
    sourceDetails: "",
    pan: "",
    assignedToUserId: "",
    prefEmail: true,
    prefWhatsapp: true,
    prefSms: false,
    prefReminders: true,
    isUnder18Helper: false,
    isSeniorCitizen: false,
    isSingleParent: false,
    isDisabled: false,
  });

  const [individualProfile, setIndividualProfile] = useState({
    donationFrequency: "",
    supportTypes: [] as string[],
    donorTags: [] as string[],
  });

  const [volunteerProfile, setVolunteerProfile] = useState({
    volunteerType: "",
    workMode: "",
    skills: [] as string[],
    areasOfInterest: [] as string[],
    inmatesSupport: [] as string[],
    adminSupport: [] as string[],
    availabilityType: "",
    timePreference: "",
    engagementLevel: "",
    willingToDonate: false,
  });

  const [influencerProfile, setInfluencerProfile] = useState({
    influenceTypes: [] as string[],
    groupName: "",
    audienceSize: "",
    engagementLevel: "",
    contributionTypes: [] as string[],
    contributionPattern: "",
    relationshipStrength: "",
  });

  const [csrProfile, setCsrProfile] = useState({
    companyName: "",
    designation: "",
    industry: "",
    companySize: "",
    companyAddress: "",
    csrAltName: "",
    csrAltPhone: "",
    csrAltEmail: "",
    csrOfficialEmailPrimary: "",
    csrOfficialEmailSecondary: "",
    csrBudget: "",
    focusAreas: [] as string[],
    supportTypes: [] as string[],
    csrSupportType: "",
    decisionRole: "",
    relationshipStrength: "",
    lastContactDate: "",
    nextFollowUpDate: "",
    meetingStatus: "",
    expectedContribution: "",
    proposalShared: false,
  });

  const fetchDonor = useCallback(async () => {
    if (!donorId) {
      console.warn("fetchDonor called with no donorId — skipping");
      return;
    }
    try {
      setLoading(true);
      console.log("Fetching donor ID:", donorId);
      const res = await fetchWithAuth(`/api/donors/${donorId}`);
      if (res.ok) {
        const donor = await res.json();
        setDonorCode(donor.donorCode);
        setExistingPhotoUrl(donor.profilePicUrl ? resolveImageUrl(donor.profilePicUrl) : null);

        setFormData({
          firstName: donor.firstName || "",
          middleName: donor.middleName || "",
          lastName: donor.lastName || "",
          primaryPhone: donor.primaryPhone || "",
          primaryPhoneCode: donor.primaryPhoneCode || "+91",
          alternatePhone: donor.alternatePhone || "",
          alternatePhoneCode: donor.alternatePhoneCode || "+91",
          whatsappPhone: donor.whatsappPhone || "",
          whatsappPhoneCode: donor.whatsappPhoneCode || "+91",
          personalEmail: donor.personalEmail || "",
          officialEmail: donor.officialEmail || "",
          address: donor.address || "",
          city: donor.city || "",
          state: donor.state || "",
          country: donor.country || "India",
          pincode: donor.pincode || "",
          profession: donor.profession || "",
          donorSince: donor.donorSince ? donor.donorSince.slice(0, 10) : "",
          approximateAge: donor.approximateAge?.toString() || "",
          gender: donor.gender || "",
          incomeSpectrum: donor.incomeSpectrum || "",
          religion: donor.religion || "",
          notes: donor.notes || "",
          timezone: donor.timezone || "Asia/Kolkata",
          primaryRole: donor.primaryRole || "INDIVIDUAL",
          additionalRoles: donor.additionalRoles || [],
          donorTags: donor.donorTags || [],
          communicationChannels: donor.communicationChannels || [],
          preferredCommunicationMethod: donor.preferredCommunicationMethod || "",
          communicationNotes: donor.communicationNotes || "",
          sourceOfDonor: donor.sourceOfDonor || "",
          sourceDetails: donor.sourceDetails || "",
          pan: donor.pan || "",
          assignedToUserId: donor.assignedToUserId || "",
          prefEmail: donor.prefEmail ?? true,
          prefWhatsapp: donor.prefWhatsapp ?? true,
          prefSms: donor.prefSms ?? false,
          prefReminders: donor.prefReminders ?? true,
          isUnder18Helper: donor.isUnder18Helper ?? false,
          isSeniorCitizen: donor.isSeniorCitizen ?? false,
          isSingleParent: donor.isSingleParent ?? false,
          isDisabled: donor.isDisabled ?? false,
        });
        if (donor.pan && /^\d{12}$/.test(donor.pan)) setIdType("AADHAR");
        else setIdType("PAN");

        if (donor.individualProfile) {
          setIndividualProfile({
            donationFrequency: donor.individualProfile.donationFrequency || "",
            supportTypes: donor.individualProfile.supportTypes || [],
            donorTags: donor.individualProfile.donorTags || [],
          });
        }
        if (donor.volunteerProfile) {
          setVolunteerProfile({
            volunteerType: donor.volunteerProfile.volunteerType || "",
            workMode: donor.volunteerProfile.workMode || "",
            skills: donor.volunteerProfile.skills || [],
            areasOfInterest: donor.volunteerProfile.areasOfInterest || [],
            inmatesSupport: donor.volunteerProfile.inmatesSupport || [],
            adminSupport: donor.volunteerProfile.adminSupport || [],
            availabilityType: donor.volunteerProfile.availabilityType || "",
            timePreference: donor.volunteerProfile.timePreference || "",
            engagementLevel: donor.volunteerProfile.engagementLevel || "",
            willingToDonate: donor.volunteerProfile.willingToDonate ?? false,
          });
        }
        if (donor.influencerProfile) {
          setInfluencerProfile({
            influenceTypes: donor.influencerProfile.influenceTypes || [],
            groupName: donor.influencerProfile.groupName || "",
            audienceSize: donor.influencerProfile.audienceSize?.toString() || "",
            engagementLevel: donor.influencerProfile.engagementLevel || "",
            contributionTypes: donor.influencerProfile.contributionTypes || [],
            contributionPattern: donor.influencerProfile.contributionPattern || "",
            relationshipStrength: donor.influencerProfile.relationshipStrength || "",
          });
        }
        if (donor.csrProfile) {
          setCsrProfile({
            companyName: donor.csrProfile.companyName || "",
            designation: donor.csrProfile.designation || "",
            industry: donor.csrProfile.industry || "",
            companySize: donor.csrProfile.companySize || "",
            companyAddress: donor.csrProfile.companyAddress || "",
            csrAltName: donor.csrProfile.csrAltName || "",
            csrAltPhone: donor.csrProfile.csrAltPhone || "",
            csrAltEmail: donor.csrProfile.csrAltEmail || "",
            csrOfficialEmailPrimary: donor.csrProfile.csrOfficialEmailPrimary || "",
            csrOfficialEmailSecondary: donor.csrProfile.csrOfficialEmailSecondary || "",
            csrBudget: donor.csrProfile.csrBudget?.toString() || "",
            focusAreas: donor.csrProfile.focusAreas || [],
            supportTypes: donor.csrProfile.supportTypes || [],
            csrSupportType: donor.csrProfile.csrSupportType || "",
            decisionRole: donor.csrProfile.decisionRole || "",
            relationshipStrength: donor.csrProfile.relationshipStrength || "",
            lastContactDate: donor.csrProfile.lastContactDate ? donor.csrProfile.lastContactDate.slice(0, 10) : "",
            nextFollowUpDate: donor.csrProfile.nextFollowUpDate ? donor.csrProfile.nextFollowUpDate.slice(0, 10) : "",
            meetingStatus: donor.csrProfile.meetingStatus || "",
            expectedContribution: donor.csrProfile.expectedContribution?.toString() || "",
            proposalShared: donor.csrProfile.proposalShared ?? false,
          });
        }

        const role = donor.primaryRole || "INDIVIDUAL";
        if (role === "CSR") setActiveTab("csr");
        else if (role === "VOLUNTEER") setActiveTab("volunteer");
        else if (role === "INFLUENCER") setActiveTab("influencer");
        else setActiveTab("individual");

      } else if (res.status === 401) {
        toast({ title: "Session Expired", description: "Please log in again", variant: "destructive" });
        router.push("/login");
      } else if (res.status === 403) {
        toast({ title: "Access Denied", description: "You do not have permission to edit this donor", variant: "destructive" });
        router.push("/dashboard/donors");
      } else if (res.status === 404) {
        toast({ title: "Not Found", description: "Donor not found", variant: "destructive" });
        router.push("/dashboard/donors");
      } else {
        const errData = await res.json().catch(() => ({}));
        const message = (errData as { message?: string }).message || "An unexpected error occurred";
        console.error("Error fetching donor:", res.status, message);
        toast({ title: "Error", description: message, variant: "destructive" });
        router.push("/dashboard/donors");
      }
    } catch (error) {
      console.error("Error fetching donor:", error);
      toast({ title: "Error", description: "Failed to load donor. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [donorId, router, toast]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetchWithAuth("/api/auth/profile");
        if (res.ok) {
          const profile = await res.json();
          setUserRole(profile.role);
        }
      } catch {}
    };

    const fetchStaff = async () => {
      try {
        const res = await fetchWithAuth("/api/users/staff");
        if (res.ok) {
          const users = await res.json();
          setStaffMembers(Array.isArray(users) ? users : []);
        }
      } catch {
        try {
          const res2 = await fetchWithAuth("/api/users");
          if (res2.ok) {
            const users = await res2.json();
            setStaffMembers(Array.isArray(users) ? users.filter((u: any) => u.role !== "ADMIN") : []);
          }
        } catch {}
      }
    };

    fetchProfile();
    fetchStaff();
    fetchDonor();
  }, [fetchDonor]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRole = (role: string) => {
    if (role === formData.primaryRole) return;
    setFormData((prev) => {
      const already = prev.additionalRoles.includes(role);
      return {
        ...prev,
        additionalRoles: already
          ? prev.additionalRoles.filter((r) => r !== role)
          : [...prev.additionalRoles, role],
      };
    });
  };

  const toggleArrayItem = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "Error", description: "Photo must be under 3MB", variant: "destructive" });
      return;
    }
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true } as any);
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
      setExistingPhotoUrl(null);
    } catch {}
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setExistingPhotoUrl(null);
  };

  const visibleTabs = () => {
    const tabs = ["individual"];
    const allRoles = [formData.primaryRole, ...formData.additionalRoles];
    if (allRoles.includes("CSR")) tabs.push("csr");
    if (allRoles.includes("VOLUNTEER")) tabs.push("volunteer");
    if (allRoles.includes("INFLUENCER")) tabs.push("influencer");
    return tabs;
  };

  const handleSubmit = async () => {
    if (!formData.firstName && !formData.primaryPhone && !formData.personalEmail) {
      toast({ title: "Validation Error", description: "Please provide at least a name, phone, or email", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {};

      payload.firstName = formData.firstName || undefined;
      payload.middleName = formData.middleName || undefined;
      payload.lastName = formData.lastName || undefined;
      if (formData.primaryPhone) {
        payload.primaryPhone = formData.primaryPhone;
        payload.primaryPhoneCode = formData.primaryPhoneCode;
      }
      if (formData.alternatePhone) {
        payload.alternatePhone = formData.alternatePhone;
        payload.alternatePhoneCode = formData.alternatePhoneCode;
      }
      if (formData.whatsappPhone) {
        payload.whatsappPhone = formData.whatsappPhone;
        payload.whatsappPhoneCode = formData.whatsappPhoneCode;
      }
      payload.personalEmail = formData.personalEmail || undefined;
      payload.officialEmail = formData.officialEmail || undefined;
      payload.address = formData.address || undefined;
      payload.city = formData.city || undefined;
      payload.state = formData.state || undefined;
      payload.country = formData.country || undefined;
      payload.pincode = formData.pincode || undefined;
      payload.profession = formData.profession || undefined;
      if (formData.donorSince) payload.donorSince = new Date(formData.donorSince).toISOString();
      if (formData.approximateAge) payload.approximateAge = parseInt(formData.approximateAge);
      payload.gender = formData.gender || undefined;
      payload.incomeSpectrum = formData.incomeSpectrum || undefined;
      payload.religion = formData.religion || undefined;
      payload.notes = formData.notes || undefined;
      payload.sourceOfDonor = formData.sourceOfDonor || undefined;
      payload.sourceDetails = formData.sourceDetails || undefined;
      payload.pan = formData.pan || undefined;
      payload.assignedToUserId = formData.assignedToUserId || undefined;

      payload.primaryRole = formData.primaryRole;
      payload.additionalRoles = formData.additionalRoles;
      payload.donorTags = formData.donorTags;
      payload.communicationChannels = formData.communicationChannels;
      if (formData.preferredCommunicationMethod) payload.preferredCommunicationMethod = formData.preferredCommunicationMethod;
      if (formData.communicationNotes) payload.communicationNotes = formData.communicationNotes;
      payload.prefEmail = formData.prefEmail;
      payload.prefWhatsapp = formData.prefWhatsapp;
      payload.prefSms = formData.prefSms;
      payload.prefReminders = formData.prefReminders;
      payload.timezone = formData.timezone;
      payload.category = formData.primaryRole === "CSR" ? "CSR_REP" : "INDIVIDUAL";
      payload.isUnder18Helper = formData.isUnder18Helper;
      payload.isSeniorCitizen = formData.isSeniorCitizen;
      payload.isSingleParent = formData.isSingleParent;
      payload.isDisabled = formData.isDisabled;

      const allRoles = [formData.primaryRole, ...formData.additionalRoles];

      if (allRoles.includes("INDIVIDUAL")) {
        payload.individualProfile = {
          ...(individualProfile.donationFrequency ? { donationFrequency: individualProfile.donationFrequency } : {}),
          supportTypes: individualProfile.supportTypes,
          donorTags: individualProfile.donorTags,
        };
      }
      if (allRoles.includes("VOLUNTEER")) {
        payload.volunteerProfile = {
          ...(volunteerProfile.volunteerType ? { volunteerType: volunteerProfile.volunteerType } : {}),
          ...(volunteerProfile.workMode ? { workMode: volunteerProfile.workMode } : {}),
          skills: volunteerProfile.skills,
          areasOfInterest: volunteerProfile.areasOfInterest,
          inmatesSupport: volunteerProfile.inmatesSupport,
          adminSupport: volunteerProfile.adminSupport,
          ...(volunteerProfile.engagementLevel ? { engagementLevel: volunteerProfile.engagementLevel } : {}),
          ...(volunteerProfile.availabilityType ? { availabilityType: volunteerProfile.availabilityType } : {}),
          ...(volunteerProfile.timePreference ? { timePreference: volunteerProfile.timePreference } : {}),
          willingToDonate: volunteerProfile.willingToDonate,
        };
      }
      if (allRoles.includes("INFLUENCER")) {
        payload.influencerProfile = {
          influenceTypes: influencerProfile.influenceTypes,
          ...(influencerProfile.groupName ? { groupName: influencerProfile.groupName } : {}),
          ...(influencerProfile.audienceSize ? { audienceSize: parseInt(influencerProfile.audienceSize) } : {}),
          ...(influencerProfile.engagementLevel ? { engagementLevel: influencerProfile.engagementLevel } : {}),
          contributionTypes: influencerProfile.contributionTypes,
          ...(influencerProfile.contributionPattern ? { contributionPattern: influencerProfile.contributionPattern } : {}),
          ...(influencerProfile.relationshipStrength ? { relationshipStrength: influencerProfile.relationshipStrength } : {}),
        };
      }
      if (allRoles.includes("CSR")) {
        payload.csrProfile = {
          ...(csrProfile.companyName ? { companyName: csrProfile.companyName } : {}),
          ...(csrProfile.designation ? { designation: csrProfile.designation } : {}),
          ...(csrProfile.industry ? { industry: csrProfile.industry } : {}),
          ...(csrProfile.companySize ? { companySize: csrProfile.companySize } : {}),
          ...(csrProfile.companyAddress ? { companyAddress: csrProfile.companyAddress } : {}),
          ...(csrProfile.csrAltName ? { csrAltName: csrProfile.csrAltName } : {}),
          ...(csrProfile.csrAltPhone ? { csrAltPhone: csrProfile.csrAltPhone } : {}),
          ...(csrProfile.csrAltEmail ? { csrAltEmail: csrProfile.csrAltEmail } : {}),
          ...(csrProfile.csrOfficialEmailPrimary ? { csrOfficialEmailPrimary: csrProfile.csrOfficialEmailPrimary } : {}),
          ...(csrProfile.csrOfficialEmailSecondary ? { csrOfficialEmailSecondary: csrProfile.csrOfficialEmailSecondary } : {}),
          ...(csrProfile.csrBudget ? { csrBudget: parseFloat(csrProfile.csrBudget) } : {}),
          focusAreas: csrProfile.focusAreas,
          supportTypes: csrProfile.supportTypes,
          ...(csrProfile.csrSupportType ? { csrSupportType: csrProfile.csrSupportType } : {}),
          ...(csrProfile.decisionRole ? { decisionRole: csrProfile.decisionRole } : {}),
          ...(csrProfile.relationshipStrength ? { relationshipStrength: csrProfile.relationshipStrength } : {}),
          ...(csrProfile.lastContactDate ? { lastContactDate: new Date(csrProfile.lastContactDate).toISOString() } : {}),
          ...(csrProfile.nextFollowUpDate ? { nextFollowUpDate: new Date(csrProfile.nextFollowUpDate).toISOString() } : {}),
          ...(csrProfile.meetingStatus ? { meetingStatus: csrProfile.meetingStatus } : {}),
          ...(csrProfile.expectedContribution ? { expectedContribution: parseFloat(csrProfile.expectedContribution) } : {}),
          proposalShared: csrProfile.proposalShared,
        };
      }

      const res = await fetchWithAuth(`/api/donors/${donorId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (photoFile) {
          try {
            const fd = new FormData();
            fd.append("photo", photoFile);
            const photoRes = await fetchWithAuth(`/api/donors/${donorId}/upload-photo`, { method: "POST", body: fd });
            if (!photoRes.ok) {
              toast({ title: "Photo Upload Failed", description: "Profile saved but photo could not be uploaded.", variant: "destructive" });
            }
          } catch {}
        }
        toast({ title: "Donor Updated", description: "Donor profile has been updated successfully" });
        router.push(`/dashboard/donors/${donorId}`);
      } else {
        const error = await res.json().catch(() => ({ message: "Unknown error" }));
        toast({ title: "Error", description: error.message || "Failed to update donor", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An error occurred while updating the donor", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (user && !hasPermission(user?.role, "donors", "edit")) return <AccessDenied />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const tabs = visibleTabs();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Donor</h1>
          <p className="text-muted-foreground mt-1">Update profile for {donorCode}</p>
        </div>
      </div>

      <div className="grid gap-6">

        {/* 1. Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-3">
              <Label className="mb-2 block">Donor Photo</Label>
              <div className="flex items-center gap-4">
                {photoPreview || existingPhotoUrl ? (
                  <div className="relative">
                    <img
                      src={photoPreview || existingPhotoUrl || ""}
                      alt="Preview"
                      className="h-20 w-20 rounded-full object-cover border-2 border-border"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      data-testid="button-remove-photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="w-auto"
                    data-testid="input-donor-photo"
                  />
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or WebP. Max 3MB.</p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={formData.firstName} onChange={(e) => handleChange("firstName", e.target.value)} placeholder="First name" data-testid="input-first-name" />
            </div>
            <div>
              <Label htmlFor="middleName">Middle Name</Label>
              <Input id="middleName" value={formData.middleName} onChange={(e) => handleChange("middleName", e.target.value)} placeholder="Middle name" data-testid="input-middle-name" />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={formData.lastName} onChange={(e) => handleChange("lastName", e.target.value)} placeholder="Last name" data-testid="input-last-name" />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                <SelectTrigger data-testid="select-gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>{GENDERS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="approximateAge">Approximate Age</Label>
              <Input id="approximateAge" type="number" value={formData.approximateAge} onChange={(e) => handleChange("approximateAge", e.target.value)} placeholder="Age" data-testid="input-age" />
            </div>
            <div>
              <Label htmlFor="profession">Profession</Label>
              <Input id="profession" value={formData.profession} onChange={(e) => handleChange("profession", e.target.value)} placeholder="Profession" data-testid="input-profession" />
            </div>
            <div>
              <Label htmlFor="donorSince">Donor Since</Label>
              <Input id="donorSince" type="date" value={formData.donorSince} onChange={(e) => handleChange("donorSince", e.target.value)} data-testid="input-donor-since" />
            </div>
            <div>
              <Label htmlFor="religion">Religion</Label>
              <Select value={formData.religion} onValueChange={(v) => handleChange("religion", v)}>
                <SelectTrigger data-testid="select-religion"><SelectValue placeholder="Select religion" /></SelectTrigger>
                <SelectContent>{RELIGIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="incomeSpectrum">Income Spectrum</Label>
              <Select value={formData.incomeSpectrum} onValueChange={(v) => handleChange("incomeSpectrum", v)}>
                <SelectTrigger data-testid="select-income"><SelectValue placeholder="Select income level" /></SelectTrigger>
                <SelectContent>{INCOME_SPECTRUMS.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 2. Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-2">
                <div className="w-20 shrink-0">
                  <Label>Code</Label>
                  <Input value={formData.primaryPhoneCode} onChange={(e) => handleChange("primaryPhoneCode", e.target.value)} />
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor="primaryPhone">Primary Phone</Label>
                  <Input id="primaryPhone" value={formData.primaryPhone} onChange={(e) => handleChange("primaryPhone", e.target.value)} placeholder="Phone number" data-testid="input-primary-phone" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-20 shrink-0">
                  <Label>Code</Label>
                  <Input value={formData.alternatePhoneCode} onChange={(e) => handleChange("alternatePhoneCode", e.target.value)} />
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input id="alternatePhone" value={formData.alternatePhone} onChange={(e) => handleChange("alternatePhone", e.target.value)} placeholder="Alternate phone" />
                </div>
              </div>
              <div>
                <Label htmlFor="personalEmail">Email</Label>
                <Input id="personalEmail" type="email" value={formData.personalEmail} onChange={(e) => handleChange("personalEmail", e.target.value)} placeholder="Email address" data-testid="input-personal-email" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex gap-2">
                <div className="w-20 shrink-0">
                  <Label>Code</Label>
                  <Input value={formData.whatsappPhoneCode} onChange={(e) => handleChange("whatsappPhoneCode", e.target.value)} />
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor="whatsappPhone">WhatsApp Phone</Label>
                  <Input id="whatsappPhone" value={formData.whatsappPhone} onChange={(e) => handleChange("whatsappPhone", e.target.value)} placeholder="WhatsApp number" />
                </div>
              </div>
              <div>
                <Label htmlFor="officialEmail">Official Email</Label>
                <Input id="officialEmail" type="email" value={formData.officialEmail} onChange={(e) => handleChange("officialEmail", e.target.value)} placeholder="Official email" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Textarea id="address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="Street address" rows={2} data-testid="input-address" />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="City" data-testid="input-city" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" value={formData.state} onChange={(e) => handleChange("state", e.target.value)} placeholder="State" />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={formData.country} onChange={(e) => handleChange("country", e.target.value)} placeholder="Country" />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" value={formData.pincode} onChange={(e) => handleChange("pincode", e.target.value)} placeholder="Pincode" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Role Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Role Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block text-sm font-medium">Primary Role</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRIMARY_ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.primaryRole === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => {
                        handleChange("primaryRole", role.value);
                        setActiveTab(role.value.toLowerCase() === "csr" ? "csr" : role.value.toLowerCase() === "volunteer" ? "volunteer" : role.value.toLowerCase() === "influencer" ? "influencer" : "individual");
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                      data-testid={`role-btn-${role.value.toLowerCase()}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{role.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium">Additional Roles</Label>
              <div className="flex flex-wrap gap-2">
                {PRIMARY_ROLES.filter((r) => r.value !== formData.primaryRole).map((role) => {
                  const isAdded = formData.additionalRoles.includes(role.value);
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => toggleRole(role.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        isAdded ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                      }`}
                      data-testid={`additional-role-${role.value.toLowerCase()}`}
                    >
                      {isAdded ? "✓ " : "+ "}{role.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Role-Specific Profile Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Donation Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                {tabs.includes("individual") && <TabsTrigger value="individual" data-testid="tab-individual">Individual</TabsTrigger>}
                {tabs.includes("csr") && <TabsTrigger value="csr" data-testid="tab-csr">CSR</TabsTrigger>}
                {tabs.includes("volunteer") && <TabsTrigger value="volunteer" data-testid="tab-volunteer">Volunteer</TabsTrigger>}
                {tabs.includes("influencer") && <TabsTrigger value="influencer" data-testid="tab-influencer">Influencer</TabsTrigger>}
              </TabsList>

              <TabsContent value="individual" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Donation Frequency</Label>
                    <Select value={individualProfile.donationFrequency} onValueChange={(v) => setIndividualProfile((p) => ({ ...p, donationFrequency: v }))}>
                      <SelectTrigger data-testid="select-donation-frequency"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                      <SelectContent>{DONATION_FREQUENCIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Support Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {SUPPORT_TYPES.map((st) => (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => setIndividualProfile((p) => ({ ...p, supportTypes: toggleArrayItem(p.supportTypes, st.value) }))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          individualProfile.supportTypes.includes(st.value)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                        data-testid={`support-type-${st.value.toLowerCase()}`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Donor Tags (Profile)</Label>
                  <div className="flex flex-wrap gap-2">
                    {DONOR_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setIndividualProfile((p) => ({ ...p, donorTags: toggleArrayItem(p.donorTags, tag) }))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          individualProfile.donorTags.includes(tag)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                        data-testid={`profile-tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="csr" className="space-y-6">
                {/* Company Details */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Company Details</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Company Name</Label>
                      <Input value={csrProfile.companyName} onChange={(e) => setCsrProfile((p) => ({ ...p, companyName: e.target.value }))} placeholder="Company name" data-testid="input-company-name" />
                    </div>
                    <div>
                      <Label>Designation</Label>
                      <Input value={csrProfile.designation} onChange={(e) => setCsrProfile((p) => ({ ...p, designation: e.target.value }))} placeholder="e.g. CSR Head" />
                    </div>
                    <div>
                      <Label>Industry</Label>
                      <Input value={csrProfile.industry} onChange={(e) => setCsrProfile((p) => ({ ...p, industry: e.target.value }))} placeholder="e.g. Technology, FMCG" />
                    </div>
                    <div>
                      <Label>Company Size</Label>
                      <Input value={csrProfile.companySize} onChange={(e) => setCsrProfile((p) => ({ ...p, companySize: e.target.value }))} placeholder="e.g. 500–1000 employees" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Company Address</Label>
                      <Textarea value={csrProfile.companyAddress} onChange={(e) => setCsrProfile((p) => ({ ...p, companyAddress: e.target.value }))} placeholder="Company registered / office address" rows={2} data-testid="input-company-address" />
                    </div>
                  </div>
                </div>

                {/* Alternate CSR Contact */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Alternate CSR Contact</p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Contact Name</Label>
                      <Input value={csrProfile.csrAltName} onChange={(e) => setCsrProfile((p) => ({ ...p, csrAltName: e.target.value }))} placeholder="Alternate contact name" data-testid="input-csr-alt-name" />
                    </div>
                    <div>
                      <Label>Contact Phone</Label>
                      <Input value={csrProfile.csrAltPhone} onChange={(e) => setCsrProfile((p) => ({ ...p, csrAltPhone: e.target.value }))} placeholder="+91 98765 43210" data-testid="input-csr-alt-phone" />
                    </div>
                    <div>
                      <Label>Contact Email</Label>
                      <Input type="email" value={csrProfile.csrAltEmail} onChange={(e) => setCsrProfile((p) => ({ ...p, csrAltEmail: e.target.value }))} placeholder="alt@company.com" data-testid="input-csr-alt-email" />
                    </div>
                  </div>
                </div>

                {/* Official Emails */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Official Emails</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Primary Official Email</Label>
                      <Input type="email" value={csrProfile.csrOfficialEmailPrimary} onChange={(e) => setCsrProfile((p) => ({ ...p, csrOfficialEmailPrimary: e.target.value }))} placeholder="csr@company.com" data-testid="input-csr-email-primary" />
                    </div>
                    <div>
                      <Label>Secondary Official Email</Label>
                      <Input type="email" value={csrProfile.csrOfficialEmailSecondary} onChange={(e) => setCsrProfile((p) => ({ ...p, csrOfficialEmailSecondary: e.target.value }))} placeholder="csr2@company.com" data-testid="input-csr-email-secondary" />
                    </div>
                  </div>
                </div>

                {/* CSR Profile */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">CSR Profile</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>CSR Budget (₹)</Label>
                      <Input type="number" value={csrProfile.csrBudget} onChange={(e) => setCsrProfile((p) => ({ ...p, csrBudget: e.target.value }))} placeholder="Annual budget" data-testid="input-csr-budget" />
                    </div>
                    <div>
                      <Label>Expected Contribution (₹)</Label>
                      <Input type="number" value={csrProfile.expectedContribution} onChange={(e) => setCsrProfile((p) => ({ ...p, expectedContribution: e.target.value }))} placeholder="Expected amount" />
                    </div>
                    <div>
                      <Label>Support Type</Label>
                      <Select value={csrProfile.csrSupportType} onValueChange={(v) => setCsrProfile((p) => ({ ...p, csrSupportType: v }))}>
                        <SelectTrigger data-testid="select-csr-support-type"><SelectValue placeholder="Type of support" /></SelectTrigger>
                        <SelectContent>{CSR_SUPPORT_TYPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="mb-2 block">Focus Areas</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Education", "Healthcare", "Environment", "Women Empowerment", "Child Welfare", "Elderly Care", "Livelihood", "Skill Development"].map((area) => (
                        <button key={area} type="button" onClick={() => setCsrProfile((p) => ({ ...p, focusAreas: toggleArrayItem(p.focusAreas, area) }))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${csrProfile.focusAreas.includes(area) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Decision & Follow-up */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Decision & Follow-up</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Decision Role</Label>
                      <Input value={csrProfile.decisionRole} onChange={(e) => setCsrProfile((p) => ({ ...p, decisionRole: e.target.value }))} placeholder="e.g. Decision Maker, Influencer" data-testid="input-decision-role" />
                    </div>
                    <div>
                      <Label>Relationship Strength</Label>
                      <Select value={csrProfile.relationshipStrength} onValueChange={(v) => setCsrProfile((p) => ({ ...p, relationshipStrength: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select strength" /></SelectTrigger>
                        <SelectContent>{RELATIONSHIP_STRENGTHS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Last Contact Date</Label>
                      <Input type="date" value={csrProfile.lastContactDate} onChange={(e) => setCsrProfile((p) => ({ ...p, lastContactDate: e.target.value }))} data-testid="input-last-contact-date" />
                    </div>
                    <div>
                      <Label>Next Follow-up Date</Label>
                      <Input type="date" value={csrProfile.nextFollowUpDate} onChange={(e) => setCsrProfile((p) => ({ ...p, nextFollowUpDate: e.target.value }))} data-testid="input-next-followup-date" />
                    </div>
                    <div>
                      <Label>Meeting Status</Label>
                      <Select value={csrProfile.meetingStatus} onValueChange={(v) => setCsrProfile((p) => ({ ...p, meetingStatus: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>{MEETING_STATUSES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <Checkbox id="csr-proposalShared" checked={csrProfile.proposalShared} onCheckedChange={(c) => setCsrProfile((p) => ({ ...p, proposalShared: !!c }))} data-testid="checkbox-proposal-shared" />
                      <Label htmlFor="csr-proposalShared" className="font-normal">Proposal Shared</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="volunteer" className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Volunteer Details</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Volunteer Type</Label>
                      <Select value={volunteerProfile.volunteerType} onValueChange={(v) => setVolunteerProfile((p) => ({ ...p, volunteerType: v, inmatesSupport: [], adminSupport: [] }))}>
                        <SelectTrigger data-testid="select-volunteer-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>{VOLUNTEER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Work Mode</Label>
                      <Select value={volunteerProfile.workMode} onValueChange={(v) => setVolunteerProfile((p) => ({ ...p, workMode: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                        <SelectContent>{WORK_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Engagement Level</Label>
                      <Select value={volunteerProfile.engagementLevel} onValueChange={(v) => setVolunteerProfile((p) => ({ ...p, engagementLevel: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                        <SelectContent>{ENGAGEMENT_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Availability</Label>
                      <Input value={volunteerProfile.availabilityType} onChange={(e) => setVolunteerProfile((p) => ({ ...p, availabilityType: e.target.value }))} placeholder="e.g. Weekends, Evenings" />
                    </div>
                    <div>
                      <Label>Time Preference</Label>
                      <Input value={volunteerProfile.timePreference} onChange={(e) => setVolunteerProfile((p) => ({ ...p, timePreference: e.target.value }))} placeholder="e.g. Morning" />
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <Checkbox id="willingToDonate" checked={volunteerProfile.willingToDonate} onCheckedChange={(c) => setVolunteerProfile((p) => ({ ...p, willingToDonate: !!c }))} data-testid="checkbox-willing-to-donate" />
                      <Label htmlFor="willingToDonate" className="font-normal">Willing to Donate</Label>
                    </div>
                  </div>
                </div>

                {volunteerProfile.volunteerType === "FIELD" && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Nature of Work — Inmate Support</p>
                    <div className="flex flex-wrap gap-2">
                      {INMATES_SUPPORT_OPTIONS.map((opt) => (
                        <button key={opt} type="button" onClick={() => setVolunteerProfile((p) => ({ ...p, inmatesSupport: toggleArrayItem(p.inmatesSupport, opt) }))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${volunteerProfile.inmatesSupport.includes(opt) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {volunteerProfile.volunteerType === "ADMIN" && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Nature of Work — Admin Support</p>
                    <div className="flex flex-wrap gap-2">
                      {ADMIN_SUPPORT_OPTIONS.map((opt) => (
                        <button key={opt} type="button" onClick={() => setVolunteerProfile((p) => ({ ...p, adminSupport: toggleArrayItem(p.adminSupport, opt) }))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${volunteerProfile.adminSupport.includes(opt) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="mb-2 block">Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Teaching", "Medical", "Accounting", "Photography", "Social Media", "Cooking", "Driving", "IT / Tech", "Legal", "Counseling"].map((skill) => (
                      <button key={skill} type="button" onClick={() => setVolunteerProfile((p) => ({ ...p, skills: toggleArrayItem(p.skills, skill) }))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${volunteerProfile.skills.includes(skill) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Areas of Interest</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Education", "Healthcare", "Elder Care", "Child Development", "Events", "Fundraising", "Administration"].map((area) => (
                      <button key={area} type="button" onClick={() => setVolunteerProfile((p) => ({ ...p, areasOfInterest: toggleArrayItem(p.areasOfInterest, area) }))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${volunteerProfile.areasOfInterest.includes(area) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="influencer" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Group / Network Name</Label>
                    <Input value={influencerProfile.groupName} onChange={(e) => setInfluencerProfile((p) => ({ ...p, groupName: e.target.value }))} placeholder="e.g. Lions Club, WhatsApp Group" data-testid="input-group-name" />
                  </div>
                  <div>
                    <Label>Audience Size</Label>
                    <Input type="number" value={influencerProfile.audienceSize} onChange={(e) => setInfluencerProfile((p) => ({ ...p, audienceSize: e.target.value }))} placeholder="No. of followers" data-testid="input-audience-size" />
                  </div>
                  <div>
                    <Label>Engagement Level</Label>
                    <Select value={influencerProfile.engagementLevel} onValueChange={(v) => setInfluencerProfile((p) => ({ ...p, engagementLevel: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>{ENGAGEMENT_LEVELS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Relationship Strength</Label>
                    <Select value={influencerProfile.relationshipStrength} onValueChange={(v) => setInfluencerProfile((p) => ({ ...p, relationshipStrength: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select strength" /></SelectTrigger>
                      <SelectContent>{RELATIONSHIP_STRENGTHS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Contribution Pattern</Label>
                    <Input value={influencerProfile.contributionPattern} onChange={(e) => setInfluencerProfile((p) => ({ ...p, contributionPattern: e.target.value }))} placeholder="e.g. Monthly posts" />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Influence Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {INFLUENCE_TYPES.map((t) => (
                      <button key={t} type="button" onClick={() => setInfluencerProfile((p) => ({ ...p, influenceTypes: toggleArrayItem(p.influenceTypes, t) }))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${influencerProfile.influenceTypes.includes(t) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                        data-testid={`influence-type-${t.toLowerCase().replace(/\s+/g, "-")}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Contribution Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {CONTRIBUTION_TYPES.map((t) => (
                      <button key={t} type="button" onClick={() => setInfluencerProfile((p) => ({ ...p, contributionTypes: toggleArrayItem(p.contributionTypes, t) }))}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${influencerProfile.contributionTypes.includes(t) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                        data-testid={`contribution-type-${t.toLowerCase().replace(/\s+/g, "-")}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 6. Communication Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Communication Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-3 block">Notification Channels</Label>
              <div className="flex flex-wrap gap-6">
                {[
                  { id: "prefEmail", label: "Email", field: "prefEmail" },
                  { id: "prefWhatsapp", label: "WhatsApp", field: "prefWhatsapp" },
                  { id: "prefSms", label: "SMS", field: "prefSms" },
                  { id: "prefReminders", label: "Reminders", field: "prefReminders" },
                ].map((ch) => (
                  <div key={ch.id} className="flex items-center gap-2">
                    <Checkbox
                      id={ch.id}
                      checked={formData[ch.field as keyof typeof formData] as boolean}
                      onCheckedChange={(c) => handleChange(ch.field, c)}
                      data-testid={`checkbox-${ch.id.toLowerCase()}`}
                    />
                    <Label htmlFor={ch.id} className="font-normal">{ch.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Communication Channels</Label>
              <div className="flex flex-wrap gap-2">
                {COMM_CHANNELS.map((ch) => (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => handleChange("communicationChannels", toggleArrayItem(formData.communicationChannels, ch.value))}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${formData.communicationChannels.includes(ch.value) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                    data-testid={`comm-channel-${ch.value}`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Preferred Communication Method</Label>
                <Select value={formData.preferredCommunicationMethod} onValueChange={(v) => handleChange("preferredCommunicationMethod", v)}>
                  <SelectTrigger data-testid="select-pref-comm-method"><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>{COMM_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="communicationNotes">Communication Notes</Label>
              <Textarea
                id="communicationNotes"
                value={formData.communicationNotes}
                onChange={(e) => handleChange("communicationNotes", e.target.value)}
                placeholder="Any special communication instructions..."
                rows={2}
                data-testid="input-comm-notes"
              />
            </div>
          </CardContent>
        </Card>

        {/* 7. Donor Tags & Smart Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags & Smart Fields
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Donor Tags</Label>
              <div className="flex flex-wrap gap-2">
                {DONOR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleChange("donorTags", toggleArrayItem(formData.donorTags, tag))}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${formData.donorTags.includes(tag) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                    data-testid={`donor-tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>ID Proof</Label>
              <div className="flex gap-2">
                <Select value={idType} onValueChange={(v) => { setIdType(v as "PAN" | "AADHAR"); handleChange("pan", ""); }}>
                  <SelectTrigger className="w-28" data-testid="select-id-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAN">PAN</SelectItem>
                    <SelectItem value="AADHAR">Aadhar</SelectItem>
                  </SelectContent>
                </Select>
                {idType === "PAN" ? (
                  <Input
                    value={formData.pan}
                    onChange={(e) => handleChange("pan", e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    data-testid="input-pan"
                    className={formData.pan && formData.pan.length > 0 ? (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan) ? "border-green-500 focus-visible:ring-green-500" : "border-red-400 focus-visible:ring-red-400") : ""}
                  />
                ) : (
                  <Input
                    value={formData.pan}
                    onChange={(e) => handleChange("pan", e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="123456789012"
                    maxLength={12}
                    data-testid="input-aadhar"
                    className={formData.pan && formData.pan.length > 0 ? (/^\d{12}$/.test(formData.pan) ? "border-green-500 focus-visible:ring-green-500" : "border-red-400 focus-visible:ring-red-400") : ""}
                  />
                )}
              </div>
              {formData.pan && formData.pan.length > 0 && (
                <p className={`text-xs ${
                  (idType === "PAN" && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan)) ||
                  (idType === "AADHAR" && /^\d{12}$/.test(formData.pan))
                    ? "text-green-600"
                    : "text-red-500"
                }`}>
                  {idType === "PAN"
                    ? (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan) ? "Valid PAN format" : "Invalid — must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)")
                    : (/^\d{12}$/.test(formData.pan) ? "Valid Aadhar number" : `${formData.pan.length}/12 digits — must be exactly 12 digits`)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 8. Source & Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Source & Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Source of Donor</Label>
              <Select value={formData.sourceOfDonor} onValueChange={(v) => handleChange("sourceOfDonor", v)}>
                <SelectTrigger data-testid="select-source"><SelectValue placeholder="How did they find us?" /></SelectTrigger>
                <SelectContent>{SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sourceDetails">Source Details</Label>
              <Input id="sourceDetails" value={formData.sourceDetails} onChange={(e) => handleChange("sourceDetails", e.target.value)} placeholder="Additional details about source" />
            </div>
            {userRole === "ADMIN" && staffMembers.length > 0 && (
              <div>
                <Label>Assign To</Label>
                <Select value={formData.assignedToUserId || "unassigned"} onValueChange={(v) => handleChange("assignedToUserId", v === "unassigned" ? "" : v)}>
                  <SelectTrigger data-testid="select-assigned"><SelectValue placeholder="Select staff member" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staffMembers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Additional notes about this donor" rows={3} data-testid="input-notes" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-4 sticky bottom-0 py-4 bg-background border-t">
        <Button variant="outline" onClick={() => router.back()} data-testid="button-cancel">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving} data-testid="button-save">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
