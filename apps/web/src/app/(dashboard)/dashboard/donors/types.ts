export type PersonRole = "INDIVIDUAL" | "CSR" | "VOLUNTEER" | "INFLUENCER"

export interface Donor {
  id: string
  donorCode: string
  firstName: string
  middleName?: string
  lastName?: string

  primaryPhone?: string
  personalEmail?: string

  city?: string
  state?: string
  country?: string

  category: string

  primaryRole?: PersonRole
  additionalRoles?: PersonRole[]
  donorTags?: string[]
  communicationChannels?: string[]

  donorSince?: string
  healthScore?: number
  healthStatus?: "GREEN" | "YELLOW" | "RED"
  healthReasons?: string[]

  engagementLevel?: "HOT" | "WARM" | "COLD"

  assignedToUser?: {
    id: string
    name: string
    email?: string
  } | null

  _count: {
    donations: number
    pledges: number
  }
}

export interface DonorsResponse {
  items: Donor[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface StaffMember {
  id: string
  name: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  role: string
}
