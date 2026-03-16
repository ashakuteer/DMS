"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Clock,
  Plus,
  Search,
  Pencil,
  Trash2,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { authStorage } from "@/lib/auth";

const CATEGORIES = [
  { value: "SUCCESS_STORY", label: "Success Story" },
  { value: "INSPIRING_STORY", label: "Inspiring Story" },
  { value: "RECOGNITION", label: "Recognition" },
  { value: "DONOR_SUPPORT", label: "Donor Support" },
  { value: "EVENT_BY_KIDS", label: "Event by Kids" },
  { value: "VISITOR_VISIT", label: "Visitor Visit" },
  { value: "CHALLENGE_PROBLEM", label: "Challenge / Problem" },
  { value: "GENERAL_UPDATE", label: "General Update" },
];

const HOMES = [
  { value: "ALL_HOMES", label: "All Homes" },
  { value: "GIRLS_HOME_UPPAL", label: "Girls Home - Uppal" },
  { value: "BLIND_HOME_BEGUMPET", label: "Blind Home - Begumpet" },
  { value: "OLD_AGE_HOME_PEERZADIGUDA", label: "Old Age Home - Peerzadiguda" },
];

const CATEGORY_COLORS: Record<string, string> = {
  SUCCESS_STORY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  INSPIRING_STORY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  RECOGNITION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  DONOR_SUPPORT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  EVENT_BY_KIDS: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  VISITOR_VISIT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  CHALLENGE_PROBLEM: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  GENERAL_UPDATE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

interface TimeMachineEntry {
  id: string;
  title: string;
  eventDate: string;
  description?: string;
  category: string;
  home: string;
  photos: string[];
  isPublic: boolean;
  createdBy: { id: string; name: string };
  createdAt: string;
}

const emptyForm = {
  title: "",
  eventDate: "",
  description: "",
  category: "GENERAL_UPDATE",
  home: "ALL_HOMES",
  isPublic: false,
};

export default function TimeMachinePage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = authStorage.getUser();

  const [entries, setEntries] = useState<TimeMachineEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterHome, setFilterHome] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeMachineEntry | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<TimeMachineEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoEntry, setPhotoEntry] = useState<TimeMachineEntry | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [pendingPhotoPreviewUrls, setPendingPhotoPreviewUrls] = useState<string[]>([]);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<TimeMachineEntry | null>(null);
  const [viewPhotoIndex, setViewPhotoIndex] = useState(0);

  const canCreate = hasPermission(user?.role, "timeMachine", "create");
  const canEdit = hasPermission(user?.role, "timeMachine", "edit");
  const canDelete = hasPermission(user?.role, "timeMachine", "delete");
  const canUploadPhoto = hasPermission(user?.role, "timeMachine", "uploadPhoto");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (search) params.set("search", search);
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterHome !== "all") params.set("home", filterHome);
      if (filterYear !== "all") params.set("year", filterYear);

      const res = await fetchWithAuth(`/api/time-machine?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load entries", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCategory, filterHome, filterYear]);

  const fetchYears = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/time-machine/years");
      if (res.ok) {
        const years = await res.json();
        setAvailableYears(years);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  const clearPendingPhotos = () => {
    pendingPhotoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPendingPhotos([]);
    setPendingPhotoPreviewUrls([]);
  };

  const openCreate = () => {
    setEditingEntry(null);
    setForm({ ...emptyForm });
    clearPendingPhotos();
    setDialogOpen(true);
  };

  const openEdit = (entry: TimeMachineEntry) => {
    setEditingEntry(entry);
    setForm({
      title: entry.title,
      eventDate: entry.eventDate.split("T")[0],
      description: entry.description || "",
      category: entry.category,
      home: entry.home,
      isPublic: entry.isPublic,
    });
    clearPendingPhotos();
    setDialogOpen(true);
  };

  const handlePendingPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < files.length) {
      toast({ title: "Some files skipped", description: "Files over 5MB were skipped.", variant: "destructive" });
    }
    validFiles.forEach((file) => {
      setPendingPhotos((prev) => [...prev, file]);
      setPendingPhotoPreviewUrls((prev) => [...prev, URL.createObjectURL(file)]);
    });
    e.target.value = "";
  };

  const removePendingPhoto = (index: number) => {
    URL.revokeObjectURL(pendingPhotoPreviewUrls[index]);
    setPendingPhotos((prev) => prev.filter((_, i) => i !== index));
    setPendingPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.title || !form.eventDate || !form.category || !form.home) {
      toast({ title: "Validation Error", description: "Title, date, category, and home are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        eventDate: new Date(form.eventDate).toISOString(),
        description: form.description || undefined,
        category: form.category,
        home: form.home,
        isPublic: form.isPublic,
      };

      const res = editingEntry
        ? await fetchWithAuth(`/api/time-machine/${editingEntry.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await fetchWithAuth("/api/time-machine", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        const created = await res.json().catch(() => null);
        const entryId = editingEntry ? editingEntry.id : created?.id;
        const uploadedCount = pendingPhotos.length;
        if (entryId && uploadedCount > 0) {
          for (const photo of pendingPhotos) {
            const fd = new FormData();
            fd.append("photo", photo);
            await fetchWithAuth(`/api/time-machine/${entryId}/photos`, {
              method: "POST",
              body: fd,
            }).catch(() => {});
          }
          clearPendingPhotos();
        }
        toast({
          title: editingEntry ? "Entry Updated" : "Entry Created",
          description: uploadedCount > 0
            ? `Entry saved with ${uploadedCount} photo(s)`
            : "Time Machine entry saved successfully",
        });
        setDialogOpen(false);
        fetchEntries();
        fetchYears();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Error", description: err.message || "Failed to save entry", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An error occurred", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/api/time-machine/${deleteConfirm.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", description: "Entry deleted successfully" });
        setDeleteConfirm(null);
        fetchEntries();
        fetchYears();
      } else {
        toast({ title: "Error", description: "Failed to delete entry", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An error occurred", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const openPhotoDialog = (entry: TimeMachineEntry) => {
    setPhotoEntry(entry);
    setPhotoFile(null);
    setPhotoDialogOpen(true);
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !photoEntry) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      const res = await fetchWithAuth(`/api/time-machine/${photoEntry.id}/photos`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast({ title: "Photo Uploaded", description: "Photo added successfully" });
        setPhotoDialogOpen(false);
        fetchEntries();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Error", description: err.message || "Upload failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An error occurred", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (entry: TimeMachineEntry, photoUrl: string) => {
    try {
      const res = await fetchWithAuth(`/api/time-machine/${entry.id}/photos`, {
        method: "DELETE",
        body: JSON.stringify({ photoUrl }),
      });
      if (res.ok) {
        toast({ title: "Photo Removed" });
        fetchEntries();
        if (viewEntry && viewEntry.id === entry.id) {
          const updated = await fetchWithAuth(`/api/time-machine/${entry.id}`);
          if (updated.ok) setViewEntry(await updated.json());
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to remove photo", variant: "destructive" });
    }
  };

  const openView = (entry: TimeMachineEntry) => {
    setViewEntry(entry);
    setViewPhotoIndex(0);
    setViewDialogOpen(true);
  };

  const getCategoryLabel = (value: string) => CATEGORIES.find((c) => c.value === value)?.label || value;
  const getHomeLabel = (value: string) => HOMES.find((h) => h.value === value)?.label || value;

  const currentYear = new Date().getFullYear();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Clock className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Time Machine</h1>
            <p className="text-muted-foreground mt-0.5">
              A visual archive of moments, stories, and milestones
            </p>
          </div>
        </div>
        {canCreate && (
          <Button onClick={openCreate} data-testid="button-create-entry">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterHome} onValueChange={(v) => { setFilterHome(v); setPage(1); }}>
          <SelectTrigger className="w-[220px]" data-testid="select-home-filter">
            <SelectValue placeholder="Home" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Homes</SelectItem>
            {HOMES.map((h) => (
              <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setPage(1); }}>
          <SelectTrigger className="w-[120px]" data-testid="select-year-filter">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {availableYears.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No entries yet</p>
          <p className="text-sm mt-1">Add your first Time Machine entry to start building the archive.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {entry.photos.length > 0 ? (
                  <div className="relative h-40 bg-muted cursor-pointer" onClick={() => openView(entry)}>
                    <img
                      src={entry.photos[0]}
                      alt={entry.title}
                      className="h-full w-full object-cover"
                    />
                    {entry.photos.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                        +{entry.photos.length - 1}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-40 bg-muted flex items-center justify-center cursor-pointer" onClick={() => openView(entry)}>
                    <Clock className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-primary"
                      onClick={() => openView(entry)}
                      data-testid={`entry-title-${entry.id}`}
                    >
                      {entry.title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge className={`text-xs ${CATEGORY_COLORS[entry.category] || ""}`}>
                      {getCategoryLabel(entry.category)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getHomeLabel(entry.home)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.eventDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <div className="flex items-center gap-1 pt-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openView(entry)} title="View">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {canUploadPhoto && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPhotoDialog(entry)} title="Add Photo">
                        <ImagePlus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(entry)} title="Edit" data-testid={`button-edit-${entry.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(entry)} title="Delete" data-testid={`button-delete-${entry.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{total} entries total</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">Page {page} of {totalPages}</span>
                <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) clearPendingPhotos(); setDialogOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Entry" : "Add Time Machine Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="tm-title">Title *</Label>
              <Input
                id="tm-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Enter a title for this moment"
                data-testid="input-title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tm-date">Event Date *</Label>
                <Input
                  id="tm-date"
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                  data-testid="input-event-date"
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
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
            </div>
            <div>
              <Label>Home *</Label>
              <Select value={form.home} onValueChange={(v) => setForm((f) => ({ ...f, home: v }))}>
                <SelectTrigger data-testid="select-home">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOMES.map((h) => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tm-description">Description</Label>
              <Textarea
                id="tm-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe this moment..."
                rows={3}
                data-testid="input-description"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="tm-public"
                checked={form.isPublic}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isPublic: !!v }))}
                data-testid="checkbox-public"
              />
              <Label htmlFor="tm-public" className="cursor-pointer">Make public (visible in reports/donor-facing content)</Label>
            </div>
            {canUploadPhoto && (
              <div>
                <Label className="mb-2 block">Photos (optional)</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handlePendingPhotoChange}
                  data-testid="input-pending-photos"
                />
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or WebP · Max 5MB each · Multiple allowed</p>
                {pendingPhotoPreviewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {pendingPhotoPreviewUrls.map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${i + 1}`}
                          className="h-16 w-16 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removePendingPhoto(i)}
                          className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} data-testid="button-save-entry">
              {saving ? "Saving..." : editingEntry ? "Update Entry" : "Create Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete <strong>{deleteConfirm?.title}</strong>? This will also delete all attached photos and cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} data-testid="button-confirm-delete">
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={photoDialogOpen} onOpenChange={(open) => !open && setPhotoDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Photo — {photoEntry?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {photoEntry && photoEntry.photos.length > 0 && (
              <div>
                <Label className="mb-2 block">Current Photos ({photoEntry.photos.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {photoEntry.photos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`Photo ${i + 1}`} className="h-16 w-16 object-cover rounded border" />
                      {canUploadPhoto && (
                        <button
                          onClick={() => handleDeletePhoto(photoEntry, url)}
                          className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label className="mb-2 block">Upload New Photo</Label>
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                data-testid="input-photo-file"
              />
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or WebP. Max 5MB.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoDialogOpen(false)}>Close</Button>
            <Button onClick={handlePhotoUpload} disabled={!photoFile || uploadingPhoto} data-testid="button-upload-photo">
              {uploadingPhoto ? "Uploading..." : "Upload Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={(open) => !open && setViewDialogOpen(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="pr-8">{viewEntry?.title}</DialogTitle>
          </DialogHeader>
          {viewEntry && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge className={`${CATEGORY_COLORS[viewEntry.category] || ""}`}>
                  {getCategoryLabel(viewEntry.category)}
                </Badge>
                <span className="text-sm text-muted-foreground">{getHomeLabel(viewEntry.home)}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(viewEntry.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </span>
                {viewEntry.isPublic && <Badge variant="outline" className="text-xs">Public</Badge>}
              </div>

              {viewEntry.photos.length > 0 && (
                <div className="relative">
                  <img
                    src={viewEntry.photos[viewPhotoIndex]}
                    alt={`Photo ${viewPhotoIndex + 1}`}
                    className="w-full max-h-80 object-contain rounded-lg bg-muted"
                  />
                  {viewEntry.photos.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={viewPhotoIndex === 0}
                        onClick={() => setViewPhotoIndex((i) => i - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">{viewPhotoIndex + 1} / {viewEntry.photos.length}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={viewPhotoIndex === viewEntry.photos.length - 1}
                        onClick={() => setViewPhotoIndex((i) => i + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {viewEntry.description && (
                <p className="text-sm text-foreground leading-relaxed">{viewEntry.description}</p>
              )}

              <p className="text-xs text-muted-foreground">
                Added by {viewEntry.createdBy.name} on {new Date(viewEntry.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
