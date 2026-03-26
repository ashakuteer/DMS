"use client"

import { useState } from "react"
import {
  Loader2, Phone, MessageCircle, User, CheckCircle2, Circle,
  Calendar, AlertTriangle, Star, Gift, Heart, HandHeart,
  TrendingUp, Send, Clock, PhoneCall, X, CheckCheck,
  ChevronRight, RefreshCw,
} from "lucide-react"
import {
  useTaskInbox,
  type TaskItem,
  type TimeWindow,
  type LogContactInput,
} from "../daily-actions/hooks/useTaskInbox"
import Link from "next/link"
import { authStorage } from "@/lib/auth"

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  BIRTHDAY:       { label: "Birthday",        color: "text-pink-700",   bg: "bg-pink-100",   icon: Gift },
  ANNIVERSARY:    { label: "Anniversary",     color: "text-rose-700",   bg: "bg-rose-100",   icon: Heart },
  REMEMBRANCE:    { label: "Remembrance",     color: "text-slate-600",  bg: "bg-slate-200",  icon: Star },
  FOLLOW_UP:      { label: "Follow-up",       color: "text-blue-700",   bg: "bg-blue-100",   icon: PhoneCall },
  PLEDGE:         { label: "Pledge",          color: "text-purple-700", bg: "bg-purple-100", icon: HandHeart },
  SMART_REMINDER: { label: "Smart Reminder",  color: "text-amber-700",  bg: "bg-amber-100",  icon: TrendingUp },
  SPONSOR_UPDATE: { label: "Sponsor Update",  color: "text-teal-700",   bg: "bg-teal-100",   icon: Send },
  REMINDER:       { label: "Reminder",        color: "text-yellow-700", bg: "bg-yellow-100", icon: Clock },
  GENERAL:        { label: "General",         color: "text-gray-500",   bg: "bg-gray-100",   icon: ChevronRight },
}

const TIME_WINDOWS: { value: TimeWindow; label: string; icon?: any; activeCls: string; inactiveCls: string }[] = [
  {
    value: "overdue", label: "Overdue", icon: AlertTriangle,
    activeCls: "bg-red-600 text-white border-red-600 shadow-sm",
    inactiveCls: "bg-white text-red-600 border-red-200 hover:bg-red-50",
  },
  {
    value: "today", label: "Today", icon: Calendar,
    activeCls: "bg-amber-500 text-white border-amber-500 shadow-sm",
    inactiveCls: "bg-white text-amber-600 border-amber-200 hover:bg-amber-50",
  },
  {
    value: "7days", label: "Next 7 Days",
    activeCls: "bg-teal-600 text-white border-teal-600 shadow-sm",
    inactiveCls: "bg-white text-teal-700 border-teal-200 hover:bg-teal-50",
  },
  {
    value: "15days", label: "15 Days",
    activeCls: "bg-teal-600 text-white border-teal-600 shadow-sm",
    inactiveCls: "bg-white text-teal-700 border-teal-200 hover:bg-teal-50",
  },
  {
    value: "30days", label: "30 Days",
    activeCls: "bg-teal-600 text-white border-teal-600 shadow-sm",
    inactiveCls: "bg-white text-teal-700 border-teal-200 hover:bg-teal-50",
  },
]

const TYPE_FILTERS = [
  { value: "ALL",            label: "All" },
  { value: "BIRTHDAY",       label: "Birthdays" },
  { value: "ANNIVERSARY",    label: "Anniversaries" },
  { value: "REMEMBRANCE",    label: "Remembrance" },
  { value: "PLEDGE",         label: "Pledges" },
  { value: "SMART_REMINDER", label: "Smart Reminders" },
  { value: "SPONSOR_UPDATE", label: "Sponsor Updates" },
  { value: "FOLLOW_UP",      label: "Follow-ups" },
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

function formatDue(dateStr: string): string {
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

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

function whatsappUrl(phone: string | null | undefined, name: string): string {
  if (!phone) return "#"
  const clean = phone.replace(/\D/g, "")
  const num = clean.startsWith("91") ? clean : `91${clean}`
  return `https://wa.me/${num}?text=${encodeURIComponent(`Hello ${name}, this is from Asha Kuteer Foundation.`)}`
}

function sortActions(tasks: TaskItem[]): TaskItem[] {
  const rank = (t: TaskItem) => isOverdue(t) ? 0 : isDueToday(t) ? 1 : 2
  return [...tasks].sort((a, b) => {
    const ra = rank(a), rb = rank(b)
    if (ra !== rb) return ra - rb
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
}

// ─── Log Contact Dialog ───────────────────────────────────────────────────────

function LogContactDialog({
  task,
  onClose,
  onLog,
}: {
  task: TaskItem
  onClose: () => void
  onLog: (input: LogContactInput) => Promise<boolean>
}) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-7" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Log Contact</h3>
            <p className="text-sm text-gray-500 mt-0.5">{donorName} · {task.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
            data-testid="button-close-log-dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">How did you reach out? *</label>
            <div className="grid grid-cols-2 gap-2.5">
              {CONTACT_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  data-testid={`method-${m.value.toLowerCase()}`}
                  className={`text-sm px-4 py-2.5 rounded-xl border-2 font-medium transition-all text-left ${
                    method === m.value
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Outcome</label>
            <input
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-colors"
              placeholder="e.g. Spoke with donor, pledged to contribute next week"
              value={outcome}
              onChange={e => setOutcome(e.target.value)}
              data-testid="input-contact-outcome"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              Notes <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-colors resize-none"
              rows={3}
              placeholder="Any additional context..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              data-testid="input-contact-notes"
            />
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              data-testid="button-cancel-log"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
              data-testid="button-save-log"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Contact Log
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Action Row ───────────────────────────────────────────────────────────────

function ActionRow({
  task,
  isCompleting,
  onComplete,
  onReopen,
  onLogContact,
}: {
  task: TaskItem
  isCompleting: boolean
  onComplete: () => void
  onReopen: () => void
  onLogContact: () => void
}) {
  const overdue = isOverdue(task)
  const today = isDueToday(task)
  const completed = task.status === "COMPLETED"
  const meta = TYPE_META[task.type] || TYPE_META.GENERAL
  const TypeIcon = meta.icon

  const donorName = task.donor
    ? `${task.donor.firstName} ${task.donor.lastName || ""}`.trim()
    : null
  const phone = task.donor?.primaryPhone || null
  const whatsapp = task.donor?.whatsappPhone || null
  const ownerName = task.donor?.assignedToUser?.name || null
  const autoWA = task.autoWhatsAppPossible
  const dueLabel = formatDue(task.dueDate)

  const rowBg = completed
    ? "bg-white opacity-50"
    : overdue
    ? "bg-red-50 border-l-[5px] border-l-red-400"
    : today
    ? "bg-amber-50/70 border-l-[5px] border-l-amber-400"
    : "bg-white border-l-[5px] border-l-transparent"

  return (
    <div
      data-testid={`action-row-${task.id}`}
      className={`flex items-stretch gap-5 px-6 py-5 border-b border-gray-100 hover:bg-gray-50/60 transition-colors group ${rowBg}`}
    >
      {/* Check button */}
      <button
        onClick={completed ? onReopen : onComplete}
        disabled={isCompleting}
        className="flex-shrink-0 self-center text-gray-300 hover:text-teal-500 transition-colors mt-0.5"
        data-testid={`checkbox-action-${task.id}`}
        aria-label={completed ? "Reopen" : "Mark done"}
      >
        {isCompleting
          ? <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
          : completed
          ? <CheckCircle2 className="h-6 w-6 text-teal-500" />
          : <Circle className="h-6 w-6" />
        }
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Donor name row */}
        {donorName && (
          <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
            <span
              className={`text-lg font-bold leading-tight ${
                completed ? "line-through text-gray-400" : overdue ? "text-red-900" : "text-gray-900"
              }`}
              data-testid={`action-donor-${task.id}`}
            >
              {donorName}
            </span>
            {ownerName ? (
              <span
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100"
                title="Telecaller / relationship owner"
                data-testid={`action-owner-${task.id}`}
              >
                <Star className="h-3 w-3" />
                {ownerName}
              </span>
            ) : (
              <span
                className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200"
                title="No telecaller assigned"
                data-testid={`action-owner-${task.id}`}
              >
                <Star className="h-3 w-3" />
                Unassigned
              </span>
            )}
            {autoWA && !completed && (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200" title="Auto WhatsApp eligible">
                <MessageCircle className="h-3 w-3" />
                Auto WA
              </span>
            )}
          </div>
        )}

        {/* Action title */}
        <p className={`text-sm font-medium leading-snug mb-2.5 ${completed ? "text-gray-400 line-through" : "text-gray-600"}`}>
          {task.title}
        </p>

        {/* Meta chips */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${meta.bg} ${meta.color}`}>
            <TypeIcon className="h-3.5 w-3.5" />
            {meta.label}
          </span>

          <span className={`flex items-center gap-1.5 text-sm font-semibold ${
            overdue && !completed ? "text-red-600" : today ? "text-amber-600" : "text-gray-500"
          }`}>
            <Calendar className="h-3.5 w-3.5" />
            {dueLabel}
          </span>

          {task.contactCount > 0 && (
            <span
              className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200"
              title={`Last contacted: ${formatShortDate(task.lastContactedAt)}`}
              data-testid={`action-contact-count-${task.id}`}
            >
              <PhoneCall className="h-3 w-3" />
              {task.contactCount}× · {formatShortDate(task.lastContactedAt)}
            </span>
          )}

          {task.sourceSponsorship?.beneficiary && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              <Heart className="h-3 w-3" />
              {task.sourceSponsorship.beneficiary.fullName}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {!completed && (
        <div className="flex items-center gap-1.5 flex-shrink-0 self-center opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onLogContact}
            title="Log contact"
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
            data-testid={`button-log-contact-${task.id}`}
          >
            <PhoneCall className="h-4 w-4" />
            Log
          </button>

          {phone && (
            <a
              href={`tel:${phone}`}
              title="Call donor"
              className="p-2.5 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-xl transition-colors border border-transparent hover:border-green-200"
              data-testid={`button-call-${task.id}`}
            >
              <Phone className="h-5 w-5" />
            </a>
          )}

          {(whatsapp || phone) && (
            <a
              href={whatsappUrl(whatsapp || phone, donorName || "there")}
              target="_blank"
              rel="noreferrer"
              title={autoWA ? "WhatsApp (Auto eligible)" : "WhatsApp"}
              className={`p-2.5 rounded-xl transition-colors border border-transparent ${
                autoWA
                  ? "text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-200"
                  : "text-gray-500 hover:text-green-600 hover:bg-green-50 hover:border-green-200"
              }`}
              data-testid={`button-whatsapp-${task.id}`}
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          )}

          {task.donorId && (
            <Link
              href={`/dashboard/donors/${task.donorId}`}
              title="View donor profile"
              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-200"
              data-testid={`button-view-donor-${task.id}`}
            >
              <User className="h-5 w-5" />
            </Link>
          )}

          <button
            onClick={onComplete}
            disabled={isCompleting}
            title="Mark as done"
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors border border-teal-100"
            data-testid={`button-done-${task.id}`}
          >
            <CheckCheck className="h-4 w-4" />
            Done
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DonorActionsPage() {
  const {
    tasks, loading, completing,
    timeWindow, typeFilter, showCompleted,
    setShowCompleted, changeTimeWindow, changeTypeFilter,
    completeTask, reopenTask, logContact, generateTasks, refresh,
  } = useTaskInbox()

  const [logTarget, setLogTarget] = useState<TaskItem | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [regenMsg, setRegenMsg] = useState<string | null>(null)

  const currentUser = authStorage.getUser()
  const canRegenerate = currentUser?.role === "ADMIN" || currentUser?.role === "FOUNDER"

  const handleRegenerate = async () => {
    setRegenerating(true)
    setRegenMsg(null)
    try {
      await generateTasks()
      await refresh()
      setRegenMsg("Actions regenerated successfully")
    } catch {
      setRegenMsg("Regeneration failed — check your connection")
    } finally {
      setRegenerating(false)
      setTimeout(() => setRegenMsg(null), 4000)
    }
  }

  const filtered = tasks.filter(t => showCompleted || t.status !== "COMPLETED")
  const sorted = sortActions(filtered)

  const overdueCount = tasks.filter(t => isOverdue(t) && t.status !== "COMPLETED").length
  const todayCount  = tasks.filter(t => isDueToday(t) && t.status !== "COMPLETED").length
  const doneCount   = tasks.filter(t => t.status === "COMPLETED").length

  const activeWindow = TIME_WINDOWS.find(w => w.value === timeWindow)
  const activeFilterLabel = TYPE_FILTERS.find(f => f.value === typeFilter)?.label || "All"

  return (
    <div className="w-full px-6 py-8">
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

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-4xl font-bold text-gray-900 tracking-tight"
              data-testid="text-donor-actions-title"
            >
              Donor Actions
            </h1>
            <p className="text-base text-gray-500 mt-2">
              Daily workboard — auto-generated from donor profiles, special occasions, pledges &amp; giving patterns
            </p>
          </div>
          {canRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              data-testid="button-regenerate-actions"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-400 hover:text-gray-900 rounded-xl transition-all disabled:opacity-60"
              title="Regenerate all donor actions now (runs the daily engine immediately)"
            >
              <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Regenerating…" : "Regenerate Actions"}
            </button>
          )}
        </div>

        {regenMsg && (
          <p className="text-sm text-teal-700 bg-teal-50 border border-teal-200 px-4 py-2 rounded-lg mt-3 inline-block">
            {regenMsg}
          </p>
        )}

        {/* Summary pills */}
        <div className="flex items-center gap-3 mt-5 flex-wrap">
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-2 text-sm font-bold text-red-700 bg-red-100 px-4 py-2 rounded-full border border-red-200">
              <AlertTriangle className="h-4 w-4" />
              {overdueCount} overdue
            </span>
          )}
          {todayCount > 0 && (
            <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 bg-amber-100 px-4 py-2 rounded-full border border-amber-200">
              <Calendar className="h-4 w-4" />
              {todayCount} due today
            </span>
          )}
          {doneCount > 0 && (
            <span className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 bg-teal-100 px-4 py-2 rounded-full border border-teal-200">
              <CheckCircle2 className="h-4 w-4" />
              {doneCount} completed
            </span>
          )}
          {!loading && overdueCount === 0 && todayCount === 0 && doneCount === 0 && (
            <span className="text-sm text-gray-400">
              No actions in this window — try switching to "30 Days" or click Regenerate Actions
            </span>
          )}
        </div>
      </div>

      {/* ── Time-Window Tabs ── */}
      <div className="flex gap-2.5 mb-5 flex-wrap" data-testid="time-window-tabs">
        {TIME_WINDOWS.map(w => {
          const Icon = w.icon
          const isActive = timeWindow === w.value
          return (
            <button
              key={w.value}
              onClick={() => changeTimeWindow(w.value)}
              data-testid={`tab-window-${w.value}`}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all border-2 ${
                isActive ? w.activeCls : w.inactiveCls
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {w.label}
            </button>
          )
        })}
      </div>

      {/* ── Action Type Filters ── */}
      <div className="flex gap-2 flex-wrap items-center mb-6">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => changeTypeFilter(f.value)}
            data-testid={`filter-type-${f.value.toLowerCase()}`}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
              typeFilter === f.value
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setShowCompleted(v => !v)}
          data-testid="filter-show-completed"
          className={`ml-auto px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
            showCompleted
              ? "bg-teal-50 text-teal-700 border-teal-300"
              : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600"
          }`}
        >
          {showCompleted ? "Hide completed" : "Show completed"}
        </button>
      </div>

      {/* ── Action List ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm" data-testid="action-list">
        {/* List header bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-gray-800">
              {sorted.length} action{sorted.length !== 1 ? "s" : ""}
            </span>
            <span className="text-sm text-gray-400">
              {activeWindow?.label}
              {typeFilter !== "ALL" && ` · ${activeFilterLabel}`}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-red-400" /> Overdue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" /> Today
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3 w-3 text-blue-500" /> Owner / Telecaller
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
            <p className="text-base text-gray-400 font-medium">Loading donor actions...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400" data-testid="empty-state">
            <CheckCircle2 className="h-14 w-14 opacity-20" />
            <p className="text-lg font-bold text-gray-500">
              {typeFilter !== "ALL"
                ? `No ${activeFilterLabel} for ${activeWindow?.label}`
                : `No actions for ${activeWindow?.label}`}
            </p>
            <p className="text-sm text-gray-400 max-w-sm text-center">
              Actions are auto-generated each morning from donor data — birthdays, anniversaries, pledges, and giving patterns
            </p>
          </div>
        ) : (
          <div>
            {sorted.map(task => (
              <ActionRow
                key={task.id}
                task={task}
                isCompleting={completing.has(task.id)}
                onComplete={() => completeTask(task.id)}
                onReopen={() => reopenTask(task.id)}
                onLogContact={() => setLogTarget(task)}
              />
            ))}
          </div>
        )}
      </div>

      {sorted.length > 0 && (
        <p className="text-xs text-center text-gray-400 mt-5">
          Actions generated automatically from donor profiles, occasions, pledges and giving patterns each morning
        </p>
      )}
    </div>
  )
}
