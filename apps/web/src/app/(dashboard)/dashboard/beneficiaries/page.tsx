"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  X,
  Eye,
  Loader2,
  HandHeart,
  Heart,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { Beneficiary, BeneficiariesResponse } from "./_components/types";
import { HOME_TYPES, STATUS_OPTIONS, SPONSORED_OPTIONS, MONTHS, getHomeTypeBadgeColor, getHomeTypeLabel, formatAge } from "./_components/helpers";
import { AddBeneficiaryDialog } from "./_components/AddBeneficiaryDialog";

export default function BeneficiariesPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [user, setUser] = useState<{ role: string } | null>(null);
  useEffect(() => {
    setUser(authStorage.getUser());
  }, []);

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [homeType, setHomeType] = useState("all");
  const [status, setStatus] = useState("all");
  const [sponsored, setSponsored] = useState("all");
  const [classGrade, setClassGrade] = useState("");
  const [school, setSchool] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [newBeneficiary, setNewBeneficiary] = useState({
    fullName: "",
    homeType: "ORPHAN_GIRLS",
    gender: "",
    dobMonth: "",
    dobDay: "",
    dobYear: "",
    approxAge: "",
    joinDate: "",
    heightCmAtJoin: "",
    weightKgAtJoin: "",
    educationClassOrRole: "",
    schoolOrCollege: "",
    healthNotes: "",
    currentHealthStatus: "",
    background: "",
    protectPrivacy: false,
  });

  const fetchBeneficiaries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchQuery) params.append("search", searchQuery);
      if (homeType && homeType !== "all") params.append("homeType", homeType);
      if (status && status !== "all") params.append("status", status);
      if (sponsored && sponsored !== "all") params.append("sponsored", sponsored);
      if (classGrade) params.append("classGrade", classGrade);
      if (school) params.append("school", school);
      if (academicYear) params.append("academicYear", academicYear);

      const response = await fetchWithAuth(`/api/beneficiaries?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch beneficiaries");
      }

      const data: BeneficiariesResponse = await response.json();
      setBeneficiaries(data.data);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch beneficiaries:", error);
      toast({
        title: "Error",
        description: "Failed to load beneficiaries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, homeType, status, sponsored, classGrade, school, academicYear, toast]);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  const handleSearch = () => {
    setPage(1);
    fetchBeneficiaries();
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Error", description: "Only JPG, PNG, and WebP images are allowed", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddBeneficiary = async () => {
    if (!newBeneficiary.fullName.trim()) {
      toast({
        title: "Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return;
    }

    setAddLoading(true);
    try {
      const payload: any = {
        fullName: newBeneficiary.fullName,
        homeType: newBeneficiary.homeType,
        protectPrivacy: newBeneficiary.protectPrivacy,
      };

      if (newBeneficiary.gender) payload.gender = newBeneficiary.gender;
      if (newBeneficiary.dobMonth) payload.dobMonth = parseInt(newBeneficiary.dobMonth);
      if (newBeneficiary.dobDay) payload.dobDay = parseInt(newBeneficiary.dobDay);
      if (newBeneficiary.dobYear) payload.dobYear = parseInt(newBeneficiary.dobYear);
      if (newBeneficiary.approxAge) payload.approxAge = parseInt(newBeneficiary.approxAge);
      if (newBeneficiary.joinDate) payload.joinDate = newBeneficiary.joinDate;
      if (newBeneficiary.heightCmAtJoin) payload.heightCmAtJoin = parseInt(newBeneficiary.heightCmAtJoin);
      if (newBeneficiary.weightKgAtJoin) payload.weightKgAtJoin = parseFloat(newBeneficiary.weightKgAtJoin);
      if (newBeneficiary.educationClassOrRole) payload.educationClassOrRole = newBeneficiary.educationClassOrRole;
      if (newBeneficiary.schoolOrCollege) payload.schoolOrCollege = newBeneficiary.schoolOrCollege;
      if (newBeneficiary.healthNotes) payload.healthNotes = newBeneficiary.healthNotes;
      if (newBeneficiary.currentHealthStatus) payload.currentHealthStatus = newBeneficiary.currentHealthStatus;
      if (newBeneficiary.background) payload.background = newBeneficiary.background;

      const response = await fetchWithAuth("/api/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create beneficiary");
      }

      const created = await response.json();

      if (photoFile && created.id) {
        try {
          const formData = new FormData();
          formData.append('photo', photoFile);
          const photoRes = await fetchWithAuth(`/api/beneficiaries/${created.id}/photo`, {
            method: 'POST',
            body: formData,
          });
          if (!photoRes.ok) {
            const errorData = await photoRes.json().catch(() => ({}));
            console.error('Photo upload failed after creation:', { status: photoRes.status, error: errorData });
            toast({ title: "Note", description: "Beneficiary created but photo upload failed. You can upload it from the profile page." });
          }
        } catch (photoErr) {
          console.error('Photo upload error after creation:', photoErr);
          toast({ title: "Note", description: "Beneficiary created but photo upload failed. You can upload it from the profile page." });
        }
      }

      toast({
        title: "Success",
        description: `Beneficiary ${created.code} created successfully`,
      });

      setShowAddDialog(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      setNewBeneficiary({
        fullName: "",
        homeType: "ORPHAN_GIRLS",
        gender: "",
        dobMonth: "",
        dobDay: "",
        dobYear: "",
        approxAge: "",
        joinDate: "",
        heightCmAtJoin: "",
        weightKgAtJoin: "",
        educationClassOrRole: "",
        schoolOrCollege: "",
        healthNotes: "",
        currentHealthStatus: "",
        background: "",
        protectPrivacy: false,
      });
      fetchBeneficiaries();
    } catch (error) {
      console.error("Failed to create beneficiary:", error);
      toast({
        title: "Error",
        description: "Failed to create beneficiary",
        variant: "destructive",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setHomeType("all");
    setStatus("all");
    setSponsored("all");
    setClassGrade("");
    setSchool("");
    setAcademicYear("");
    setPage(1);
  };

  const hasActiveFilters = searchQuery || homeType !== "all" || status !== "all" || sponsored !== "all" || classGrade || school || academicYear;

  if (user && !canAccessModule(user?.role, 'beneficiaries')) {
    return <AccessDenied />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-beneficiaries">Beneficiaries</h1>
          <p className="text-muted-foreground mt-1">
            Manage children, elderly, and others you support across all homes
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-beneficiary">
          <Plus className="mr-2 h-4 w-4" />
          Add Beneficiary
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                  data-testid="input-search-beneficiaries"
                />
              </div>
              <Button variant="outline" onClick={handleSearch} data-testid="button-search">
                Search
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-toggle-filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">Active</Badge>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters} data-testid="button-clear-filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="space-y-4 pt-4 border-t mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Home Type</Label>
                  <Select value={homeType} onValueChange={(v) => { setHomeType(v); setPage(1); }}>
                    <SelectTrigger data-testid="select-home-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOME_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sponsored</Label>
                  <Select value={sponsored} onValueChange={(v) => { setSponsored(v); setPage(1); }}>
                    <SelectTrigger data-testid="select-sponsored">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPONSORED_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Class / Grade</Label>
                  <Input
                    placeholder="e.g. 8th Class"
                    value={classGrade}
                    onChange={(e) => { setClassGrade(e.target.value); setPage(1); }}
                    data-testid="input-filter-class-grade"
                  />
                </div>
                <div className="space-y-2">
                  <Label>School / College</Label>
                  <Input
                    placeholder="e.g. Kendriya Vidyalaya"
                    value={school}
                    onChange={(e) => { setSchool(e.target.value); setPage(1); }}
                    data-testid="input-filter-school"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input
                    placeholder="e.g. 2025-2026"
                    value={academicYear}
                    onChange={(e) => { setAcademicYear(e.target.value); setPage(1); }}
                    data-testid="input-filter-academic-year"
                  />
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : beneficiaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <HandHeart className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No beneficiaries found</p>
              <p className="text-sm">
                {hasActiveFilters ? "Try adjusting your filters" : "Add beneficiaries to track who you're helping"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Home</TableHead>
                    <TableHead>Age/DOB</TableHead>
                    <TableHead className="text-center">Sponsors</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beneficiaries.map((beneficiary) => (
                    <TableRow key={beneficiary.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={beneficiary.photoUrl || undefined} alt={beneficiary.fullName} />
                          <AvatarFallback>
                            {beneficiary.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm" data-testid={`text-code-${beneficiary.id}`}>
                          {beneficiary.code}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium" data-testid={`text-name-${beneficiary.id}`}>
                            {beneficiary.fullName}
                          </p>
                          {beneficiary.gender && (
                            <p className="text-xs text-muted-foreground">{beneficiary.gender}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getHomeTypeBadgeColor(beneficiary.homeType)}>
                          {getHomeTypeLabel(beneficiary.homeType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatAge(beneficiary.dobDay, beneficiary.dobMonth, beneficiary.approxAge)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Heart className="h-4 w-4 text-pink-500" />
                          <span>{beneficiary.activeSponsorsCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={beneficiary.status === "ACTIVE" ? "default" : "secondary"}>
                          {beneficiary.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/beneficiaries/${beneficiary.id}`)}
                          title="View Profile"
                          data-testid={`button-view-${beneficiary.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddBeneficiaryDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        photoPreview={photoPreview}
        setPhotoFile={setPhotoFile}
        setPhotoPreview={setPhotoPreview}
        handlePhotoSelect={handlePhotoSelect}
        newBeneficiary={newBeneficiary}
        setNewBeneficiary={setNewBeneficiary}
        addLoading={addLoading}
        handleAddBeneficiary={handleAddBeneficiary}
      />
    </div>
  );
}
