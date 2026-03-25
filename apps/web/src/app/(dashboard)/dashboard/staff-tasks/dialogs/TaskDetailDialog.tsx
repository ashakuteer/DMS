"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, CheckCircle2, Circle, AlertCircle, XCircle,
  Calendar, User, Tag, Repeat, FileText, Timer,
  Square, SquareCheck, Loader2,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:     { label: "Pending",     color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Circle },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-200",       icon: Clock },
  COMPLETED:   { label: "Completed",   color: "bg-green-100 text-green-800 border-green-200",    icon: CheckCircle2 },
  OVERDUE:     { label: "Overdue",     color: "bg-[#E6F4F1] text-[#5FA8A8] border-[#5FA8A8]", icon: AlertCircle },
  MISSED:      { label: "Missed",      color: "bg-red-100 text-red-800 border-red-200",           icon: XCircle },
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW:      "bg-green-100 text-green-700 border-green-200",
  MEDIUM:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  HIGH:     "bg-orange-100 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  URGENT:   "bg-red-100 text-red-700 border-red-200",
};

function Field({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function fmt(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function TaskDetailDialog({
  open,
  setOpen,
  task,
  onChecklistChange,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  task: any;
  onChecklistChange?: () => void;
}) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleChecklistItem = async (itemId: string) => {
    if (!task?.id) return;
    setTogglingId(itemId);
    const checklist = (task.checklist || []).map((item: any) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    try {
      // Checklist not available in unified task table — no-op
      void checklist;
      onChecklistChange?.();
    } catch { /* silent */ }
    setTogglingId(null);
  };

  if (!task) return null;

  const statusConf = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConf.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6 leading-snug">{task.title}</DialogTitle>
          <DialogDescription>
            Task details and status information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">

          {/* Status + Priority badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConf.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusConf.label}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM}`}>
              {task.priority}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-muted text-muted-foreground">
              <Tag className="h-3 w-3" />
              {task.category?.replace(/_/g, " ")}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              {task.description}
            </div>
          )}

          {/* Instructions */}
          {task.instructions && (
            <div className="rounded-md border border-blue-100 bg-blue-50/60 p-3">
              <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Instructions</p>
              <p className="text-sm text-blue-900 whitespace-pre-wrap">{task.instructions}</p>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-1 gap-3 border-t pt-3">
            <Field icon={User} label="Assigned To" value={task.assignedTo?.name || task.assignedToId} />
            <Field icon={Calendar} label="Due Date" value={fmtDate(task.dueDate)} />
            <Field
              icon={Repeat}
              label="Recurrence"
              value={task.recurrenceType && task.recurrenceType !== "NONE"
                ? task.recurrenceType.replace(/_/g, " ")
                : null}
            />
            <Field icon={Clock} label="Started" value={fmt(task.startedAt)} />
            <Field icon={CheckCircle2} label="Completed" value={fmt(task.completedAt)} />
            {/* Estimated vs. actual time */}
            {(task.estimatedMinutes || task.minutesTaken) && (
              <div className="flex items-start gap-3">
                <Timer className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.estimatedMinutes && (
                      <span className="text-sm text-muted-foreground">
                        Est: {task.estimatedMinutes >= 60
                          ? `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60}m`
                          : `${task.estimatedMinutes}m`}
                      </span>
                    )}
                    {task.minutesTaken && (
                      <span className={`text-sm font-medium ${task.estimatedMinutes && task.minutesTaken > task.estimatedMinutes ? "text-red-600" : "text-green-600"}`}>
                        Actual: {task.minutesTaken >= 60
                          ? `${Math.floor(task.minutesTaken / 60)}h ${task.minutesTaken % 60}m`
                          : `${task.minutesTaken}m`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <Field icon={User} label="Created By" value={task.createdBy?.name || task.createdById} />
            <Field icon={Calendar} label="Created On" value={fmtDate(task.createdAt)} />
          </div>

          {/* Notes */}
          {task.notes && (
            <div className="border-t pt-3">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Completion Notes */}
          {task.completionNotes && (
            <div className="border-t pt-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Completion Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{task.completionNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Checklist */}
          {Array.isArray(task.checklist) && task.checklist.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Checklist — {task.checklist.filter((i: any) => i.done).length}/{task.checklist.length} done
              </p>
              <div className="space-y-2">
                {task.checklist.map((item: any, i: number) => (
                  <button
                    key={item.id || i}
                    className="flex items-center gap-2.5 w-full text-left group"
                    onClick={() => toggleChecklistItem(item.id)}
                    disabled={togglingId === item.id}
                    data-testid={`detail-checklist-${task.id}-${i}`}
                  >
                    {togglingId === item.id
                      ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                      : item.done
                        ? <SquareCheck className="h-4 w-4 text-green-500 shrink-0" />
                        : <Square className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                    }
                    <span className={`text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}>{item.text || item.label || String(item)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-close-detail">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
