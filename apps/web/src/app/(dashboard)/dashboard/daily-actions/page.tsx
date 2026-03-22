"use client"

import { RefreshCw, Loader2, CheckSquare, Square, ClipboardList, UserCircle, Cake, IndianRupee, Users, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTaskInbox, TaskItem, StaffUser } from "./hooks/useTaskInbox"
import { useEffect, useState } from "react"
import { API_URL } from "@/lib/api-config"
import { fetchWithAuth } from "@/lib/auth"

interface TodayStats {
  totalDonationsToday: number;
  totalDonorsToday: number;
  totalAmountToday: number;
}

interface TodayEvent {
  id: string;
  name: string;
  phone: string;
  city: string;
}

interface TodayData {
  todayStats: TodayStats;
  todayEvents: { birthdays: TodayEvent[]; anniversaries: TodayEvent[] };
  todayTasks: { followUps: any[]; pledgeReminders: any[]; monthlyDonorReminders: any[] };
}

const TYPE_LABELS: Record<string, string> = {
  BIRTHDAY: "Birthday",
  FOLLOW_UP: "Follow Up",
  PLEDGE: "Pledge",
  REMINDER: "Reminder",
  MANUAL: "Manual",
}

const TYPE_COLORS: Record<string, string> = {
  BIRTHDAY: "bg-pink-100 text-pink-700",
  FOLLOW_UP: "bg-blue-100 text-blue-700",
  PLEDGE: "bg-purple-100 text-purple-700",
  REMINDER: "bg-yellow-100 text-yellow-700",
  MANUAL: "bg-gray-100 text-gray-600",
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  URGENT: "bg-red-200 text-red-800",
  MEDIUM: "bg-orange-100 text-orange-700",
  LOW: "bg-gray-100 text-gray-500",
}

const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
}

function sortByPriorityThenDate(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99
    const pb = PRIORITY_ORDER[b.priority] ?? 99
    if (pa !== pb) return pa - pb
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
}

function SectionHeader({ label }: { label: string }) {
  return (
    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-1">
      {label}
    </h2>
  )
}

function TaskCard({
  task,
  isOverdue,
  isToggling,
  isAssigning,
  staffList,
  onToggle,
  onAssign,
}: {
  task: TaskItem
  isOverdue: boolean
  isToggling: boolean
  isAssigning: boolean
  staffList: StaffUser[]
  onToggle: () => void
  onAssign: (userId: string | null) => void
}) {
  const isCompleted = task.status === "COMPLETED"

  const donorName = task.donor
    ? `${task.donor.firstName} ${task.donor.lastName}`
    : task.beneficiary?.fullName ?? null

  return (
    <div
      data-testid={`task-card-${task.id}`}
      className="flex items-start gap-3 bg-white rounded-lg"
      style={{
        border: "1px solid #E2E8F0",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        opacity: isCompleted ? 0.6 : 1,
        borderLeft: isCompleted
          ? "4px solid #CBD5E0"
          : isOverdue
          ? "4px solid #EF4444"
          : "4px solid #0D9488",
      }}
    >
      <button
        data-testid={`checkbox-task-${task.id}`}
        onClick={onToggle}
        disabled={isToggling}
        className="mt-0.5 flex-shrink-0 text-teal-600 disabled:opacity-40 hover:text-teal-800 transition-colors"
      >
        {isCompleted ? (
          <CheckSquare className="h-5 w-5" />
        ) : (
          <Square className="h-5 w-5 text-gray-400" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          data-testid={`task-title-${task.id}`}
          className={`font-semibold text-sm leading-snug ${isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}
        >
          {task.title}
        </p>
        {donorName && (
          <p className="text-xs text-gray-500 mt-0.5">{donorName}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[task.type] ?? "bg-gray-100 text-gray-600"}`}
          >
            {TYPE_LABELS[task.type] ?? task.type}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] ?? "bg-gray-100 text-gray-500"}`}
          >
            {task.priority}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-2">
          <UserCircle className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          {staffList.length > 0 ? (
            <select
              data-testid={`assign-select-${task.id}`}
              value={task.assignedTo ?? ""}
              disabled={isAssigning}
              onChange={(e) => onAssign(e.target.value || null)}
              className="text-xs text-gray-500 bg-transparent border-none outline-none cursor-pointer hover:text-gray-700 disabled:opacity-50 max-w-[160px]"
            >
              <option value="">Unassigned</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <span
              data-testid={`assigned-name-${task.id}`}
              className="text-xs text-gray-400"
            >
              {task.assignedUser?.name ?? "Unassigned"}
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        {isCompleted ? (
          <span className="text-xs font-medium text-green-600">Done</span>
        ) : isOverdue ? (
          <span
            data-testid={`label-overdue-${task.id}`}
            className="text-xs font-semibold text-red-500"
          >
            Overdue
          </span>
        ) : (
          <span
            data-testid={`label-today-${task.id}`}
            className="text-xs font-semibold text-teal-600"
          >
            Due Today
          </span>
        )}
      </div>
    </div>
  )
}

export default function DailyActionsPage() {
  const { data, loading, toggling, assigning, toggleStatus, assignTask, refresh } = useTaskInbox()
  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [todayData, setTodayData] = useState<TodayData | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/tasks/staff`)
      .then((r) => r.ok ? r.json() : [])
      .then((list: StaffUser[]) => setStaffList(list))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchWithAuth('/api/dashboard/today')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setTodayData(d); })
      .catch(() => {})
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-gray-500">
        Failed to load tasks.
        <Button onClick={refresh} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  const overdueGroup = sortByPriorityThenDate(data.overdue)
  const todayPending = sortByPriorityThenDate(
    data.dueToday.filter((t) => t.status !== "COMPLETED")
  )
  const completedGroup = sortByPriorityThenDate(
    data.dueToday.filter((t) => t.status === "COMPLETED")
  )

  const completedCount = completedGroup.length
  const totalCount = data.total
  const overdueCount = overdueGroup.length
  const isEmpty = overdueGroup.length === 0 && todayPending.length === 0 && completedGroup.length === 0

  function renderCard(task: TaskItem, isOverdue: boolean) {
    return (
      <TaskCard
        key={task.id}
        task={task}
        isOverdue={isOverdue}
        isToggling={toggling.has(task.id)}
        isAssigning={assigning.has(task.id)}
        staffList={staffList}
        onToggle={() => toggleStatus(task.id, task.status)}
        onAssign={(userId) => assignTask(task.id, userId)}
      />
    )
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Today's Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Task inbox for today</p>
        </div>
        <Button variant="outline" onClick={refresh} data-testid="button-refresh-tasks">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Today Stats from Dashboard */}
      {todayData && (
        <div data-testid="today-stats-section" className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div data-testid="today-stat-donations" className="bg-white rounded-lg p-4 text-center border border-gray-200">
              <IndianRupee className="h-4 w-4 mx-auto mb-1 text-teal-600" />
              <p className="text-xl font-bold text-gray-800">₹{todayData.todayStats.totalAmountToday.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 mt-0.5">Donations Today</p>
            </div>
            <div data-testid="today-stat-donors" className="bg-white rounded-lg p-4 text-center border border-gray-200">
              <Users className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <p className="text-xl font-bold text-gray-800">{todayData.todayStats.totalDonorsToday}</p>
              <p className="text-xs text-gray-500 mt-0.5">Donors Today</p>
            </div>
            <div data-testid="today-stat-reminders" className="bg-white rounded-lg p-4 text-center border border-gray-200">
              <Bell className="h-4 w-4 mx-auto mb-1 text-orange-500" />
              <p className="text-xl font-bold text-gray-800">{todayData.todayTasks.monthlyDonorReminders.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Reminders (7d)</p>
            </div>
          </div>
          {todayData.todayEvents.birthdays.length > 0 && (
            <div data-testid="today-birthdays" className="bg-pink-50 rounded-lg border border-pink-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Cake className="h-4 w-4 text-pink-600" />
                <h3 className="text-sm font-semibold text-pink-800">Birthdays Today ({todayData.todayEvents.birthdays.length})</h3>
              </div>
              <div className="space-y-2">
                {todayData.todayEvents.birthdays.map((b) => (
                  <div key={b.id} data-testid={`birthday-${b.id}`} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-800">{b.name}</span>
                    <span className="text-gray-500">{b.phone} · {b.city}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {todayData.todayTasks.pledgeReminders.length > 0 && (
            <div data-testid="today-pledge-reminders" className="bg-purple-50 rounded-lg border border-purple-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-purple-800">Pledge Follow-ups Due ({todayData.todayTasks.pledgeReminders.length})</h3>
              </div>
              <div className="space-y-2">
                {todayData.todayTasks.pledgeReminders.slice(0, 5).map((p) => (
                  <div key={p.id} data-testid={`pledge-${p.id}`} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-800">{p.donorName || p.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.priority === 'HIGH' || p.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{p.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div
          data-testid="summary-total"
          className="bg-white rounded-lg p-4 text-center"
          style={{ border: "1px solid #E2E8F0" }}
        >
          <p className="text-2xl font-bold text-gray-800">{totalCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Tasks</p>
        </div>
        <div
          data-testid="summary-overdue"
          className="bg-white rounded-lg p-4 text-center"
          style={{ border: "1px solid #E2E8F0" }}
        >
          <p className="text-2xl font-bold text-red-500">{overdueCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Overdue</p>
        </div>
        <div
          data-testid="summary-completed"
          className="bg-white rounded-lg p-4 text-center"
          style={{ border: "1px solid #E2E8F0" }}
        >
          <p className="text-2xl font-bold text-teal-600">{completedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Completed</p>
        </div>
      </div>

      <div>
        {isEmpty ? (
          <div
            className="flex flex-col items-center gap-3 py-14 text-gray-400 bg-white rounded-lg"
            style={{ border: "1px solid #E2E8F0" }}
            data-testid="empty-state"
          >
            <ClipboardList className="h-10 w-10 opacity-40" />
            <p className="text-sm font-medium">No tasks for today</p>
          </div>
        ) : (
          <div>
            {overdueGroup.length > 0 && (
              <div data-testid="section-overdue" className="mb-4">
                <SectionHeader label="🔴 Overdue" />
                {overdueGroup.map((task) => renderCard(task, true))}
              </div>
            )}

            {todayPending.length > 0 && (
              <div data-testid="section-today" className="mb-4">
                <SectionHeader label="🟡 Due Today" />
                {todayPending.map((task) => renderCard(task, false))}
              </div>
            )}

            {completedGroup.length > 0 && (
              <div data-testid="section-completed" className="mb-4">
                <SectionHeader label="✅ Completed" />
                {completedGroup.map((task) => renderCard(task, false))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
