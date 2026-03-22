"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const TASK_TYPES = [
  { value: "GENERAL", label: "General" },
  { value: "INTERNAL", label: "Internal" },
  { value: "MANUAL", label: "Manual" },
];

const EMPTY = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "MEDIUM",
  type: "GENERAL",
  dueDate: new Date().toISOString().split("T")[0],
};

export default function CreateTaskDialog({
  open,
  setOpen,
  onSuccess,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const user = authStorage.getUser();
  const isAdminOrManager = user?.role === "FOUNDER" || user?.role === "ADMIN";

  const [form, setForm] = useState({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY });
    if (!isAdminOrManager) return;
    setLoadingStaff(true);
    fetchWithAuth("/api/tasks/staff")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setStaffList(d); })
      .catch(() => {})
      .finally(() => setLoadingStaff(false));
  }, [open, isAdminOrManager]);

  const set = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ title: "Task title is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description || undefined,
        type: form.type,
        priority: form.priority,
        dueDate: form.dueDate,
      };
      if (isAdminOrManager && form.assignedTo) {
        payload.assignedTo = form.assignedTo;
      }

      const res = await fetchWithAuth("/api/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Task created successfully" });
        setOpen(false);
        onSuccess?.();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.message || "Failed to create task", variant: "destructive" });
      }
    } catch {
      toast({ title: "Unexpected error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Assign a new internal task to a staff member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">

          <div className="space-y-1.5">
            <Label htmlFor="ct-title">Task Title <span className="text-destructive">*</span></Label>
            <Input
              id="ct-title"
              value={form.title}
              onChange={(e) => set("title")(e.target.value)}
              placeholder="e.g. Prepare monthly donation report"
              data-testid="input-task-title"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ct-desc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="ct-desc"
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder="Any instructions or context..."
              className="h-20 resize-none"
              data-testid="input-task-description"
            />
          </div>

          {isAdminOrManager && (
            <div className="space-y-1.5">
              <Label>Assign To <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Select value={form.assignedTo} onValueChange={set("assignedTo")}>
                <SelectTrigger data-testid="select-assigned-to">
                  <SelectValue placeholder={loadingStaff ? "Loading staff..." : "Select staff member"} />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={set("type")}>
                <SelectTrigger data-testid="select-task-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={set("priority")}>
                <SelectTrigger data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-due">Due Date</Label>
              <Input
                id="ct-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate")(e.target.value)}
                data-testid="input-due-date"
              />
            </div>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting} data-testid="button-cancel-create">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.title.trim()} data-testid="button-submit-create">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
