"use client"

import { useState } from "react"
import {
  Loader2, Phone, MessageCircle, User, CheckCircle2, Circle,
  Calendar, AlertTriangle, Star, Gift, Heart, HandHeart,
  TrendingUp, Send, Clock, PhoneCall, X, CheckCheck,
  ChevronRight,
} from "lucide-react"
import {
  useTaskInbox,
  type TaskItem,
  type TimeWindow,
  type LogContactInput,
} from "../daily-actions/hooks/useTaskInbox"
import Link from "next/link"

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  BIRTHDAY:       { label: "Birthday",        color: "text-pink-700",   bg: "bg-pink-50",   border: "border-pink-300",   icon: Gift },
  ANNIVERSARY:    { label: "Anniversary",     color: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-300",   icon: Heart },
  REMEMBRANCE:    { label: "Remembrance",     color: "text-slate-600",  bg: "bg-slate-100", border: "border-slate-300",  icon: Star },
  FOLLOW_UP:      { label: "Follow-up",       color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-300",   icon: PhoneCall },
  PLEDGE:         { label: "Pledge",          color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-300", icon: HandHeart },
  SMART_REMINDER: { label: "Smart Reminder",  color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-300",  icon: TrendingUp },
  SPONSOR_UPDATE: { label: "Sponsor Update",  color: "text-teal-700",   bg: "bg-teal-50",   border: "border-teal-300",   icon: Send },
  REMINDER:       { label: "Reminder",        color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-300", icon: Clock },
  GENERAL:        { label: "General",         color: "text-gray-500",   bg: "bg-gray-50",   border: "border-gray-200",   icon: ChevronRight },
}

const TIME_WINDOWS: { value: TimeWindow; label: string; icon?: any; color: string; activeColor: string }[] = [
  { value: "overdue", label: "Overdue",     icon: AlertTriangle, color: "text-red-600",    activeColor: "bg-red-600 text-white" },
  { value: "today",   label: "Today",       icon: Calendar,      color: "text-amber-600",  activeColor: "bg-amber-500 text-white" },
  { value: "7days",   label: "Next 7 Days", color: "text-gray-600",  activeColor: "bg-teal-600 text-white" },
  { value: "15days",  label: "15 Days",     color: "text-gray-600",  activeColor: "bg-teal-600 text-white" },
  { value: "30days",  label: "30 Days",     color: "text-gray-600",  activeColor: "bg-teal-600 text-white" },
]

const TYPE_FILTERS = [
  { value: "ALL",            label: "All Actions" },
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

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Log Contact Dialog ──────────────────────────────────────────────────────

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
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Log Contact</h3>
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
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Notes <span className="font-normal text-gray-400">(optional)</span></label>
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

// ─── Action Row ──────────────────────────────────────────────────────────────

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

  // Row left-border accent by urgency
  const rowBg = completed
    ? "bg-white opacity-50"
    : overdue
    ? "bg-red-50 border-l-4 border-l-red-400"
    : today
    ? "bg-amber-50/60 border-l-4 border-l-amber-400"
    : "bg-white border-l-4 border-l-transparent"

  return (
    <div
      data-testid={`action-row-${task.id}`}
      className={`flex items-stretch gap-4 px-5 py-4 border-b border-gray-100 hover:bg-gray-50/70 transition-colors group ${rowBg}`}
    >
      {/* Check button */}
      <button
        onClick={completed ? onReopen : onComplete}
        disabled={isCompleting}
        className="flex-shrink-0 self-center text-gray-300 hover:text-teal-500 transition-colors"
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
      <div className="flex-1 min-w-0 py-0.5">
        {/* Donor name — large and prominent */}
        {donorName && (
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`text-base font-bold leading-snug ${
                completed ? "line-through text-gray-400" : overdue ? "text-red-900" : "text-gray-900"
              }`}
              data-testid={`action-donor-${task.id}`}
            >
              {donorName}
            </span>
            {ownerName && (
              <span
                className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"
                title="Relationship owner"
                data-testid={`action-owner-${task.id}`}
              >
                <Star className="h-3 w-3" />
                {ownerName}
              </span>
            )}
            {autoWA && !completed && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full" title="Auto WhatsApp eligible">
                <MessageCircle className="h-3 w-3" />
                Auto WA
              </span>
            )}
          </div>
        )}

        {/* Action title */}
        <p className={`text-sm leading-snug mb-2 ${completed ? "text-gray-400 line-through" : "text-gray-600"}`}>
          {task.title}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Type badge */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
            <TypeIcon className="h-3 w-3" />
            {meta.label}
          </span>

          {/* Due date */}
          <span className={`flex items-center gap-1 text-xs font-semibold ${
            overdue && !completed ? "text-red-600" : today ? "text-amber-600" : "text-gray-400"
          }`}>
            <Calendar className="h-3 w-3" />
            {dueLabel}
          </span>

          {/* Contact history */}
          {task.contactCount > 0 && (
            <span
              className="flex items-center gap-1 text-xs text-gray-400"
              title={`Last contacted: ${formatShortDate(task.lastContactedAt)}`}
              data-testid={`action-contact-count-${task.id}`}
            >
              <PhoneCall className="h-3 w-3" />
              {task.contactCount}× contacted · {formatShortDate(task.lastContactedAt)}
            </span>
          )}

          {/* Beneficiary for sponsor updates */}
          {task.sourceSponsorship?.beneficiary && (
            <span className="flex items-center gap-1 text-xs text-teal-600 font-medium">
              <Heart className="h-3 w-3" />
              {task.sourceSponsorship.beneficiary.fullName}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons — right side */}
      {!completed && (
        <div className="flex items-center gap-1 flex-shrink-0 self-center opacity-70 group-hover:opacity-100 transition-opacity">
          {/* Log contact */}
          <button
            onClick={onLogContact}
            title="Log contact"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            data-testid={`button-log-contact-${task.id}`}
          >
            <PhoneCall className="h-3.5 w-3.5" />
            Log
          </button>

          {/* Call */}
          {phone && (
            <a
              href={`tel:${phone}`}
              title="Call donor"
              className="p-2 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              data-testid={`button-call-${task.id}`}
            >
              <Phone className="h-4 w-4" />
            </a>
          )}

          {/* WhatsApp */}
          {(whatsapp || phone) && (
            <a
              href={whatsappUrl(whatsapp || phone, donorName || "there")}
              target="_blank"
              rel="noreferrer"
              title={autoWA ? "WhatsApp (Auto eligible)" : "WhatsApp"}
              className={`p-2 rounded-lg transition-colors ${
                autoWA
                  ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                  : "text-gray-500 hover:text-green-600 hover:bg-green-50"
              }`}
              data-testid={`button-whatsapp-${task.id}`}
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          )}

          {/* View donor */}
          {task.donorId && (
            <Link
              href={`/dashboard/donors/${task.donorId}`}
              title="View donor profile"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              data-testid={`button-view-donor-${task.id}`}
            >
              <User className="h-4 w-4" />
            </Link>
          )}

          {/* Mark done */}
          <button
            onClick={onComplete}
            disabled={isCompleting}
            title="Mark as done"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
            data-testid={`button-done-${task.id}`}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Done
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DonorActionsPage() {
  const {
    tasks, loading, completing,
    timeWindow, typeFilter, showCompleted,
    setShowCompleted, changeTimeWindow, changeTypeFilter,
    completeTask, reopenTask, logContact,
  } = useTaskInbox()

  const [logTarget, setLogTarget] = useState<TaskItem | null>(null)

  const filtered = tasks.filter(t => showCompleted || t.status !== "COMPLETED")
  const sorted = sortActions(filtered)

  const overdueCount = tasks.filter(t => isOverdue(t) && t.status !== "COMPLETED").length
  const todayCount  = tasks.filter(t => isDueToday(t) && t.status !== "COMPLETED").length
  const doneCount   = tasks.filter(t => t.status === "COMPLETED").length

  const activeWindowLabel = TIME_WINDOWS.find(w => w.value === timeWindow)?.label || "Today"
  const activeFilterLabel = TYPE_FILTERS.find(f => f.value === typeFilter)?.label || "All Actions"

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
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

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight" data-testid="text-donor-actions-title">
          Donor Actions
        </h1>
        <p className="text-base text-gray-500 mt-1">
          Your daily donor workboard — actions generated from donor profiles, occasions, pledges &amp; giving patterns
        </p>

        {/* Summary pills */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 bg-red-100 px-3 py-1.5 rounded-full">
              <AlertTriangle className="h-4 w-4" />
              {overdueCount} overdue
            </span>
          )}
          {todayCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
              <Calendar className="h-4 w-4" />
              {todayCount} due today
            </span>
          )}
          {doneCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 bg-teal-100 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="h-4 w-4" />
              {doneCount} completed
            </span>
          )}
        </div>
      </div>

      {/* ── Time-Window Tabs ── */}
      <div className="flex gap-2 mb-5 flex-wrap" data-testid="time-window-tabs">
        {TIME_WINDOWS.map(w => {
          const Icon = w.icon
          const isActive = timeWindow === w.value
          return (
            <button
              key={w.value}
              onClick={() => changeTimeWindow(w.value)}
              data-testid={`tab-window-${w.value}`}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                isActive
                  ? `${w.activeColor} border-transparent shadow-sm`
                  : `bg-white ${w.color} border-gray-200 hover:border-gray-300 hover:bg-gray-50`
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {w.label}
            </button>
          )
        })}
      </div>

      {/* ── Action Type Filters ── */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => changeTypeFilter(f.value)}
            data-testid={`filter-type-${f.value.toLowerCase()}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
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
          className={`ml-auto px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            showCompleted
              ? "bg-teal-50 text-teal-700 border-teal-300"
              : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
          }`}
        >
          {showCompleted ? "Hide completed" : "Show completed"}
        </button>
      </div>

      {/* ── Action List ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm" data-testid="action-list">
        {/* List header */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            {sorted.length} action{sorted.length !== 1 ? "s" : ""} · {activeWindowLabel}
            {typeFilter !== "ALL" && ` · ${activeFilterLabel}`}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-400" /> Overdue
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400" /> Today
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-blue-500" /> Owner
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            <p className="text-sm text-gray-400">Loading donor actions...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400" data-testid="empty-state">
            <CheckCircle2 className="h-12 w-12 opacity-25" />
            <p className="text-base font-semibold text-gray-500">
              {typeFilter !== "ALL"
                ? `No ${activeFilterLabel} for ${activeWindowLabel}`
                : `No actions for ${activeWindowLabel}`}
            </p>
            <p className="text-sm text-gray-400">Actions are auto-generated from donor data each morning</p>
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
        <p className="text-xs text-center text-gray-400 mt-4">
          Actions are generated automatically from donor profiles, occasions, pledges and giving patterns
        </p>
      )}
    </div>
  )
}
