"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Home,
  User,
  Users,
  Calendar,
  Heart,
  Camera,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

interface Beneficiary {
  id: string;
  code: string;
  fullName: string;
  homeType: 'ORPHAN_GIRLS' | 'BLIND_BOYS' | 'OLD_AGE';
  gender?: string;
  dobDay?: number;
  dobMonth?: number;
  approxAge?: number;
  educationClassOrRole?: string;
  schoolOrCollege?: string;
  photoUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  protectPrivacy: boolean;
  activeSponsorsCount: number;
  createdAt: string;
}

interface BeneficiariesResponse {
  data: Beneficiary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const HOME_TYPES = [
  { value: "all", label: "All Homes" },
  { value: "ORPHAN_GIRLS", label: "Orphan Girls Home" },
  { value: "BLIND_BOYS", label: "Visually Challenged Boys Home" },
  { value: "OLD_AGE", label: "Old Age Home" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const SPONSORED_OPTIONS = [
  { value: "all", label: "All" },
  { value: "true", label: "Sponsored" },
  { value: "false", label: "Not Sponsored" },
];


const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function getHomeTypeBadgeColor(homeType: string) {
  switch (homeType) {
    case 'ORPHAN_GIRLS':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
    case 'BLIND_BOYS':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'OLD_AGE':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
}

function getHomeTypeLabel(homeType: string) {
  switch (homeType) {
    case 'ORPHAN_GIRLS':
      return 'Orphan Girls';
    case 'BLIND_BOYS':
      return 'Blind Boys';
    case 'OLD_AGE':
      return 'Old Age';
    default:
      return homeType;
  }
}

function formatAge(dobDay?: number, dobMonth?: number, approxAge?: number): string {
  if (approxAge) {
    return `~${approxAge} yrs`;
  }
  if (dobMonth) {
    const month = MONTHS.find(m => m.value === dobMonth);
    if (dobDay) {
      return `${month?.label} ${dobDay}`;
    }
    return month?.label || '-';
  }
  return '-';
}

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

      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) { setPhotoFile(null); setPhotoPreview(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandHeart className="h-5 w-5" />
              Add Beneficiary
            </DialogTitle>
            <DialogDescription>
              Add a new beneficiary to track and support
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative group flex-shrink-0">
                  <Avatar className="h-20 w-20">
                    {photoPreview ? (
                      <AvatarImage src={photoPreview} alt="Preview" />
                    ) : (
                      <AvatarFallback className="text-lg">
                        {newBeneficiary.fullName ? newBeneficiary.fullName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    id="add-photo-upload"
                    onChange={handlePhotoSelect}
                    data-testid="input-add-photo-upload"
                  />
                  <label
                    htmlFor="add-photo-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    data-testid="button-add-photo-upload"
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </label>
                  {photoPreview && (
                    <button
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 invisible group-hover:visible"
                      data-testid="button-remove-add-photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="add-photo-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-primary">Upload Photo</span>
                  </label>
                  <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 5MB.</p>
                </div>
              </div>

              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="Enter full name"
                    value={newBeneficiary.fullName}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, fullName: e.target.value }))}
                    data-testid="input-fullname"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Home Type *</Label>
                  <Select 
                    value={newBeneficiary.homeType} 
                    onValueChange={(v) => setNewBeneficiary(prev => ({ ...prev, homeType: v }))}
                  >
                    <SelectTrigger data-testid="select-new-home-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOME_TYPES.filter(t => t.value !== "all").map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select 
                    value={newBeneficiary.gender} 
                    onValueChange={(v) => setNewBeneficiary(prev => ({ ...prev, gender: v }))}
                  >
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Birth Month</Label>
                  <Select 
                    value={newBeneficiary.dobMonth} 
                    onValueChange={(v) => setNewBeneficiary(prev => ({ ...prev, dobMonth: v }))}
                  >
                    <SelectTrigger data-testid="select-dob-month">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Birth Day</Label>
                  <Select 
                    value={newBeneficiary.dobDay} 
                    onValueChange={(v) => setNewBeneficiary(prev => ({ ...prev, dobDay: v }))}
                  >
                    <SelectTrigger data-testid="select-dob-day">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Birth Year</Label>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={newBeneficiary.dobYear}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, dobYear: e.target.value }))}
                    data-testid="input-dob-year"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Approx Age</Label>
                  <Input
                    type="number"
                    placeholder="If DOB unknown"
                    value={newBeneficiary.approxAge}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, approxAge: e.target.value }))}
                    data-testid="input-approx-age"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date of Joining Home</Label>
                <Input
                  type="date"
                  value={newBeneficiary.joinDate}
                  onChange={(e) => setNewBeneficiary(prev => ({ ...prev, joinDate: e.target.value }))}
                  data-testid="input-join-date"
                />
              </div>

              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide pt-2">Measurements at Joining</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    placeholder="Height in centimetres"
                    value={newBeneficiary.heightCmAtJoin}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, heightCmAtJoin: e.target.value }))}
                    data-testid="input-height"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Weight in kg"
                    value={newBeneficiary.weightKgAtJoin}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, weightKgAtJoin: e.target.value }))}
                    data-testid="input-weight"
                  />
                </div>
              </div>

              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide pt-2">Education</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class / Role</Label>
                  <Input
                    placeholder='e.g. "5th Class", "Retired"'
                    value={newBeneficiary.educationClassOrRole}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, educationClassOrRole: e.target.value }))}
                    data-testid="input-education"
                  />
                </div>

                <div className="space-y-2">
                  <Label>School / College</Label>
                  <Input
                    placeholder="Educational institution"
                    value={newBeneficiary.schoolOrCollege}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, schoolOrCollege: e.target.value }))}
                    data-testid="input-school"
                  />
                </div>
              </div>

              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide pt-2">Health & Medical</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Health Status</Label>
                  <Select 
                    value={newBeneficiary.currentHealthStatus} 
                    onValueChange={(v) => setNewBeneficiary(prev => ({ ...prev, currentHealthStatus: v }))}
                  >
                    <SelectTrigger data-testid="select-health-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Healthy">Healthy</SelectItem>
                      <SelectItem value="Under Treatment">Under Treatment</SelectItem>
                      <SelectItem value="Chronic Condition">Chronic Condition</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="Recovering">Recovering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Medical Notes</Label>
                <Textarea
                  placeholder="Any existing medical conditions, allergies, medications..."
                  value={newBeneficiary.healthNotes}
                  onChange={(e) => setNewBeneficiary(prev => ({ ...prev, healthNotes: e.target.value }))}
                  data-testid="textarea-health-notes"
                />
              </div>

              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide pt-2">Background</h4>

              <div className="space-y-2">
                <Label>Background</Label>
                <Textarea
                  placeholder="Brief background or story..."
                  value={newBeneficiary.background}
                  onChange={(e) => setNewBeneficiary(prev => ({ ...prev, background: e.target.value }))}
                  data-testid="textarea-background"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="protectPrivacy"
                  checked={newBeneficiary.protectPrivacy}
                  onChange={(e) => setNewBeneficiary(prev => ({ ...prev, protectPrivacy: e.target.checked }))}
                  className="h-4 w-4"
                  data-testid="checkbox-privacy"
                />
                <Label htmlFor="protectPrivacy" className="font-normal">
                  Protect privacy (hide sensitive information in public views)
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleAddBeneficiary} disabled={addLoading} data-testid="button-submit">
              {addLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Beneficiary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
