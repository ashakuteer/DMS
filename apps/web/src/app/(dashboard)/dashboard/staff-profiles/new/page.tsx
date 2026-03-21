"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, UserPlus, Camera, Upload, X, FileText, Plus, Trash2,
} from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { AccessDenied } from "@/components/access-denied";

interface Home { id: string; name: string }

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const DESIGNATIONS = [
  "Supervisor", "Home Incharge", "Care Taker", "Nurse",
  "Cook", "Kitchen Helper", "Maid", "Cleaner", "Driver",
  "Telecaller", "Admin",
];

const DOC_TYPES: Record<string, string> = {
  AADHAR: "Aadhar Card",
  PAN: "PAN Card",
  APPOINTMENT: "Appointment Letter",
  EXPERIENCE: "Experience Certificate",
  OTHER: "Other Document",
};

interface QueuedDoc {
  key: string;
  type: string;
  file: File;
}

export default function NewStaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = authStorage.getUser();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [homes, setHomes] = useState<Home[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [queuedDocs, setQueuedDocs] = useState<QueuedDoc[]>([]);
  const [pendingDocType, setPendingDocType] = useState("AADHAR");
  const [progress, setProgress] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    roleType: "",
    designation: "",
    homeId: "",
    bloodGroup: "",
    emergencyContact1Name: "",
    emergencyContact1Phone: "",
    emergencyContact2Name: "",
    emergencyContact2Phone: "",
  });

  const [bank, setBank] = useState({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifsc: "",
    branch: "",
  });

  useEffect(() => {
    fetchWithAuth("/api/homes")
      .then((r) => r.json())
      .then((data) => setHomes(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const setF = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));
  const setB = (field: string, value: string) =>
    setBank((p) => ({ ...p, [field]: value }));

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Photo must be under 5MB", variant: "destructive" });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Documents must be under 5MB", variant: "destructive" });
      return;
    }
    setQueuedDocs((prev) => [
      ...prev,
      { key: `${Date.now()}-${file.name}`, type: pendingDocType, file },
    ]);
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const removeDoc = (key: string) =>
    setQueuedDocs((prev) => prev.filter((d) => d.key !== key));

  const getToken = () => authStorage.getAccessToken();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  const uploadFile = useCallback(
    async (endpoint: string, formData: FormData) => {
      const res = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
      }
      return res.json();
    },
    [apiBase]
  );

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: "Required", description: "Name is required", variant: "destructive" });
      return;
    }
    if (!form.phone.trim()) {
      toast({ title: "Required", description: "Phone is required", variant: "destructive" });
      return;
    }
    if (!form.roleType) {
      toast({ title: "Required", description: "Role Type is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the staff profile
      setProgress("Creating staff profile...");
      const payload: any = { ...form };
      if (!payload.homeId) delete payload.homeId;
      if (!payload.bloodGroup) delete payload.bloodGroup;

      const createRes = await fetchWithAuth("/api/staff-profiles", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.message || "Failed to create staff");
      }
      const created = await createRes.json();
      const staffId = created.id;

      // 2. Upload profile photo
      if (photoFile) {
        setProgress("Uploading photo...");
        const fd = new FormData();
        fd.append("file", photoFile);
        fd.append("staffId", staffId);
        await uploadFile("/api/staff-profiles/upload-photo", fd).catch(() =>
          toast({ title: "Photo upload failed", description: "Profile created without photo", variant: "destructive" })
        );
      }

      // 3. Upload documents
      for (let i = 0; i < queuedDocs.length; i++) {
        const doc = queuedDocs[i];
        setProgress(`Uploading document ${i + 1} of ${queuedDocs.length}...`);
        const fd = new FormData();
        fd.append("file", doc.file);
        fd.append("staffId", staffId);
        fd.append("type", doc.type);
        await uploadFile("/api/staff-profiles/upload-document", fd).catch(() => {
          toast({ title: "Document upload failed", description: `${DOC_TYPES[doc.type]} could not be uploaded`, variant: "destructive" });
        });
      }

      // 4. Save bank details if any filled
      const hasBankData = Object.values(bank).some((v) => v.trim());
      if (hasBankData) {
        setProgress("Saving bank details...");
        await fetchWithAuth(`/api/staff-profiles/${staffId}/bank-details`, {
          method: "POST",
          body: JSON.stringify(bank),
        }).catch(() => {
          toast({ title: "Bank details failed", description: "Profile created without bank details", variant: "destructive" });
        });
      }

      toast({ title: "Staff Created", description: `${form.name} has been added successfully` });
      router.push(`/dashboard/staff-profiles/${staffId}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "An unexpected error occurred", variant: "destructive" });
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  if (user?.role !== "FOUNDER" && user?.role !== "ADMIN") return <AccessDenied />;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Staff Member</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Fill in the details to create a new staff profile</p>
        </div>
      </div>

      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Profile Photo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div
              className="relative h-24 w-24 rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:border-orange-500 transition-colors"
              onClick={() => photoInputRef.current?.click()}
              data-testid="photo-upload-area"
            >
              {photoPreview ? (
                <Image src={photoPreview} alt="Preview" fill className="object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => photoInputRef.current?.click()}
                data-testid="button-select-photo"
              >
                <Upload className="mr-2 h-4 w-4" />
                {photoFile ? "Change Photo" : "Select Photo"}
              </Button>
              {photoFile && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{photoFile.name}</p>
                  <button
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="text-muted-foreground hover:text-destructive"
                    data-testid="button-remove-photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
            </div>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
            data-testid="input-photo-file"
          />
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="Enter full name" data-testid="input-name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setF("phone", e.target.value)} placeholder="+91 9xxxxxxxxx" data-testid="input-phone" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setF("email", e.target.value)} placeholder="staff@example.com" data-testid="input-email" />
          </div>
          <div className="space-y-1.5">
            <Label>Role Type *</Label>
            <Select value={form.roleType} onValueChange={(v) => setF("roleType", v)}>
              <SelectTrigger data-testid="select-role-type">
                <SelectValue placeholder="Select role type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="TELECALLER">Telecaller</SelectItem>
                <SelectItem value="HOME_STAFF">Home Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Designation</Label>
            <Select value={form.designation} onValueChange={(v) => setF("designation", v)}>
              <SelectTrigger data-testid="select-designation">
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent>
                {DESIGNATIONS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Home</Label>
            <Select value={form.homeId} onValueChange={(v) => setF("homeId", v)}>
              <SelectTrigger data-testid="select-home">
                <SelectValue placeholder="Select home" />
              </SelectTrigger>
              <SelectContent>
                {homes.map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Medical & Emergency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medical &amp; Emergency Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Blood Group</Label>
            <Select value={form.bloodGroup} onValueChange={(v) => setF("bloodGroup", v)}>
              <SelectTrigger data-testid="select-blood-group">
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div />
          <div className="space-y-1.5">
            <Label htmlFor="ec1n">Emergency Contact 1 — Name</Label>
            <Input id="ec1n" value={form.emergencyContact1Name} onChange={(e) => setF("emergencyContact1Name", e.target.value)} placeholder="Contact name" data-testid="input-ec1-name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec1p">Emergency Contact 1 — Phone</Label>
            <Input id="ec1p" value={form.emergencyContact1Phone} onChange={(e) => setF("emergencyContact1Phone", e.target.value)} placeholder="Phone number" data-testid="input-ec1-phone" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec2n">Emergency Contact 2 — Name</Label>
            <Input id="ec2n" value={form.emergencyContact2Name} onChange={(e) => setF("emergencyContact2Name", e.target.value)} placeholder="Contact name" data-testid="input-ec2-name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec2p">Emergency Contact 2 — Phone</Label>
            <Input id="ec2p" value={form.emergencyContact2Phone} onChange={(e) => setF("emergencyContact2Phone", e.target.value)} placeholder="Phone number" data-testid="input-ec2-phone" />
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
            <span className="text-xs font-normal text-muted-foreground">(uploaded after creation)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={pendingDocType} onValueChange={setPendingDocType}>
              <SelectTrigger className="w-[200px]" data-testid="select-doc-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOC_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => docInputRef.current?.click()} data-testid="button-add-document">
              <Plus className="mr-2 h-4 w-4" />
              Add File
            </Button>
          </div>
          <input
            ref={docInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleDocSelect}
            data-testid="input-doc-file"
          />
          {queuedDocs.length > 0 && (
            <div className="space-y-2">
              {queuedDocs.map((doc) => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 bg-muted/30"
                  data-testid={`queued-doc-${doc.key}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <Badge variant="outline" className="text-xs mr-2">{DOC_TYPES[doc.type]}</Badge>
                      <span className="text-sm text-muted-foreground truncate">{doc.file.name}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeDoc(doc.key)}
                    data-testid={`button-remove-doc-${doc.key}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input id="bankName" value={bank.bankName} onChange={(e) => setB("bankName", e.target.value)} placeholder="e.g. State Bank of India" data-testid="input-bank-name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accountHolder">Account Holder Name</Label>
            <Input id="accountHolder" value={bank.accountHolderName} onChange={(e) => setB("accountHolderName", e.target.value)} placeholder="As per bank records" data-testid="input-account-holder" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input id="accountNumber" value={bank.accountNumber} onChange={(e) => setB("accountNumber", e.target.value)} placeholder="Account number" data-testid="input-account-number" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ifsc">IFSC Code</Label>
            <Input id="ifsc" value={bank.ifsc} onChange={(e) => setB("ifsc", e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" data-testid="input-ifsc" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="branch">Branch Name</Label>
            <Input id="branch" value={bank.branch} onChange={(e) => setB("branch", e.target.value)} placeholder="Branch name" data-testid="input-branch" />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3 items-center">
        <Button onClick={handleSubmit} disabled={submitting} data-testid="button-submit">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
          {submitting ? (progress || "Creating...") : "Create Staff Member"}
        </Button>
        <Button variant="outline" onClick={() => router.back()} disabled={submitting} data-testid="button-cancel">
          Cancel
        </Button>
      </div>
    </div>
  );
}
