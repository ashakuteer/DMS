"use client";

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
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:     { label: "Pending",     color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Circle },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-200",       icon: Clock },
  COMPLETED:   { label: "Completed",   color: "bg-green-100 text-green-800 border-green-200",    icon: CheckCircle2 },
  OVERDUE:     { label: "Overdue",     color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertCircle },
  MISSED:      { label: "Missed",      color: "bg-red-100 text-red-800 border-red-200",           icon: XCircle },
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 border-gray-200",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  URGENT: "bg-red-100 text-red-700 border-red-200",
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
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  task: any;
}) {
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
            {task.minutesTaken && (
              <div className="flex items-start gap-3">
                <Timer className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Time Taken</p>
                  <p className="text-sm font-medium">
                    {task.minutesTaken >= 60
                      ? `${Math.floor(task.minutesTaken / 60)}h ${task.minutesTaken % 60}m`
                      : `${task.minutesTaken}m`}
                  </p>
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

          {/* Checklist */}
          {Array.isArray(task.checklist) && task.checklist.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2">Checklist</p>
              <ul className="space-y-1.5">
                {task.checklist.map((item: any, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {item.done
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      : <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    }
                    <span className={item.done ? "line-through text-muted-foreground" : ""}>{item.label || item}</span>
                  </li>
                ))}
              </ul>
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
