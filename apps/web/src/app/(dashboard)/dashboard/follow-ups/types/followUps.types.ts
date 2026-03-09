export interface Donor {
  id: string
  donorCode: string
  firstName: string
  lastName: string | null
  primaryPhone: string | null
  personalEmail: string | null
  officialEmail: string | null
  engagementLevel?: string
}

export interface StaffUser {
  id: string
  name: string
  email: string
}

export interface FollowUp {
  id: string
  donorId: string
  assignedToId: string
  createdById: string
  note: string
  dueDate: string
  priority: string
  status: string
  completedAt: string | null
  completedNote: string | null
  createdAt: string
  donor: Donor
  assignedTo: StaffUser
  createdBy: { id: string; name: string }
}

export interface Stats {
  total: number
  pending: number
  completed: number
  overdue: number
  dueToday: number
  dueThisWeek: number
}
