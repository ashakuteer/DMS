"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Milestone as MilestoneIcon,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Image,
  X,
} from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useToast } from "@/hooks/use-toast";

interface Milestone {
  id: string;
  date: string;
  title: string;
  description: string | null;
  homeType: string | null;
  photos: string[];
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
  createdBy: { id: string; name: string };
}

const homeTypeLabels: Record<string, string> = {
  ORPHAN_GIRLS: "Girls Home",
  BLIND_BOYS: "Blind Boys Home",
  OLD_AGE: "Old Age Home",
};

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<Milestone | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: "",
    description: "",
    homeType: "",
    photos: [] as string[],
    isPublic: false,
    sortOrder: 0,
  });
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const { toast } = useToast();
  const user = authStorage.getUser();
  const isAdmin = user?.role === "ADMIN";
  if (user && !canAccessModule(user?.role, 'milestones')) return <AccessDenied />;

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/milestones");
      if (res.ok) {
        setMilestones(await res.json());
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load milestones", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const resetForm = () => {
    setForm({ title: "", date: "", description: "", homeType: "", photos: [], isPublic: false, sortOrder: 0 });
    setNewPhotoUrl("");
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (m: Milestone) => {
    setForm({
      title: m.title,
      date: new Date(m.date).toISOString().split("T")[0],
      description: m.description || "",
      homeType: m.homeType || "",
      photos: [...m.photos],
      isPublic: m.isPublic,
      sortOrder: m.sortOrder,
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  const addPhoto = () => {
    if (newPhotoUrl.trim()) {
      setForm(f => ({ ...f, photos: [...f.photos, newPhotoUrl.trim()] }));
      setNewPhotoUrl("");
    }
  };

  const removePhoto = (idx: number) => {
    setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) {
      toast({ title: "Error", description: "Title and date are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        date: form.date,
        description: form.description.trim() || undefined,
        homeType: form.homeType || undefined,
        photos: form.photos,
        isPublic: form.isPublic,
        sortOrder: form.sortOrder,
      };

      const url = editingId ? `/api/milestones/${editingId}` : "/api/milestones";
      const method = editingId ? "PUT" : "POST";

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: editingId ? "Updated" : "Created", description: `Milestone "${form.title}" saved` });
        setShowForm(false);
        resetForm();
        fetchMilestones();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save milestone", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetchWithAuth(`/api/milestones/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Deleted", description: "Milestone removed" });
        setShowDeleteConfirm(null);
        fetchMilestones();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetchWithAuth("/api/milestones/seed", {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        toast({ title: "Seeded", description: result.message });
        fetchMilestones();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to seed", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const copyForCommunication = (m: Milestone) => {
    const year = new Date(m.date).getFullYear();
    const text = `${m.title} (${year})${m.description ? `\n${m.description}` : ''}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Milestone text copied for use in communications" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]" data-testid="status-loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="container-milestones">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Milestones</h1>
          <p className="text-muted-foreground" data-testid="text-page-subtitle">Track your organization's journey and key milestones</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && milestones.length === 0 && (
            <Button variant="outline" onClick={handleSeed} disabled={seeding} data-testid="button-seed">
              {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MilestoneIcon className="mr-2 h-4 w-4" />}
              Seed Defaults
            </Button>
          )}
          {isAdmin && (
            <Button onClick={openCreate} data-testid="button-add-milestone">
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          )}
        </div>
      </div>

      {milestones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3" data-testid="status-empty">
            <MilestoneIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No milestones yet</p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground">Click "Seed Defaults" to add the 3 founding milestones, or add your own.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-0">
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            {milestones.map((m) => {
              const year = new Date(m.date).getFullYear();
              const monthYear = new Date(m.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
              return (
                <div key={m.id} className="relative pl-14 pb-8" data-testid={`milestone-item-${m.id}`}>
                  <div className="absolute left-4 top-1 w-5 h-5 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-mono" data-testid={`badge-year-${m.id}`}>{year}</Badge>
                            {m.homeType && (
                              <Badge variant="secondary" data-testid={`badge-home-${m.id}`}>
                                {homeTypeLabels[m.homeType] || m.homeType}
                              </Badge>
                            )}
                            {m.isPublic ? (
                              <Badge variant="secondary" data-testid={`badge-visibility-${m.id}`}><Eye className="h-3 w-3 mr-1" />Public</Badge>
                            ) : (
                              <Badge variant="outline" data-testid={`badge-visibility-${m.id}`}><EyeOff className="h-3 w-3 mr-1" />Internal</Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg" data-testid={`text-title-${m.id}`}>{m.title}</CardTitle>
                          <p className="text-sm text-muted-foreground" data-testid={`text-date-${m.id}`}>{monthYear}</p>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" onClick={() => copyForCommunication(m)} data-testid={`button-copy-${m.id}`}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy for Reports</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" onClick={() => openEdit(m)} data-testid={`button-edit-${m.id}`}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" onClick={() => setShowDeleteConfirm(m.id)} data-testid={`button-delete-${m.id}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {m.description && (
                        <p className="text-sm text-muted-foreground mb-3" data-testid={`text-description-${m.id}`}>{m.description}</p>
                      )}
                      {m.photos.length > 0 && (
                        <div className="flex gap-2 flex-wrap" data-testid={`photos-container-${m.id}`}>
                          {m.photos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              className="relative w-20 h-20 rounded-md overflow-hidden border cursor-pointer"
                              onClick={() => setShowPreview(m)}
                              data-testid={`photo-thumb-${m.id}-${pIdx}`}
                            >
                              <img src={photo} alt={`${m.title} photo ${pIdx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAdmin && milestones.length > 0 && (
        <Card data-testid="card-communication">
          <CardHeader>
            <CardTitle className="text-base">Use in Reports & Communications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Copy milestone summaries to include in donor emails, reports, and WhatsApp messages.
            </p>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Home</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones.map((m) => (
                    <TableRow key={m.id} data-testid={`row-milestone-${m.id}`}>
                      <TableCell className="font-mono" data-testid={`cell-year-${m.id}`}>{new Date(m.date).getFullYear()}</TableCell>
                      <TableCell className="font-medium" data-testid={`cell-title-${m.id}`}>{m.title}</TableCell>
                      <TableCell data-testid={`cell-home-${m.id}`}>
                        {m.homeType ? (
                          <Badge variant="secondary">
                            {homeTypeLabels[m.homeType] || m.homeType}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => copyForCommunication(m)} data-testid={`button-table-copy-${m.id}`}>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-lg" data-testid="dialog-milestone-form">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">{editingId ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update this milestone" : "Record a key moment in your organization's journey"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Girls Home Started"
                data-testid="input-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                data-testid="input-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe this milestone..."
                rows={3}
                data-testid="textarea-description"
              />
            </div>
            <div className="space-y-2">
              <Label>Associated Home</Label>
              <Select value={form.homeType} onValueChange={(v) => setForm(f => ({ ...f, homeType: v === "none" ? "" : v }))}>
                <SelectTrigger data-testid="select-home-type">
                  <SelectValue placeholder="Select home (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" data-testid="option-none">None</SelectItem>
                  <SelectItem value="ORPHAN_GIRLS" data-testid="option-orphan-girls">Girls Home</SelectItem>
                  <SelectItem value="BLIND_BOYS" data-testid="option-blind-boys">Blind Boys Home</SelectItem>
                  <SelectItem value="OLD_AGE" data-testid="option-old-age">Old Age Home</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="flex gap-2">
                <Input
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="Paste photo URL..."
                  data-testid="input-photo-url"
                />
                <Button type="button" variant="outline" onClick={addPhoto} disabled={!newPhotoUrl.trim()} data-testid="button-add-photo">
                  <Image className="h-4 w-4" />
                </Button>
              </div>
              {form.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {form.photos.map((photo, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border group">
                      <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" data-testid={`img-form-photo-${idx}`} />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5 invisible group-hover:visible"
                        data-testid={`button-remove-photo-${idx}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                data-testid="input-sort-order"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="public-switch">Visible to all users</Label>
              <Switch
                id="public-switch"
                checked={form.isPublic}
                onCheckedChange={(checked) => setForm(f => ({ ...f, isPublic: checked }))}
                data-testid="switch-public"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }} data-testid="button-cancel">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} data-testid="button-save-milestone">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => { if (!open) setShowDeleteConfirm(null); }}>
        <DialogContent data-testid="dialog-delete-confirm">
          <DialogHeader>
            <DialogTitle>Delete Milestone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this milestone? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} data-testid="button-cancel-delete">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              disabled={!!deleting}
              data-testid="button-confirm-delete"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showPreview} onOpenChange={(open) => { if (!open) setShowPreview(null); }}>
        <DialogContent className="max-w-2xl" data-testid="dialog-photo-preview">
          <DialogHeader>
            <DialogTitle data-testid="text-preview-title">{showPreview?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {showPreview?.description && (
              <p className="text-muted-foreground" data-testid="text-preview-description">{showPreview.description}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {showPreview?.photos.map((photo, idx) => (
                <div key={idx} className="rounded-md overflow-hidden border" data-testid={`preview-photo-${idx}`}>
                  <img src={photo} alt={`${showPreview.title} - Photo ${idx + 1}`} className="w-full h-auto" />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
