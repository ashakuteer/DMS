"use client"

import { useState } from "react"
import {
  RefreshCw, Loader2, Plus, Phone, MessageCircle, User,
  ClipboardList, CheckSquare, Square, Zap, ChevronDown,
  Calendar, AlertTriangle, Clock, Star, Gift, Heart,
  HandHeart, TrendingUp, Send, X, PhoneCall,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  useTaskInbox,
  type TaskItem,
  type TaskType,
  type TaskPriority,
  type TimeWindow,
  type CreateTaskInput,
  type LogContactInput,
} from "./hooks/useTaskInbox"
import { authStorage } from "@/lib/auth"
import Link from "next/link"

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  BIRTHDAY:      { label: "Birthday",       color: "text-pink-700",   bg: "bg-pink-100",   icon: Gift },
  ANNIVERSARY:   { label: "Anniversary",    color: "text-rose-700",   bg: "bg-rose-100",   icon: Heart },
  REMEMBRANCE:   { label: "Remembrance",    color: "text-gray-700",   bg: "bg-gray-200",   icon: Star },
  FOLLOW_UP:     { label: "Follow-up",      color: "text-blue-700",   bg: "bg-blue-100",   icon: PhoneCall },
  PLEDGE:        { label: "Pledge",         color: "text-purple-700", bg: "bg-purple-100", icon: HandHeart },
  SMART_REMINDER:{ label: "Smart Reminder", color: "text-amber-700",  bg: "bg-amber-100",  icon: TrendingUp },
  SPONSOR_UPDATE:{ label: "Sponsor Update", color: "text-teal-700",   bg: "bg-teal-100",   icon: Send },
  REMINDER:      { label: "Reminder",       color: "text-yellow-700", bg: "bg-yellow-100", icon: Clock },
  GENERAL:       { label: "General",        color: "text-gray-600",   bg: "bg-gray-100",   icon: ClipboardList },
}

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Urgent", color: "bg-red-200 text-red-800" },
  HIGH:   { label: "High",   color: "bg-red-100 text-red-700" },
  MEDIUM: { label: "Medium", color: "bg-orange-100 text-orange-700" },
  LOW:    { label: "Low",    color: "bg-gray-100 text-gray-500" },
}

const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const TIME_WINDOWS: { value: TimeWindow; label: string; short: string }[] = [
  { value: "overdue", label: "Overdue",     short: "Overdue" },
  { value: "today",   label: "Today",       short: "Today" },
  { value: "7days",   label: "Next 7 Days", short: "7 Days" },
  { value: "15days",  label: "Next 15 Days",short: "15 Days" },
  { value: "30days",  label: "Next 30 Days",short: "30 Days" },
]

const TYPE_FILTERS = [
  { value: "ALL",           label: "All" },
  { value: "BIRTHDAY",      label: "Birthday" },
  { value: "ANNIVERSARY",   label: "Anniversary" },
  { value: "REMEMBRANCE",   label: "Remembrance" },
  { value: "PLEDGE",        label: "Pledges" },
  { value: "SMART_REMINDER",label: "Smart Reminders" },
  { value: "SPONSOR_UPDATE",label: "Sponsor Updates" },
  { value: "FOLLOW_UP",     label: "Follow-ups" },
  { value: "GENERAL",       label: "General" },
]

const CONTACT_METHODS = [
  { value: "CALL",            label: "Phone Call" },
  { value: "WHATSAPP_MANUAL", label: "WhatsApp (Manual)" },
  { value: "WHATSAPP_AUTO",   label: "WhatsApp (Auto)" },
  { value: "EMAIL",           label: "Email" },
  { value: "SMS",             label: "SMS" },
  { value: "IN_PERSON",       label: "In Person" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isOverdue(task: TaskItem): boolean {
  return (
    task.status === "OVERDUE" ||
    (task.status === "PENDING" && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)))
  )
}

function isDueToday(task: TaskItem): boolean {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const d = new Date(task.dueDate)
  return d >= today && d < tomorrow
}

function sortTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    const aOver = isOverdue(a) ? 0 : isDueToday(a) ? 1 : 2
    const bOver = isOverdue(b) ? 0 : isDueToday(b) ? 1 : 2
    if (aOver !== bOver) return aOver - bOver
    const pa = PRIORITY_ORDER[a.priority] ?? 99
    const pb = PRIORITY_ORDER[b.priority] ?? 99
    if (pa !== pb) return pa - pb
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  if (d.getTime() === today.getTime()) return "Today"
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow"
  if (d < today) {
    const diff = Math.round((today.getTime() - d.getTime()) / 86400000)
    return `${diff}d overdue`
  }
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

function formatContactDate(dateStr: string | null): string {
  if (!dateStr) return "Never"
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

function whatsappUrl(phone: string | null | undefined, name: string): string {
  if (!phone) return "#"
  const clean = phone.replace(/\D/g, "")
  const num = clean.startsWith("91") ? clean : `91${clean}`
  const msg = encodeURIComponent(`Hello ${name}, this is a message from Asha Kuteer Foundation.`)
  return `https://wa.me/${num}?text=${msg}`
}

// ─── Log Contact Dialog ───────────────────────────────────────────────────────

interface LogContactDialogProps {
  task: TaskItem
  onClose: () => void
  onLog: (input: LogContactInput) => Promise<boolean>
}

function LogContactDialog({ task, onClose, onLog }: LogContactDialogProps) {
  const [method, setMethod] = useState("CALL")
  const [outcome, setOutcome] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const donorName = task.donor
    ? `${task.donor.firstName} ${task.donor.lastName || ""}`.trim()
    : "Donor"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const ok = await onLog({ contactMethod: method, outcome: outcome || undefined, notes: notes || undefined })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Log Contact</h3>
            <p className="text-xs text-gray-500 mt-0.5">{donorName} · {task.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" data-testid="button-close-log-dialog">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Contact Method *</label>
            <div className="grid grid-cols-2 gap-2">
              {CONTACT_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  data-testid={`method-${m.value.toLowerCase()}`}
                  className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors text-left ${
                    method === m.value
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Outcome</label>
            <input
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="e.g. Spoke with donor, will donate next week"
              value={outcome}
              onChange={e => setOutcome(e.target.value)}
              data-testid="input-contact-outcome"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Notes (optional)</label>
            <textarea
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              rows={3}
              placeholder="Any additional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              data-testid="input-contact-notes"
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} data-testid="button-cancel-log">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} data-testid="button-save-log">
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Save Contact Log
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── New Task Form ────────────────────────────────────────────────────────────

interface NewTaskFormProps {
  onCancel: () => void
  onCreate: (input: CreateTaskInput) => Promise<boolean>
  creating: boolean
}

function NewTaskForm({ onCancel, onCreate, creating }: NewTaskFormProps) {
  const [title, setTitle] = useState("")
  const [type, setType] = useState<TaskType>("GENERAL")
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM")
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0])
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const ok = await onCreate({ title: title.trim(), type, priority, dueDate, description: description || undefined })
    if (ok) onCancel()
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">New Task</h3>
      <div className="space-y-3">
        <input
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          placeholder="Task title *"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
          data-testid="input-task-title"
          required
        />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Type</label>
            <select
              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              value={type}
              onChange={e => setType(e.target.value as TaskType)}
              data-testid="select-task-type"
            >
              {TYPE_FILTERS.filter(f => f.value !== "ALL").map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Priority</label>
            <select
              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
              data-testid="select-task-priority"
            >
              {(["HIGH", "MEDIUM", "LOW"] as TaskPriority[]).map(p => (
                <option key={p} value={p}>{PRIORITY_META[p].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Due Date</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              data-testid="input-task-due"
            />
          </div>
        </div>
        <input
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          data-testid="input-task-description"
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel-task">Cancel</Button>
          <Button type="submit" size="sm" disabled={creating || !title.trim()} data-testid="button-submit-task">
            {creating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
            Create Task
          </Button>
        </div>
      </div>
    </form>
  )
}

// ─── Task Row ────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: TaskItem
  isCompleting: boolean
  onComplete: () => void
  onReopen: () => void
  onLogContact: () => void
  showCompleted: boolean
}

function TaskRow({ task, isCompleting, onComplete, onReopen, onLogContact, showCompleted }: TaskRowProps) {
  const overdue = isOverdue(task)
  const completed = task.status === "COMPLETED"
  const dueLabel = formatDate(task.dueDate)
  const meta = TYPE_META[task.type] || TYPE_META.GENERAL
  const TypeIcon = meta.icon

  const donorName = task.donor
    ? `${task.donor.firstName} ${task.donor.lastName || ""}`.trim()
    : null
  const phone = task.donor?.primaryPhone || null
  const whatsapp = task.donor?.whatsappPhone || null
  const donorOwner = task.donor?.assignedToUser?.name || null
  const autoWA = task.autoWhatsAppPossible

  return (
    <div
      data-testid={`task-row-${task.id}`}
      className={`flex items-start gap-3 px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50/80 transition-colors ${
        overdue && !completed ? "bg-red-50/60 hover:bg-red-50 border-b-red-100" : ""
      } ${completed ? "opacity-55" : ""}`}
    >
      {/* Checkbox */}
      <button
        onClick={completed ? onReopen : onComplete}
        disabled={isCompleting}
        className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-teal-600 transition-colors"
        data-testid={`checkbox-task-${task.id}`}
        aria-label={completed ? "Reopen task" : "Mark complete"}
      >
        {isCompleting ? (
          <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
        ) : completed ? (
          <CheckSquare className="h-5 w-5 text-teal-500" />
        ) : (
          <Square className="h-5 w-5" />
        )}
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium ${completed ? "line-through text-gray-400" : overdue ? "text-red-800" : "text-gray-800"}`}
            data-testid={`task-title-${task.id}`}
          >
            {task.title}
          </span>
          {/* Type badge */}
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${meta.bg} ${meta.color}`}>
            <TypeIcon className="h-2.5 w-2.5" />
            {meta.label}
          </span>
          {/* Priority */}
          <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_META[task.priority]?.color || "bg-gray-100 text-gray-500"}`}>
            {PRIORITY_META[task.priority]?.label || task.priority}
          </span>
          {/* Auto WA badge */}
          {autoWA && !completed && (
            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium" title="Auto WhatsApp possible">
              <MessageCircle className="h-2.5 w-2.5" />
              Auto WA
            </span>
          )}
        </div>

        {/* Meta row: donor, owner, due date, contacts */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-gray-500">
          {donorName && (
            <span className="flex items-center gap-1" data-testid={`task-donor-${task.id}`}>
              <User className="h-3 w-3 flex-shrink-0" />
              {donorName}
            </span>
          )}
          {donorOwner && (
            <span
              className="flex items-center gap-1 text-blue-600 font-medium"
              title="Relationship owner"
              data-testid={`task-owner-${task.id}`}
            >
              <Star className="h-3 w-3 flex-shrink-0" />
              {donorOwner}
            </span>
          )}
          <span className={`font-medium ${overdue && !completed ? "text-red-600" : "text-gray-400"}`}>
            {dueLabel}
          </span>
          {/* Contact history */}
          {task.contactCount > 0 && (
            <span className="flex items-center gap-1 text-gray-400" title={`Last contacted: ${formatContactDate(task.lastContactedAt)}`} data-testid={`task-contact-count-${task.id}`}>
              <PhoneCall className="h-3 w-3" />
              {task.contactCount}× · {formatContactDate(task.lastContactedAt)}
            </span>
          )}
          {/* Sponsor beneficiary */}
          {task.sourceSponsorship?.beneficiary && (
            <span className="flex items-center gap-1 text-teal-600">
              <Heart className="h-3 w-3" />
              {task.sourceSponsorship.beneficiary.fullName}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {!completed && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Log contact */}
          <button
            onClick={onLogContact}
            title="Log contact"
            className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            data-testid={`button-log-contact-${task.id}`}
          >
            <PhoneCall className="h-3.5 w-3.5" />
          </button>
          {phone && (
            <a
              href={`tel:${phone}`}
              title={`Call ${donorName || "donor"}`}
              className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
              data-testid={`button-call-${task.id}`}
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
          {(whatsapp || phone) && (
            <a
              href={whatsappUrl(whatsapp || phone, donorName || "there")}
              target="_blank"
              rel="noreferrer"
              title={autoWA ? "WhatsApp (eligible)" : "WhatsApp (manual)"}
              className={`p-1.5 rounded-md transition-colors ${autoWA ? "text-green-500 hover:text-green-700 hover:bg-green-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
              data-testid={`button-whatsapp-${task.id}`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
          )}
          {task.donorId && (
            <Link
              href={`/dashboard/donors/${task.donorId}`}
              title="View donor"
              className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              data-testid={`button-view-donor-${task.id}`}
            >
              <User className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DailyActionsPage() {
  const {
    tasks, loading, completing, creating,
    timeWindow, typeFilter, showCompleted,
    setShowCompleted, changeTimeWindow, changeTypeFilter,
    completeTask, reopenTask, createTask, generateTasks, logContact, refresh,
  } = useTaskInbox()

  const [showNewForm, setShowNewForm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [logTarget, setLogTarget] = useState<TaskItem | null>(null)

  const user = authStorage.getUser()
  const isAdmin = user?.role === "ADMIN" || user?.role === "FOUNDER"

  const handleGenerate = async () => {
    setGenerating(true)
    await generateTasks()
    setGenerating(false)
  }

  const filtered = tasks.filter(t => {
    if (!showCompleted && t.status === "COMPLETED") return false
    return true
  })

  const sorted = sortTasks(filtered)

  const total = tasks.length
  const completedCount = tasks.filter(t => t.status === "COMPLETED").length
  const overdueCount = tasks.filter(t => isOverdue(t) && t.status !== "COMPLETED").length

  const activeWindow = TIME_WINDOWS.find(w => w.value === timeWindow)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Log Contact Dialog */}
      {logTarget && (
        <LogContactDialog
          task={logTarget}
          onClose={() => setLogTarget(null)}
          onLog={async input => {
            const ok = await logContact(logTarget.id, input)
            return ok
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800" data-testid="text-task-inbox-title">
            Task Inbox
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} tasks · {activeWindow?.label}
            {overdueCount > 0 && (
              <span className="text-red-500 ml-2">· {overdueCount} overdue</span>
            )}
            {completedCount > 0 && (
              <span className="text-teal-600 ml-2">· {completedCount} done</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={generating || loading}
              data-testid="button-generate-tasks"
              title="Auto-generate donor action tasks"
            >
              {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
              Generate
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refresh()} disabled={loading} data-testid="button-refresh-tasks">
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowNewForm(v => !v)} data-testid="button-new-task">
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
        </div>
      </div>

      {/* New Task Form */}
      {showNewForm && (
        <NewTaskForm
          onCancel={() => setShowNewForm(false)}
          onCreate={createTask}
          creating={creating}
        />
      )}

      {/* Time-Window Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1" data-testid="time-window-tabs">
        {TIME_WINDOWS.map(w => (
          <button
            key={w.value}
            onClick={() => changeTimeWindow(w.value)}
            data-testid={`tab-window-${w.value}`}
            className={`flex-1 text-xs px-3 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
              timeWindow === w.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {w.value === "overdue" && <AlertTriangle className="h-3 w-3" />}
            {w.value === "today" && <Calendar className="h-3 w-3" />}
            {w.short}
          </button>
        ))}
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => changeTypeFilter(f.value)}
            data-testid={`filter-type-${f.value.toLowerCase()}`}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              typeFilter === f.value
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setShowCompleted(v => !v)}
          data-testid="filter-show-completed"
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ml-auto ${
            showCompleted
              ? "bg-teal-100 text-teal-700"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          {showCompleted ? "Hide done" : "Show done"}
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-400 flex-wrap">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3 text-blue-500" />
          Relationship owner
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3 text-green-500" />
          Auto WA eligible
        </span>
        <span className="flex items-center gap-1">
          <PhoneCall className="h-3 w-3 text-gray-400" />
          Contact history
        </span>
      </div>

      {/* Task List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white" data-testid="task-list">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400" data-testid="empty-state">
            <ClipboardList className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">
              {typeFilter !== "ALL"
                ? `No ${TYPE_FILTERS.find(f => f.value === typeFilter)?.label || typeFilter} tasks for this window`
                : `No tasks for ${activeWindow?.label}`}
            </p>
            <p className="text-xs text-gray-400">Click Generate to auto-create donor action tasks</p>
          </div>
        ) : (
          <div>
            {sorted.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                isCompleting={completing.has(task.id)}
                onComplete={() => completeTask(task.id)}
                onReopen={() => reopenTask(task.id)}
                onLogContact={() => setLogTarget(task)}
                showCompleted={showCompleted}
              />
            ))}
          </div>
        )}
      </div>

      {sorted.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          {sorted.length} task{sorted.length !== 1 ? "s" : ""} · {activeWindow?.label}
          {typeFilter !== "ALL" ? ` · ${TYPE_FILTERS.find(f => f.value === typeFilter)?.label}` : ""}
        </p>
      )}
    </div>
  )
}
