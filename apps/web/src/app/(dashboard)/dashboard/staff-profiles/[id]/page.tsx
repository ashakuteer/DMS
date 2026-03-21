"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Loader2, Pencil, Save, X, Upload, FileText,
  Phone, Mail, Building2, Heart, AlertCircle, Trash2, ExternalLink,
} from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Home {
  id: string;
  name: string;
}

interface StaffDocument {
  id: string;
  type: string;
  fileUrl: string;
  createdAt: string;
}

interface StaffProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  roleType: string;
  designation?: string;
  status: string;
  bloodGroup?: string;
  emergencyContact1Name?: string;
  emergencyContact1Phone?: string;
  emergencyContact2Name?: string;
  emergencyContact2Phone?: string;
  home?: Home;
  documents: StaffDocument[];
  createdAt: string;
}

const ROLE_TYPE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  TELECALLER: "Telecaller",
  HOME_STAFF: "Home Staff",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  PHOTO: "Photo",
  AADHAR: "Aadhar Card",
  PAN: "PAN Card",
  APPOINTMENT: "Appointment Letter",
  EXPERIENCE: "Experience Certificate",
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

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
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("PHOTO");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState<Partial<StaffProfile>>({});

  const loadProfile = async () => {
    try {
      const [profileRes, homesRes] = await Promise.all([
        fetchWithAuth(`/api/staff-profiles/${id}`),
        fetchWithAuth("/api/homes"),
      ]);
      const profileData = await profileRes.json();
      const homesData = await homesRes.json();
      setProfile(profileData);
      setHomes(Array.isArray(homesData) ? homesData : []);
    } catch {
      toast({ title: "Error", description: "Failed to load staff profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const startEdit = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name,
      phone: profile.phone || "",
      email: profile.email || "",
      roleType: profile.roleType,
      designation: profile.designation || "",
      status: profile.status,
      bloodGroup: profile.bloodGroup || "",
      emergencyContact1Name: profile.emergencyContact1Name || "",
      emergencyContact1Phone: profile.emergencyContact1Phone || "",
      emergencyContact2Name: profile.emergencyContact2Name || "",
      emergencyContact2Phone: profile.emergencyContact2Phone || "",
      home: profile.home,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editForm.name?.trim() || !editForm.roleType) {
      toast({ title: "Validation Error", description: "Name and Role Type are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: editForm.name,
        phone: editForm.phone || null,
        email: editForm.email || null,
        roleType: editForm.roleType,
        designation: editForm.designation || null,
        status: editForm.status,
        bloodGroup: editForm.bloodGroup || null,
        emergencyContact1Name: editForm.emergencyContact1Name || null,
        emergencyContact1Phone: editForm.emergencyContact1Phone || null,
        emergencyContact2Name: editForm.emergencyContact2Name || null,
        emergencyContact2Phone: editForm.emergencyContact2Phone || null,
      };

      const homeId = (editForm as any).homeId;
      if (homeId) payload.homeId = homeId;

      const res = await fetchWithAuth(`/api/staff-profiles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setEditing(false);
        toast({ title: "Saved", description: "Staff profile updated" });
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
        toast({ title: "Error", description: "Failed to delete staff member", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("staffId", id);
      formData.append("type", selectedDocType);

      const token = authStorage.getAccessToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiUrl}/api/staff-profiles/upload-document`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        toast({ title: "Uploaded", description: `${DOC_TYPE_LABELS[selectedDocType]} uploaded` });
        loadProfile();
      } else {
        const err = await res.json();
        toast({ title: "Upload failed", description: err.message || "Failed to upload document", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDoc = async (docId: string, docType: string) => {
    if (!confirm(`Delete this ${DOC_TYPE_LABELS[docType] || docType}?`)) return;
    try {
      const res = await fetchWithAuth(`/api/staff-profiles/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", description: "Document removed" });
        loadProfile();
      } else {
        toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    }
  };

  const setField = (field: string, value: string) =>
    setEditForm((prev) => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Staff member not found.</p>
      </div>
    );
  }

  const groupedDocs: Record<string, StaffDocument[]> = {};
  for (const doc of profile.documents) {
    if (!groupedDocs[doc.type]) groupedDocs[doc.type] = [];
    groupedDocs[doc.type].push(doc);
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-profile-name">
                {profile.name}
              </h1>
              <Badge variant={profile.status === "ACTIVE" ? "default" : "secondary"} data-testid="badge-status">
                {profile.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {ROLE_TYPE_LABELS[profile.roleType] || profile.roleType}
              {profile.designation ? ` · ${profile.designation}` : ""}
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
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={startEdit} data-testid="button-edit">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  data-testid="button-delete"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Section 1: Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {editing ? (
            <>
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input value={editForm.name || ""} onChange={(e) => setField("name", e.target.value)} data-testid="input-edit-name" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={(editForm.phone as string) || ""} onChange={(e) => setField("phone", e.target.value)} data-testid="input-edit-phone" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={(editForm.email as string) || ""} onChange={(e) => setField("email", e.target.value)} data-testid="input-edit-email" />
              </div>
              <div className="space-y-1.5">
                <Label>Role Type *</Label>
                <Select value={editForm.roleType || ""} onValueChange={(v) => setField("roleType", v)}>
                  <SelectTrigger data-testid="select-edit-role">
                    <SelectValue />
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
                <Input value={(editForm.designation as string) || ""} onChange={(e) => setField("designation", e.target.value)} data-testid="input-edit-designation" />
              </div>
              <div className="space-y-1.5">
                <Label>Home</Label>
                <Select value={(editForm as any).homeId || profile.home?.id || ""} onValueChange={(v) => setField("homeId", v)}>
                  <SelectTrigger data-testid="select-edit-home">
                    <SelectValue placeholder="Select home" />
                  </SelectTrigger>
                  <SelectContent>
                    {homes.map((h) => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editForm.status || "ACTIVE"} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

      {/* Section 2: Medical & Emergency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Medical & Emergency
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {editing ? (
            <>
              <div className="space-y-1.5">
                <Label>Blood Group</Label>
                <Select value={(editForm.bloodGroup as string) || ""} onValueChange={(v) => setField("bloodGroup", v)}>
                  <SelectTrigger data-testid="select-edit-blood-group">
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
                <Label>Emergency Contact 1 — Name</Label>
                <Input value={(editForm.emergencyContact1Name as string) || ""} onChange={(e) => setField("emergencyContact1Name", e.target.value)} data-testid="input-edit-ec1-name" />
              </div>
              <div className="space-y-1.5">
                <Label>Emergency Contact 1 — Phone</Label>
                <Input value={(editForm.emergencyContact1Phone as string) || ""} onChange={(e) => setField("emergencyContact1Phone", e.target.value)} data-testid="input-edit-ec1-phone" />
              </div>
              <div className="space-y-1.5">
                <Label>Emergency Contact 2 — Name</Label>
                <Input value={(editForm.emergencyContact2Name as string) || ""} onChange={(e) => setField("emergencyContact2Name", e.target.value)} data-testid="input-edit-ec2-name" />
              </div>
              <div className="space-y-1.5">
                <Label>Emergency Contact 2 — Phone</Label>
                <Input value={(editForm.emergencyContact2Phone as string) || ""} onChange={(e) => setField("emergencyContact2Phone", e.target.value)} data-testid="input-edit-ec2-phone" />
              </div>
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
              <EmergencyContactRow
                label="Emergency Contact 1"
                name={profile.emergencyContact1Name}
                phone={profile.emergencyContact1Phone}
                testIdPrefix="ec1"
              />
              <EmergencyContactRow
                label="Emergency Contact 2"
                name={profile.emergencyContact2Name}
                phone={profile.emergencyContact2Phone}
                testIdPrefix="ec2"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </CardTitle>
            {canEdit && (
              <div className="flex items-center gap-2">
                <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                  <SelectTrigger className="w-[200px]" data-testid="select-doc-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDoc}
                  data-testid="button-upload-doc"
                >
                  {uploadingDoc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploadingDoc ? "Uploading..." : "Upload"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  data-testid="input-file-upload"
                />
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
            <div className="space-y-4">
              {Object.entries(DOC_TYPE_LABELS).map(([type, label]) => {
                const docs = groupedDocs[type];
                if (!docs?.length) return null;
                return (
                  <div key={type}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
                    <div className="space-y-2">
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-muted/30"
                          data-testid={`doc-item-${doc.id}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate text-muted-foreground">
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteDoc(doc.id, doc.type)}
                                data-testid={`button-delete-doc-${doc.id}`}
                              >
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
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  testId,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
  testId?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium" data-testid={testId}>
        {value || <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );
}

function EmergencyContactRow({
  label,
  name,
  phone,
  testIdPrefix,
}: {
  label: string;
  name?: string | null;
  phone?: string | null;
  testIdPrefix: string;
}) {
  if (!name && !phone) {
    return (
      <div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm text-muted-foreground">—</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium" data-testid={`text-${testIdPrefix}-name`}>{name || "—"}</p>
      <p className="text-sm text-muted-foreground" data-testid={`text-${testIdPrefix}-phone`}>{phone || "—"}</p>
    </div>
  );
}
