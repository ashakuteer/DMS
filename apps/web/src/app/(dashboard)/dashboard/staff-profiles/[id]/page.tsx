"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Loader2, Pencil, Save, X, Upload, FileText,
  Phone, Mail, Building2, Heart, AlertCircle, Trash2, ExternalLink,
  Camera, CreditCard, User,
} from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Home { id: string; name: string }

interface StaffDocument {
  id: string;
  type: string;
  fileUrl: string;
  createdAt: string;
}

interface BankDetails {
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifsc?: string;
  branch?: string;
}

interface StaffProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  roleType: string;
  designation?: string;
  status: string;
  profilePhotoUrl?: string;
  bloodGroup?: string;
  emergencyContact1Name?: string;
  emergencyContact1Phone?: string;
  emergencyContact2Name?: string;
  emergencyContact2Phone?: string;
  home?: Home;
  documents: StaffDocument[];
  bankDetails?: BankDetails | null;
  createdAt: string;
}

const ROLE_TYPE_LABELS: Record<string, string> = {
  ADMIN: "Admin", TELECALLER: "Telecaller", HOME_STAFF: "Home Staff",
};

const DESIGNATIONS = [
  "Supervisor", "Home Incharge", "Care Taker", "Nurse",
  "Cook", "Kitchen Helper", "Maid", "Cleaner", "Driver",
  "Telecaller", "Admin",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const DOC_TYPE_LABELS: Record<string, string> = {
  PHOTO: "Photo",
  AADHAR: "Aadhar Card",
  PAN: "PAN Card",
  APPOINTMENT: "Appointment Letter",
  EXPERIENCE: "Experience Certificate",
  OTHER: "Other Document",
};

export default function StaffProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const user = authStorage.getUser();
  const canEdit = user?.role === "FOUNDER" || user?.role === "ADMIN";

  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("AADHAR");
  const [editingBank, setEditingBank] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState<any>({});
  const [bankForm, setBankForm] = useState<BankDetails>({});

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
  const getToken = () => authStorage.getAccessToken();

  const loadProfile = useCallback(async () => {
    try {
      const [profileRes, homesRes] = await Promise.all([
        fetchWithAuth(`/api/staff-profiles/${id}`),
        fetchWithAuth("/api/homes"),
      ]);
      const profileData = await profileRes.json();
      const homesData = await homesRes.json();
      setProfile(profileData);
      setHomes(Array.isArray(homesData) ? homesData : []);
      setBankForm(profileData.bankDetails || {});
    } catch {
      toast({ title: "Error", description: "Failed to load staff profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const startEdit = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name,
      phone: profile.phone || "",
      email: profile.email || "",
      roleType: profile.roleType,
      designation: profile.designation || "",
      homeId: profile.home?.id || "",
      status: profile.status,
      bloodGroup: profile.bloodGroup || "",
      emergencyContact1Name: profile.emergencyContact1Name || "",
      emergencyContact1Phone: profile.emergencyContact1Phone || "",
      emergencyContact2Name: profile.emergencyContact2Name || "",
      emergencyContact2Phone: profile.emergencyContact2Phone || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editForm.name?.trim() || !editForm.roleType) {
      toast({ title: "Required", description: "Name and Role Type are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: any = { ...editForm };
      if (!payload.homeId) delete payload.homeId;
      const res = await fetchWithAuth(`/api/staff-profiles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile((prev) => prev ? { ...prev, ...updated } : updated);
        setEditing(false);
        toast({ title: "Saved", description: "Staff profile updated" });
        loadProfile();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${profile?.name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/api/staff-profiles/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", description: "Staff member removed" });
        router.push("/dashboard/staff-profiles");
      } else {
        toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Photo must be under 5MB", variant: "destructive" });
      return;
    }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("staffId", id);
      const res = await fetch(`${apiBase}/api/staff-profiles/upload-photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (res.ok) {
        toast({ title: "Photo updated" });
        loadProfile();
      } else {
        toast({ title: "Upload failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Documents must be under 5MB", variant: "destructive" });
      return;
    }
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("staffId", id);
      fd.append("type", selectedDocType);
      const res = await fetch(`${apiBase}/api/staff-profiles/upload-document`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (res.ok) {
        toast({ title: "Document uploaded", description: DOC_TYPE_LABELS[selectedDocType] });
        loadProfile();
      } else {
        toast({ title: "Upload failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  const handleDeleteDoc = async (docId: string, docType: string) => {
    if (!confirm(`Delete this ${DOC_TYPE_LABELS[docType] || docType}?`)) return;
    try {
      const res = await fetchWithAuth(`/api/staff-profiles/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Document removed" });
        loadProfile();
      } else {
        toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleSaveBank = async () => {
    setSavingBank(true);
    try {
      const res = await fetchWithAuth(`/api/staff-profiles/${id}/bank-details`, {
        method: "POST",
        body: JSON.stringify(bankForm),
      });
      if (res.ok) {
        toast({ title: "Bank details saved" });
        setEditingBank(false);
        loadProfile();
      } else {
        toast({ title: "Failed to save bank details", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSavingBank(false);
    }
  };

  const setE = (f: string, v: string) => setEditForm((p: any) => ({ ...p, [f]: v }));
  const setBF = (f: string, v: string) => setBankForm((p) => ({ ...p, [f]: v }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6"><p className="text-muted-foreground">Staff member not found.</p></div>;
  }

  const groupedDocs: Record<string, StaffDocument[]> = {};
  for (const doc of profile.documents) {
    if (!groupedDocs[doc.type]) groupedDocs[doc.type] = [];
    groupedDocs[doc.type].push(doc);
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Avatar with photo change */}
          <div className="relative group shrink-0">
            <div className="h-16 w-16 rounded-full border-2 border-border bg-muted overflow-hidden flex items-center justify-center">
              {profile.profilePhotoUrl ? (
                <Image src={profile.profilePhotoUrl} alt={profile.name} fill className="object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            {canEdit && (
              <button
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                data-testid="button-change-photo"
              >
                {uploadingPhoto ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Camera className="h-4 w-4 text-white" />}
              </button>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} data-testid="input-photo-file" />
          </div>

          <div className="pt-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-profile-name">{profile.name}</h1>
              <Badge variant={profile.status === "ACTIVE" ? "default" : "secondary"} data-testid="badge-status">
                {profile.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {ROLE_TYPE_LABELS[profile.roleType] || profile.roleType}
              {profile.designation ? ` · ${profile.designation}` : ""}
              {profile.home ? ` · ${profile.home.name}` : ""}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button onClick={handleSave} disabled={saving} size="sm" data-testid="button-save">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)} data-testid="button-cancel-edit">
                  <X className="mr-2 h-4 w-4" />Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={startEdit} data-testid="button-edit">
                  <Pencil className="mr-2 h-4 w-4" />Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} data-testid="button-delete">
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" />Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {editing ? (
            <>
              <div className="space-y-1.5"><Label>Full Name *</Label>
                <Input value={editForm.name || ""} onChange={(e) => setE("name", e.target.value)} data-testid="input-edit-name" /></div>
              <div className="space-y-1.5"><Label>Phone</Label>
                <Input value={editForm.phone || ""} onChange={(e) => setE("phone", e.target.value)} data-testid="input-edit-phone" /></div>
              <div className="space-y-1.5"><Label>Email</Label>
                <Input type="email" value={editForm.email || ""} onChange={(e) => setE("email", e.target.value)} data-testid="input-edit-email" /></div>
              <div className="space-y-1.5"><Label>Role Type *</Label>
                <Select value={editForm.roleType || ""} onValueChange={(v) => setE("roleType", v)}>
                  <SelectTrigger data-testid="select-edit-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="TELECALLER">Telecaller</SelectItem>
                    <SelectItem value="HOME_STAFF">Home Staff</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label>Designation</Label>
                <Select value={editForm.designation || ""} onValueChange={(v) => setE("designation", v)}>
                  <SelectTrigger data-testid="select-edit-designation"><SelectValue placeholder="Select designation" /></SelectTrigger>
                  <SelectContent>{DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label>Home</Label>
                <Select value={editForm.homeId || ""} onValueChange={(v) => setE("homeId", v)}>
                  <SelectTrigger data-testid="select-edit-home"><SelectValue placeholder="Select home" /></SelectTrigger>
                  <SelectContent>{homes.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={editForm.status || "ACTIVE"} onValueChange={(v) => setE("status", v)}>
                  <SelectTrigger data-testid="select-edit-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select></div>
            </>
          ) : (
            <>
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={profile.phone} testId="text-phone" />
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} testId="text-email" />
              <InfoRow icon={<Building2 className="h-4 w-4" />} label="Home" value={profile.home?.name} testId="text-home" />
              <InfoRow label="Designation" value={profile.designation} testId="text-designation" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Member since</p>
                <p className="text-sm" data-testid="text-created-at">
                  {new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Medical & Emergency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4" />Medical &amp; Emergency
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {editing ? (
            <>
              <div className="space-y-1.5"><Label>Blood Group</Label>
                <Select value={editForm.bloodGroup || ""} onValueChange={(v) => setE("bloodGroup", v)}>
                  <SelectTrigger data-testid="select-edit-blood-group"><SelectValue placeholder="Select blood group" /></SelectTrigger>
                  <SelectContent>{BLOOD_GROUPS.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
                </Select></div>
              <div />
              <div className="space-y-1.5"><Label>EC1 — Name</Label>
                <Input value={editForm.emergencyContact1Name || ""} onChange={(e) => setE("emergencyContact1Name", e.target.value)} data-testid="input-edit-ec1-name" /></div>
              <div className="space-y-1.5"><Label>EC1 — Phone</Label>
                <Input value={editForm.emergencyContact1Phone || ""} onChange={(e) => setE("emergencyContact1Phone", e.target.value)} data-testid="input-edit-ec1-phone" /></div>
              <div className="space-y-1.5"><Label>EC2 — Name</Label>
                <Input value={editForm.emergencyContact2Name || ""} onChange={(e) => setE("emergencyContact2Name", e.target.value)} data-testid="input-edit-ec2-name" /></div>
              <div className="space-y-1.5"><Label>EC2 — Phone</Label>
                <Input value={editForm.emergencyContact2Phone || ""} onChange={(e) => setE("emergencyContact2Phone", e.target.value)} data-testid="input-edit-ec2-phone" /></div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Blood Group</p>
                <p className="text-sm font-medium" data-testid="text-blood-group">
                  {profile.bloodGroup || <span className="text-muted-foreground">—</span>}
                </p>
              </div>
              <div />
              <EmergencyRow label="Emergency Contact 1" name={profile.emergencyContact1Name} phone={profile.emergencyContact1Phone} prefix="ec1" />
              <EmergencyRow label="Emergency Contact 2" name={profile.emergencyContact2Name} phone={profile.emergencyContact2Phone} prefix="ec2" />
            </>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />Documents
            </CardTitle>
            {canEdit && (
              <div className="flex items-center gap-2">
                <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                  <SelectTrigger className="w-[190px]" data-testid="select-doc-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => docInputRef.current?.click()} disabled={uploadingDoc} data-testid="button-upload-doc">
                  {uploadingDoc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploadingDoc ? "Uploading..." : "Upload"}
                </Button>
                <input ref={docInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleDocUpload} data-testid="input-doc-file" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {profile.documents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 opacity-40" />
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(DOC_TYPE_LABELS).map(([type, label]) => {
                const docs = groupedDocs[type];
                if (!docs?.length) return null;
                return (
                  <div key={type}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
                    <div className="space-y-2">
                      {docs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-muted/30" data-testid={`doc-item-${doc.id}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm text-muted-foreground">
                              Uploaded {new Date(doc.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" data-testid={`button-view-doc-${doc.id}`}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                            {canEdit && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteDoc(doc.id, doc.type)} data-testid={`button-delete-doc-${doc.id}`}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />Bank Details
            </CardTitle>
            {canEdit && !editingBank && (
              <Button variant="outline" size="sm" onClick={() => setEditingBank(true)} data-testid="button-edit-bank">
                <Pencil className="mr-2 h-4 w-4" />
                {profile.bankDetails ? "Edit" : "Add"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingBank ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Bank Name</Label>
                  <Input value={bankForm.bankName || ""} onChange={(e) => setBF("bankName", e.target.value)} placeholder="e.g. State Bank of India" data-testid="input-bank-name" /></div>
                <div className="space-y-1.5"><Label>Account Holder Name</Label>
                  <Input value={bankForm.accountHolderName || ""} onChange={(e) => setBF("accountHolderName", e.target.value)} placeholder="As per bank records" data-testid="input-account-holder" /></div>
                <div className="space-y-1.5"><Label>Account Number</Label>
                  <Input value={bankForm.accountNumber || ""} onChange={(e) => setBF("accountNumber", e.target.value)} data-testid="input-account-number" /></div>
                <div className="space-y-1.5"><Label>IFSC Code</Label>
                  <Input value={bankForm.ifsc || ""} onChange={(e) => setBF("ifsc", e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" data-testid="input-ifsc" /></div>
                <div className="space-y-1.5"><Label>Branch Name</Label>
                  <Input value={bankForm.branch || ""} onChange={(e) => setBF("branch", e.target.value)} data-testid="input-branch" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveBank} disabled={savingBank} data-testid="button-save-bank">
                  {savingBank ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {savingBank ? "Saving..." : "Save Bank Details"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditingBank(false); setBankForm(profile.bankDetails || {}); }} data-testid="button-cancel-bank">
                  Cancel
                </Button>
              </div>
            </div>
          ) : profile.bankDetails ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <BankRow label="Bank Name" value={profile.bankDetails.bankName} testId="text-bank-name" />
              <BankRow label="Account Holder" value={profile.bankDetails.accountHolderName} testId="text-account-holder" />
              <BankRow label="Account Number" value={profile.bankDetails.accountNumber} testId="text-account-number" masked />
              <BankRow label="IFSC Code" value={profile.bankDetails.ifsc} testId="text-ifsc" />
              <BankRow label="Branch" value={profile.bankDetails.branch} testId="text-branch" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <CreditCard className="h-8 w-8 opacity-40" />
              <p className="text-sm">No bank details added yet</p>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setEditingBank(true)} data-testid="button-add-bank">
                  Add Bank Details
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon, label, value, testId }: { icon?: React.ReactNode; label: string; value?: string | null; testId?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">{icon}{label}</p>
      <p className="text-sm font-medium" data-testid={testId}>
        {value || <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );
}

function BankRow({ label, value, testId, masked }: { label: string; value?: string | null; testId?: string; masked?: boolean }) {
  const display = masked && value ? `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}` : value;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium font-mono" data-testid={testId}>
        {display || <span className="text-muted-foreground font-sans">—</span>}
      </p>
    </div>
  );
}

function EmergencyRow({ label, name, phone, prefix }: { label: string; name?: string | null; phone?: string | null; prefix: string }) {
  if (!name && !phone) return (
    <div><p className="text-xs text-muted-foreground mb-1">{label}</p><p className="text-sm text-muted-foreground">—</p></div>
  );
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium" data-testid={`text-${prefix}-name`}>{name || "—"}</p>
      <p className="text-sm text-muted-foreground" data-testid={`text-${prefix}-phone`}>{phone || "—"}</p>
    </div>
  );
}
