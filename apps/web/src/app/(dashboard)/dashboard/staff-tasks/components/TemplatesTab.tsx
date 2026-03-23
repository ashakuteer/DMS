"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Plus, X, Zap, Repeat, Trash2, Pencil, Play,
  ChevronDown, ChevronUp, GripVertical, CheckSquare,
} from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const RECURRENCE_TYPES: Record<string, { label: string; color: string }> = {
  DAILY:       { label: "Daily",       color: "bg-blue-100 text-blue-700 border-blue-200" },
  WEEKLY:      { label: "Weekly",      color: "bg-purple-100 text-purple-700 border-purple-200" },
  MONTHLY:     { label: "Monthly",     color: "bg-green-100 text-green-700 border-green-200" },
  QUARTERLY:   { label: "Quarterly",   color: "bg-[#E6F4F1] text-[#5FA8A8] border-[#5FA8A8]" },
  HALF_YEARLY: { label: "Half-Yearly", color: "bg-pink-100 text-pink-700 border-pink-200" },
  ANNUAL:      { label: "Annual",      color: "bg-red-100 text-red-700 border-red-200" },
};

const CATEGORIES = [
  "GENERAL", "DONOR_FOLLOWUP", "BENEFICIARY_UPDATE", "DATA_ENTRY",
  "REPORTING", "COMMUNICATION", "EVENT", "OTHER",
];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const ROLES = [
  { value: "", label: "All Active Staff" },
  { value: "STAFF", label: "Staff Only" },
  { value: "ADMIN", label: "Admin Only" },
  { value: "FOUNDER", label: "Founder Only" },
];

interface TemplateItem {
  id: string;
  itemText: string;
  orderIndex: number;
}

interface Template {
  id: string;
  title: string;
  description: string | null;
  recurrenceType: string;
  category: string;
  priority: string;
  assignedToRole: string | null;
  assignedToId: string | null;
  isActive: boolean;
  createdAt: string;
  tasks: { id: string; status: string }[];
  items: TemplateItem[];
}

interface StaffUser { id: string; name: string; email: string; role: string }
interface Props { staffList: StaffUser[] }

export default function TemplatesTab({ staffList }: Props) {
  const { toast } = useToast();
  const user = authStorage.getUser();
  const isAdmin = user?.role === "FOUNDER" || user?.role === "ADMIN";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [generateDate, setGenerateDate] = useState<Record<string, string>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});
  const [addingItem, setAddingItem] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<{ templateId: string; itemId: string; text: string } | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", recurrenceType: "DAILY",
    category: "GENERAL", priority: "MEDIUM",
    assignedToRole: "", assignedToId: "",
  });

  const loadTemplates = useCallback(() => {
    setLoading(true);
    fetchWithAuth("/api/task-templates?includeInactive=false")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setTemplates(d); })
      .catch(() => toast({ title: "Failed to load recurring tasks", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const refreshChecklist = useCallback(async () => {
    try {
      await fetchWithAuth("/api/task-templates/generate-today", { method: "POST" });
    } catch {
      // silent — checklist will refresh next time it loads
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const resetForm = () => setForm({
    title: "", description: "", recurrenceType: "DAILY",
    category: "GENERAL", priority: "MEDIUM", assignedToRole: "", assignedToId: "",
  });

  const startEdit = (t: Template) => {
    setEditId(t.id);
    setForm({
      title: t.title, description: t.description || "",
      recurrenceType: t.recurrenceType, category: t.category, priority: t.priority,
      assignedToRole: t.assignedToRole || "", assignedToId: t.assignedToId || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title, description: form.description || undefined,
        recurrenceType: form.recurrenceType, category: form.category, priority: form.priority,
        assignedToRole: form.assignedToRole || undefined, assignedToId: form.assignedToId || undefined,
      };
      const res = editId
        ? await fetchWithAuth(`/api/task-templates/${editId}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await fetchWithAuth("/api/task-templates", { method: "POST", body: JSON.stringify(payload) });
      if (res.ok) {
        const created = await res.json();
        toast({ title: editId ? "Recurring task updated" : "Recurring task created" });
        setShowForm(false); setEditId(null); resetForm();
        loadTemplates();
        refreshChecklist();
        if (!editId && created?.id) {
          setExpandedItems((p) => ({ ...p, [created.id]: true }));
        }
      } else {
        const err = await res.json();
        toast({ title: err.message || "Failed", variant: "destructive" });
      }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const handleGenerate = async (templateId: string) => {
    setGeneratingId(templateId);
    try {
      const date = generateDate[templateId] || new Date().toISOString().split("T")[0];
      const res = await fetchWithAuth(`/api/task-templates/${templateId}/generate`, {
        method: "POST", body: JSON.stringify({ forDate: date }),
      });
      if (res.ok) {
        const result = await res.json();
        toast({ title: `Generated ${result.generated} task${result.generated !== 1 ? "s" : ""}` });
        loadTemplates();
      } else {
        toast({ title: "Generation failed", variant: "destructive" });
      }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setGeneratingId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template? Existing generated tasks won't be affected.")) return;
    setDeletingId(id);
    try {
      const res = await fetchWithAuth(`/api/task-templates/${id}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "Recurring task deleted" }); loadTemplates(); refreshChecklist(); }
      else toast({ title: "Delete failed", variant: "destructive" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setDeletingId(null); }
  };

  const addItem = async (templateId: string) => {
    const text = (newItemText[templateId] || "").trim();
    if (!text) return;
    setAddingItem((p) => ({ ...p, [templateId]: true }));
    try {
      const res = await fetchWithAuth(`/api/task-templates/${templateId}/items`, {
        method: "POST", body: JSON.stringify({ itemText: text }),
      });
      if (res.ok) {
        setNewItemText((p) => ({ ...p, [templateId]: "" }));
        loadTemplates();
      } else {
        toast({ title: "Failed to add item", variant: "destructive" });
      }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setAddingItem((p) => ({ ...p, [templateId]: false })); }
  };

  const updateItem = async (templateId: string, itemId: string, text: string) => {
    const res = await fetchWithAuth(`/api/task-templates/${templateId}/items/${itemId}`, {
      method: "PATCH", body: JSON.stringify({ itemText: text }),
    });
    if (res.ok) { setEditingItem(null); loadTemplates(); }
    else toast({ title: "Failed to update item", variant: "destructive" });
  };

  const deleteItem = async (templateId: string, itemId: string) => {
    const res = await fetchWithAuth(`/api/task-templates/${templateId}/items/${itemId}`, { method: "DELETE" });
    if (res.ok) { loadTemplates(); }
    else toast({ title: "Failed to delete item", variant: "destructive" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">
          Recurring tasks are auto-generated daily for your team based on frequency — manage them here
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setShowForm(!showForm); setEditId(null); resetForm(); }} data-testid="button-new-template">
            <Plus className="mr-1.5 h-4 w-4" />New Recurring Task
          </Button>
        </div>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{editId ? "Edit Recurring Task" : "New Recurring Task"}</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowForm(false); setEditId(null); resetForm(); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Task Title *</Label>
                <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Daily donor call review" data-testid="input-template-title" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Task instructions or details..." className="h-20" data-testid="input-template-desc" />
              </div>
              <div className="space-y-1.5">
                <Label>Frequency *</Label>
                <Select value={form.recurrenceType} onValueChange={(v) => setForm((p) => ({ ...p, recurrenceType: v }))}>
                  <SelectTrigger data-testid="select-recurrence"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECURRENCE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger data-testid="select-category"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}>
                  <SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Assign To (Role)</Label>
                <Select value={form.assignedToRole} onValueChange={(v) => setForm((p) => ({ ...p, assignedToRole: v, assignedToId: "" }))}>
                  <SelectTrigger data-testid="select-role"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Or Assign To Specific Staff <span className="text-muted-foreground font-normal">(overrides role)</span></Label>
                <Select value={form.assignedToId} onValueChange={(v) => setForm((p) => ({ ...p, assignedToId: v, assignedToRole: "" }))}>
                  <SelectTrigger data-testid="select-specific-staff"><SelectValue placeholder="Select a specific staff member (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific staff (use role)</SelectItem>
                    {staffList.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.role}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={submitting} data-testid="button-save-template">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {submitting ? "Saving..." : (editId ? "Update" : "Create Recurring Task")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditId(null); resetForm(); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template list */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <Repeat className="h-10 w-10 opacity-30" />
          <p>No recurring tasks yet. Create one to auto-generate daily checklist tasks for your team.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => {
            const recur = RECURRENCE_TYPES[t.recurrenceType] || { label: t.recurrenceType, color: "" };
            const completedCount = t.tasks.filter((task) => task.status === "COMPLETED").length;
            const showItems = expandedItems[t.id];
            return (
              <Card key={t.id} data-testid={`template-card-${t.id}`}>
                <CardContent className="pt-4 pb-4 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-semibold" data-testid={`text-template-title-${t.id}`}>{t.title}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${recur.color}`}>
                          <Repeat className="mr-1 h-3 w-3" />{recur.label}
                        </span>
                        <Badge variant="outline" className="text-xs">{t.category.replace(/_/g, " ")}</Badge>
                        <Badge variant="outline" className="text-xs">{t.priority}</Badge>
                      </div>
                      {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>Assign to: {t.assignedToRole || (t.assignedToId ? "Specific staff" : "All staff")}</span>
                        <span>·</span>
                        <span>{t.tasks.length} tasks generated</span>
                        {t.tasks.length > 0 && <span>· {completedCount}/{t.tasks.length} completed</span>}
                        <button
                          onClick={() => setExpandedItems((p) => ({ ...p, [t.id]: !p[t.id] }))}
                          className="flex items-center gap-1 text-primary hover:underline"
                          data-testid={`button-toggle-items-${t.id}`}
                        >
                          <CheckSquare className="h-3 w-3" />
                          {t.items.length} checklist item{t.items.length !== 1 ? "s" : ""}
                          {showItems ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="date"
                          value={generateDate[t.id] || new Date().toISOString().split("T")[0]}
                          onChange={(e) => setGenerateDate((p) => ({ ...p, [t.id]: e.target.value }))}
                          className="h-7 text-xs w-34"
                          data-testid={`input-gen-date-${t.id}`}
                        />
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleGenerate(t.id)} disabled={generatingId === t.id} data-testid={`button-generate-${t.id}`}>
                          {generatingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                          <span className="ml-1">Generate</span>
                        </Button>
                      </div>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => startEdit(t)} data-testid={`button-edit-template-${t.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} data-testid={`button-delete-template-${t.id}`}>
                            {deletingId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Checklist items panel */}
                  {showItems && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Checklist Items</p>

                      {t.items.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No items yet. Add checklist steps below.</p>
                      )}

                      {t.items.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-2 group" data-testid={`item-${item.id}`}>
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          <span className="text-xs text-muted-foreground w-5 shrink-0">{idx + 1}.</span>

                          {editingItem?.itemId === item.id ? (
                            <>
                              <Input
                                value={editingItem.text}
                                onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") updateItem(t.id, item.id, editingItem.text);
                                  if (e.key === "Escape") setEditingItem(null);
                                }}
                                className="h-7 text-xs flex-1"
                                autoFocus
                                data-testid={`input-edit-item-${item.id}`}
                              />
                              <Button size="sm" className="h-6 text-xs px-2" onClick={() => updateItem(t.id, item.id, editingItem.text)}>Save</Button>
                              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingItem(null)}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-sm">{item.itemText}</span>
                              {isAdmin && (
                                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                  <Button
                                    variant="ghost" size="icon" className="h-6 w-6"
                                    onClick={() => setEditingItem({ templateId: t.id, itemId: item.id, text: item.itemText })}
                                    data-testid={`button-edit-item-${item.id}`}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive"
                                    onClick={() => deleteItem(t.id, item.id)}
                                    data-testid={`button-delete-item-${item.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}

                      {/* Add new item */}
                      {isAdmin && (
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="Add checklist step..."
                            value={newItemText[t.id] || ""}
                            onChange={(e) => setNewItemText((p) => ({ ...p, [t.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") addItem(t.id); }}
                            className="h-8 text-sm"
                            data-testid={`input-new-item-${t.id}`}
                          />
                          <Button
                            size="sm" className="h-8 shrink-0"
                            onClick={() => addItem(t.id)}
                            disabled={addingItem[t.id] || !(newItemText[t.id] || "").trim()}
                            data-testid={`button-add-item-${t.id}`}
                          >
                            {addingItem[t.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
