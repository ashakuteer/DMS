"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import {
  Save,
  ArrowLeft,
  Building,
  Phone,
  Mail,
  Globe,
  FileText,
  Plus,
  X,
  Loader2,
  Eye,
  ExternalLink,
  Upload,
  Palette,
  Image as ImageIcon,
  PenTool,
} from "lucide-react";

interface OrganizationProfile {
  id: string;
  name: string;
  tagline1: string;
  tagline2: string;
  logoUrl: string;
  brandingPrimaryColor: string;
  reportHeaderText: string | null;
  reportFooterText: string | null;
  signatureImageUrl: string | null;
  phone1: string;
  phone2: string;
  email: string;
  website: string;
  pan: string;
  section80GText: string;
  homes: string[];
  updatedAt: string;
}

export default function OrganizationProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newHome, setNewHome] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const user = authStorage.getUser();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) return;
    fetchProfile();
  }, [isAdmin]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth("/api/organization-profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load organization profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);
      const res = await fetchWithAuth("/api/organization-profile", {
        method: "PUT",
        body: JSON.stringify({
          name: profile.name,
          tagline1: profile.tagline1,
          tagline2: profile.tagline2,
          logoUrl: profile.logoUrl,
          brandingPrimaryColor: profile.brandingPrimaryColor,
          reportHeaderText: profile.reportHeaderText,
          reportFooterText: profile.reportFooterText,
          signatureImageUrl: profile.signatureImageUrl,
          phone1: profile.phone1,
          phone2: profile.phone2,
          email: profile.email,
          website: profile.website,
          pan: profile.pan,
          section80GText: profile.section80GText,
          homes: profile.homes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        toast({ title: "Success", description: "Organization profile updated successfully" });
      } else {
        const error = await res.json();
        throw new Error(error.message || "Failed to update");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof OrganizationProfile, value: string | null) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const addHome = () => {
    if (!profile || !newHome.trim()) return;
    setProfile({ ...profile, homes: [...profile.homes, newHome.trim()] });
    setNewHome("");
  };

  const removeHome = (index: number) => {
    if (!profile) return;
    setProfile({ ...profile, homes: profile.homes.filter((_, i) => i !== index) });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Error", description: "Only PNG, JPEG, WebP, and SVG images are allowed", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be under 5MB", variant: "destructive" });
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetchWithAuth("/api/organization-profile/upload-logo", {
        method: "POST",
        body: formData,
        headers: {},
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => prev ? { ...prev, logoUrl: data.logoUrl } : prev);
        toast({ title: "Success", description: "Logo uploaded successfully" });
      } else {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to upload logo", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Error", description: "Only PNG, JPEG, and WebP images are allowed", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be under 2MB", variant: "destructive" });
      return;
    }

    setUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetchWithAuth("/api/organization-profile/upload-signature", {
        method: "POST",
        body: formData,
        headers: {},
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => prev ? { ...prev, signatureImageUrl: data.signatureImageUrl } : prev);
        toast({ title: "Success", description: "Signature uploaded successfully" });
      } else {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to upload signature", variant: "destructive" });
    } finally {
      setUploadingSignature(false);
      if (signatureInputRef.current) signatureInputRef.current.value = "";
    }
  };

  if (!isAdmin) return <AccessDenied />;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Failed to load organization profile.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/settings")} data-testid="button-back-settings">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Organization Profile</h1>
            <p className="text-muted-foreground mt-1">Manage organization details, branding, and report customization</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => window.open("/organization", "_blank")} data-testid="button-public-page">
            <ExternalLink className="mr-2 h-4 w-4" />
            Public Page
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/settings/organization/preview")} data-testid="button-preview-org-profile">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-org-profile">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </div>
            <CardDescription>Organization name and taglines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input id="name" value={profile.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Enter organization name" data-testid="input-org-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline1">Tagline 1</Label>
              <Input id="tagline1" value={profile.tagline1} onChange={(e) => updateField("tagline1", e.target.value)} placeholder="Primary tagline" data-testid="input-org-tagline1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline2">Tagline 2</Label>
              <Input id="tagline2" value={profile.tagline2} onChange={(e) => updateField("tagline2", e.target.value)} placeholder="Secondary tagline" data-testid="input-org-tagline2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Logo & Branding</CardTitle>
            </div>
            <CardDescription>Upload logo and set brand colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Logo</Label>
              <div className="flex items-center gap-4">
                {profile.logoUrl ? (
                  <div className="w-16 h-16 rounded-md border flex items-center justify-center overflow-hidden bg-muted">
                    <img
                      src={profile.logoUrl}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain"
                      data-testid="img-org-logo"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-md border flex items-center justify-center bg-muted">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                    data-testid="input-logo-file"
                  />
                  <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} data-testid="button-upload-logo">
                    {uploadingLogo ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">PNG, JPEG, WebP, or SVG. Max 5MB.</p>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Label htmlFor="logoUrl">Or paste Logo URL</Label>
                <Input id="logoUrl" value={profile.logoUrl || ""} onChange={(e) => updateField("logoUrl", e.target.value)} placeholder="https://example.com/logo.png" data-testid="input-org-logo-url" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Brand Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="primaryColor"
                  value={profile.brandingPrimaryColor || "#2E7D32"}
                  onChange={(e) => updateField("brandingPrimaryColor", e.target.value)}
                  className="w-10 h-10 rounded-md border cursor-pointer"
                  data-testid="input-brand-color"
                />
                <Input
                  value={profile.brandingPrimaryColor || "#2E7D32"}
                  onChange={(e) => updateField("brandingPrimaryColor", e.target.value)}
                  placeholder="#2E7D32"
                  className="flex-1"
                  data-testid="input-brand-color-hex"
                />
                <div
                  className="h-10 w-24 rounded-md border flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: profile.brandingPrimaryColor || "#2E7D32" }}
                  data-testid="preview-brand-color"
                >
                  Preview
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Used in PDF reports, receipts, and email headers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </div>
            <CardDescription>Phone, email, and website details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone1">Phone 1</Label>
                <Input id="phone1" value={profile.phone1} onChange={(e) => updateField("phone1", e.target.value)} placeholder="Primary phone" data-testid="input-org-phone1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone2">Phone 2</Label>
                <Input id="phone2" value={profile.phone2} onChange={(e) => updateField("phone2", e.target.value)} placeholder="Secondary phone" data-testid="input-org-phone2" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile.email} onChange={(e) => updateField("email", e.target.value)} placeholder="contact@example.org" data-testid="input-org-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={profile.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://example.org" data-testid="input-org-website" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Report Customization</CardTitle>
            </div>
            <CardDescription>Headers, footers, and signature for PDF reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportHeaderText">Report Header Text</Label>
              <Input
                id="reportHeaderText"
                value={profile.reportHeaderText || ""}
                onChange={(e) => updateField("reportHeaderText", e.target.value || null)}
                placeholder="Additional text below tagline in report headers"
                data-testid="input-report-header"
              />
              <p className="text-xs text-muted-foreground">Appears below tagline in PDF report headers</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportFooterText">Report Footer Text</Label>
              <Input
                id="reportFooterText"
                value={profile.reportFooterText || ""}
                onChange={(e) => updateField("reportFooterText", e.target.value || null)}
                placeholder="Custom footer text for PDF reports"
                data-testid="input-report-footer"
              />
              <p className="text-xs text-muted-foreground">Appears in PDF report footers alongside page numbers</p>
            </div>
            <div className="space-y-2">
              <Label>Signature Image</Label>
              <div className="flex items-center gap-4">
                {profile.signatureImageUrl ? (
                  <div className="w-24 h-12 rounded-md border flex items-center justify-center overflow-hidden bg-muted">
                    <img
                      src={profile.signatureImageUrl}
                      alt="Signature"
                      className="max-w-full max-h-full object-contain"
                      data-testid="img-signature"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-24 h-12 rounded-md border flex items-center justify-center bg-muted">
                    <PenTool className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleSignatureUpload}
                    className="hidden"
                    data-testid="input-signature-file"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => signatureInputRef.current?.click()} disabled={uploadingSignature} data-testid="button-upload-signature">
                      {uploadingSignature ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
                      Upload Signature
                    </Button>
                    {profile.signatureImageUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateField("signatureImageUrl", null)}
                        data-testid="button-remove-signature"
                      >
                        <X className="mr-1 h-3 w-3" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Optional. PNG, JPEG, or WebP. Max 2MB. Used on receipts.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Tax Information</CardTitle>
            </div>
            <CardDescription>PAN and 80G details for receipts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pan">PAN Number</Label>
              <Input id="pan" value={profile.pan} onChange={(e) => updateField("pan", e.target.value)} placeholder="XXXXX0000X" data-testid="input-org-pan" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section80GText">Section 80G Text</Label>
              <Textarea id="section80GText" value={profile.section80GText} onChange={(e) => updateField("section80GText", e.target.value)} placeholder="Donations are exempt under section 80G..." rows={3} data-testid="input-org-80g" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Our Homes</CardTitle>
            </div>
            <CardDescription>List of homes/locations displayed on receipts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={newHome} onChange={(e) => setNewHome(e.target.value)} placeholder="Add a new home/location" onKeyDown={(e) => e.key === "Enter" && addHome()} data-testid="input-new-home" />
              <Button variant="outline" size="icon" onClick={addHome} data-testid="button-add-home">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.homes.map((home, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                  {home}
                  <button onClick={() => removeHome(index)} className="ml-1 hover:text-destructive" data-testid={`button-remove-home-${index}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {profile.homes.length === 0 && <p className="text-sm text-muted-foreground">No homes added yet.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Branding Preview</CardTitle>
          </div>
          <CardDescription>How your branding will appear on PDF reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden max-w-lg mx-auto">
            <div className="p-4 text-white" style={{ backgroundColor: profile.brandingPrimaryColor || "#2E7D32" }}>
              <div className="flex items-center gap-3" data-testid="preview-header">
                {profile.logoUrl && (
                  <img
                    src={profile.logoUrl}
                    alt="Logo"
                    className="h-10 w-10 object-contain bg-white/20 rounded"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div>
                  <div className="font-bold text-base">{profile.name}</div>
                  {profile.tagline1 && <div className="text-xs opacity-80">{profile.tagline1}</div>}
                  {profile.reportHeaderText && <div className="text-[10px] opacity-60">{profile.reportHeaderText}</div>}
                </div>
              </div>
              <div className="text-right text-xs font-medium mt-1 opacity-90">Sample Report Title</div>
            </div>
            <div className="p-4 bg-background text-sm text-muted-foreground text-center">
              [Report content would appear here]
            </div>
            <div className="border-t p-2 text-center text-[10px] text-muted-foreground" style={{ borderTopColor: profile.brandingPrimaryColor || "#2E7D32" }}>
              {profile.name}
              {profile.reportFooterText && <span> | {profile.reportFooterText}</span>}
              {" | Page 1 of 1"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Last updated:{" "}
            {new Date(profile.updatedAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
