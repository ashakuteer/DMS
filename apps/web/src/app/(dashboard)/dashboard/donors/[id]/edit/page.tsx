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
import { ArrowLeft, Save, User, Phone, MapPin, Settings, Users, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { resolveImageUrl } from "@/lib/image-url";

interface StaffMember {
  id: string;
  name: string;
}

const CATEGORIES = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "NGO", label: "NGO" },
  { value: "CSR_REP", label: "CSR Representative" },
  { value: "WHATSAPP_GROUP", label: "WhatsApp Group" },
  { value: "SOCIAL_MEDIA_PERSON", label: "Social Media Person" },
  { value: "CROWD_PULLER", label: "Crowd Puller" },
  { value: "VISITOR_ENQUIRY", label: "Visitor Enquiry" },
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
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "HALF_YEARLY", label: "Half Yearly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "OCCASIONAL", label: "Occasional" },
];

const SOURCES = [
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "JUSTDIAL", label: "JustDial" },
  { value: "FRIEND", label: "Friend" },
  { value: "SPONSOR", label: "Sponsor" },
  { value: "WEBSITE", label: "Website" },
  { value: "WALK_IN", label: "Walk In" },
  { value: "REFERRAL", label: "Referral" },
  { value: "OTHER", label: "Other" },
];

const SUPPORT_PREFERENCES = [
  { value: "GROCERIES", label: "Groceries" },
  { value: "EDUCATION", label: "Education" },
  { value: "MEDICINES", label: "Medicines" },
  { value: "TOILETRIES", label: "Toiletries" },
  { value: "SPONSORSHIP", label: "Sponsorship" },
  { value: "GENERAL", label: "General" },
];

export default function EditDonorPage() {
  const router = useRouter();
  const params = useParams();
  const donorId = params.id as string;
  const { toast } = useToast();
  const user = authStorage.getUser();

  if (donor.profilePicUrl) {
  setExistingPhotoUrl(resolveImageUrl(donor.profilePicUrl));
} else {
  setExistingPhotoUrl(null);
}

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [donorCode, setDonorCode] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

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
    approximateAge: "",
    gender: "",
    incomeSpectrum: "",
    religion: "",
    donationFrequency: "",
    notes: "",
    prefEmail: true,
    prefWhatsapp: true,
    prefSms: false,
    prefReminders: true,
    timezone: "Asia/Kolkata",
    category: "INDIVIDUAL",
    isUnder18Helper: false,
    isSeniorCitizen: false,
    isSingleParent: false,
    isDisabled: false,
    sourceOfDonor: "",
    sourceDetails: "",
    pan: "",
    assignedToUserId: "",
    supportPreferences: [] as string[],
  });

  const fetchDonor = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetchWithAuth(`/api/donors/${donorId}`);

      if (res.ok) {
        const donor = await res.json();
        setDonorCode(donor.donorCode);

      if (donor.profilePicUrl) {
  setExistingPhotoUrl(normalizeImageUrl(donor.profilePicUrl));
} else {
  setExistingPhotoUrl(null);
}

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
          approximateAge: donor.approximateAge?.toString() || "",
          gender: donor.gender || "",
          incomeSpectrum: donor.incomeSpectrum || "",
          religion: donor.religion || "",
          donationFrequency: donor.donationFrequency || "",
          notes: donor.notes || "",
          prefEmail: donor.prefEmail ?? true,
          prefWhatsapp: donor.prefWhatsapp ?? true,
          prefSms: donor.prefSms ?? false,
          prefReminders: donor.prefReminders ?? true,
          timezone: donor.timezone || "Asia/Kolkata",
          category: donor.category || "INDIVIDUAL",
          isUnder18Helper: donor.isUnder18Helper ?? false,
          isSeniorCitizen: donor.isSeniorCitizen ?? false,
          isSingleParent: donor.isSingleParent ?? false,
          isDisabled: donor.isDisabled ?? false,
          sourceOfDonor: donor.sourceOfDonor || "",
          sourceDetails: donor.sourceDetails || "",
          pan: donor.pan || "",
          assignedToUserId: donor.assignedToUserId || "",
          supportPreferences: donor.supportPreferences || [],
        });
      } else if (res.status === 403) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to edit this donor",
          variant: "destructive",
        });
        router.push("/dashboard/donors");
      } else if (res.status === 404) {
        toast({
          title: "Not Found",
          description: "Donor not found",
          variant: "destructive",
        });
        router.push("/dashboard/donors");
      }
    } catch (error) {
      console.error("Error fetching donor:", error);
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
        const res = await fetchWithAuth("/api/users");
        if (res.ok) {
          const users = await res.json();
          setStaffMembers(users.filter((u: any) => u.role !== "ADMIN"));
        }
      } catch {}
    };

    fetchProfile();
    fetchStaff();
    fetchDonor();
  }, [fetchDonor]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName && !formData.primaryPhone && !formData.personalEmail) {
      toast({
        title: "Validation Error",
        description: "Please provide at least a name, phone, or email",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "Error", description: "Photo must be under 3MB", variant: "destructive" });
      return;
    }
    setPhotoFile(file);
    setExistingPhotoUrl(null);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setExistingPhotoUrl(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload: Record<string, any> = {};

      payload.firstName = formData.firstName || undefined;
      payload.middleName = formData.middleName || undefined;
      payload.lastName = formData.lastName || undefined;
      payload.primaryPhone = formData.primaryPhone || undefined;
      payload.primaryPhoneCode = formData.primaryPhoneCode;
      payload.alternatePhone = formData.alternatePhone || undefined;
      payload.alternatePhoneCode = formData.alternatePhoneCode;
      payload.whatsappPhone = formData.whatsappPhone || undefined;
      payload.whatsappPhoneCode = formData.whatsappPhoneCode;
      payload.personalEmail = formData.personalEmail || undefined;
      payload.officialEmail = formData.officialEmail || undefined;
      payload.address = formData.address || undefined;
      payload.city = formData.city || undefined;
      payload.state = formData.state || undefined;
      payload.country = formData.country || undefined;
      payload.pincode = formData.pincode || undefined;
      payload.profession = formData.profession || undefined;
      payload.approximateAge = formData.approximateAge ? parseInt(formData.approximateAge) : undefined;
      payload.gender = formData.gender || undefined;
      payload.incomeSpectrum = formData.incomeSpectrum || undefined;
      payload.religion = formData.religion || undefined;
      payload.donationFrequency = formData.donationFrequency || undefined;
      payload.notes = formData.notes || undefined;
      payload.sourceOfDonor = formData.sourceOfDonor || undefined;
      payload.sourceDetails = formData.sourceDetails || undefined;
      payload.pan = formData.pan || undefined;
      payload.assignedToUserId = formData.assignedToUserId || undefined;

      payload.prefEmail = formData.prefEmail;
      payload.prefWhatsapp = formData.prefWhatsapp;
      payload.prefSms = formData.prefSms;
      payload.prefReminders = formData.prefReminders;
      payload.timezone = formData.timezone;
      payload.category = formData.category;
      payload.isUnder18Helper = formData.isUnder18Helper;
      payload.isSeniorCitizen = formData.isSeniorCitizen;
      payload.isSingleParent = formData.isSingleParent;
      payload.isDisabled = formData.isDisabled;
      payload.supportPreferences = formData.supportPreferences;

      const res = await fetchWithAuth(`/api/donors/${donorId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (photoFile) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append("photo", photoFile);
            await fetchWithAuth(`/api/donors/${donorId}/upload-photo`, {
              method: "POST",
              body: formDataUpload,
            });
          } catch {
            toast({ title: "Warning", description: "Donor updated but photo upload failed" });
          }
        }
        toast({
          title: "Donor Updated",
          description: "Donor profile has been updated successfully",
        });
        router.push(`/dashboard/donors/${donorId}`);
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update donor",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An error occurred while updating the donor",
        variant: "destructive",
      });
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Donor</h1>
          <p className="text-muted-foreground mt-1">
            Update donor profile for {donorCode}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
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
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="Enter first name"
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => handleChange("middleName", e.target.value)}
                placeholder="Enter middle name"
                data-testid="input-middle-name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Enter last name"
                data-testid="input-last-name"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(v) => handleChange("category", v)}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                <SelectTrigger data-testid="select-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="approximateAge">Approximate Age</Label>
              <Input
                id="approximateAge"
                type="number"
                value={formData.approximateAge}
                onChange={(e) => handleChange("approximateAge", e.target.value)}
                placeholder="Age"
                data-testid="input-age"
              />
            </div>
            <div>
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) => handleChange("profession", e.target.value)}
                placeholder="Enter profession"
                data-testid="input-profession"
              />
            </div>
            <div>
              <Label htmlFor="religion">Religion</Label>
              <Input
                id="religion"
                value={formData.religion}
                onChange={(e) => handleChange("religion", e.target.value)}
                placeholder="Enter religion"
                data-testid="input-religion"
              />
            </div>
            <div>
              <Label htmlFor="incomeSpectrum">Income Spectrum</Label>
              <Select value={formData.incomeSpectrum} onValueChange={(v) => handleChange("incomeSpectrum", v)}>
                <SelectTrigger data-testid="select-income">
                  <SelectValue placeholder="Select income level" />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_SPECTRUMS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-2">
              <div className="w-24">
                <Label>Code</Label>
                <Input
                  value={formData.primaryPhoneCode}
                  onChange={(e) => handleChange("primaryPhoneCode", e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="primaryPhone">Primary Phone</Label>
                <Input
                  id="primaryPhone"
                  value={formData.primaryPhone}
                  onChange={(e) => handleChange("primaryPhone", e.target.value)}
                  placeholder="Enter phone number"
                  data-testid="input-primary-phone"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-24">
                <Label>Code</Label>
                <Input
                  value={formData.alternatePhoneCode}
                  onChange={(e) => handleChange("alternatePhoneCode", e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="alternatePhone">Alternate Phone</Label>
                <Input
                  id="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={(e) => handleChange("alternatePhone", e.target.value)}
                  placeholder="Enter alternate phone"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-24">
                <Label>Code</Label>
                <Input
                  value={formData.whatsappPhoneCode}
                  onChange={(e) => handleChange("whatsappPhoneCode", e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="whatsappPhone">WhatsApp Phone</Label>
                <Input
                  id="whatsappPhone"
                  value={formData.whatsappPhone}
                  onChange={(e) => handleChange("whatsappPhone", e.target.value)}
                  placeholder="Enter WhatsApp number"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="personalEmail">Personal Email</Label>
              <Input
                id="personalEmail"
                type="email"
                value={formData.personalEmail}
                onChange={(e) => handleChange("personalEmail", e.target.value)}
                placeholder="Enter personal email"
                data-testid="input-personal-email"
              />
            </div>
            <div>
              <Label htmlFor="officialEmail">Official Email</Label>
              <Input
                id="officialEmail"
                type="email"
                value={formData.officialEmail}
                onChange={(e) => handleChange("officialEmail", e.target.value)}
                placeholder="Enter official email"
              />
            </div>
          </CardContent>
        </Card>

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
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter street address"
                rows={2}
                data-testid="input-address"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="City"
                  data-testid="input-city"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="Country"
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  placeholder="Pincode"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Preferences & Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="donationFrequency">Donation Frequency</Label>
              <Select value={formData.donationFrequency} onValueChange={(v) => handleChange("donationFrequency", v)}>
                <SelectTrigger data-testid="select-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {DONATION_FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pan">PAN Number</Label>
              <Input
                id="pan"
                value={formData.pan}
                onChange={(e) => handleChange("pan", e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                data-testid="input-pan"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-3 block">Communication Preferences</Label>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="prefEmail"
                    checked={formData.prefEmail}
                    onCheckedChange={(c) => handleChange("prefEmail", c)}
                  />
                  <Label htmlFor="prefEmail" className="font-normal">Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="prefWhatsapp"
                    checked={formData.prefWhatsapp}
                    onCheckedChange={(c) => handleChange("prefWhatsapp", c)}
                  />
                  <Label htmlFor="prefWhatsapp" className="font-normal">WhatsApp</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="prefSms"
                    checked={formData.prefSms}
                    onCheckedChange={(c) => handleChange("prefSms", c)}
                  />
                  <Label htmlFor="prefSms" className="font-normal">SMS</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="prefReminders"
                    checked={formData.prefReminders}
                    onCheckedChange={(c) => handleChange("prefReminders", c)}
                  />
                  <Label htmlFor="prefReminders" className="font-normal">Reminders</Label>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label className="mb-3 block">Support Preferences</Label>
              <div className="flex flex-wrap gap-6">
                {SUPPORT_PREFERENCES.map((pref) => (
                  <div key={pref.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-supportPref-${pref.value}`}
                      checked={formData.supportPreferences.includes(pref.value)}
                      onCheckedChange={(checked) => {
                        const updated = checked
                          ? [...formData.supportPreferences, pref.value]
                          : formData.supportPreferences.filter((p) => p !== pref.value);
                        handleChange("supportPreferences", updated);
                      }}
                      data-testid={`checkbox-support-pref-${pref.value.toLowerCase()}`}
                    />
                    <Label htmlFor={`edit-supportPref-${pref.value}`} className="font-normal">{pref.label}</Label>
                  </div>
                ))}
              </div>
              {formData.supportPreferences.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.supportPreferences.map((p) => (
                    <Badge key={p} variant="secondary" data-testid={`badge-support-pref-${p.toLowerCase()}`}>
                      {SUPPORT_PREFERENCES.find((sp) => sp.value === p)?.label || p}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <Label className="mb-3 block">Special Flags</Label>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isUnder18Helper"
                    checked={formData.isUnder18Helper}
                    onCheckedChange={(c) => handleChange("isUnder18Helper", c)}
                  />
                  <Label htmlFor="isUnder18Helper" className="font-normal">Under 18 Helper</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isSeniorCitizen"
                    checked={formData.isSeniorCitizen}
                    onCheckedChange={(c) => handleChange("isSeniorCitizen", c)}
                  />
                  <Label htmlFor="isSeniorCitizen" className="font-normal">Senior Citizen</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isSingleParent"
                    checked={formData.isSingleParent}
                    onCheckedChange={(c) => handleChange("isSingleParent", c)}
                  />
                  <Label htmlFor="isSingleParent" className="font-normal">Single Parent</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isDisabled"
                    checked={formData.isDisabled}
                    onCheckedChange={(c) => handleChange("isDisabled", c)}
                  />
                  <Label htmlFor="isDisabled" className="font-normal">Disabled</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Source & Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="sourceOfDonor">Source of Donor</Label>
              <Select value={formData.sourceOfDonor} onValueChange={(v) => handleChange("sourceOfDonor", v)}>
                <SelectTrigger data-testid="select-source">
                  <SelectValue placeholder="How did they find us?" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sourceDetails">Source Details</Label>
              <Input
                id="sourceDetails"
                value={formData.sourceDetails}
                onChange={(e) => handleChange("sourceDetails", e.target.value)}
                placeholder="Additional details about source"
              />
            </div>
            {userRole === "ADMIN" && staffMembers.length > 0 && (
              <div>
                <Label htmlFor="assignedToUserId">Assign To</Label>
                <Select value={formData.assignedToUserId || "unassigned"} onValueChange={(v) => handleChange("assignedToUserId", v === "unassigned" ? "" : v)}>
                  <SelectTrigger data-testid="select-assigned">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staffMembers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Additional notes about this donor"
                rows={3}
                data-testid="input-notes"
              />
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
