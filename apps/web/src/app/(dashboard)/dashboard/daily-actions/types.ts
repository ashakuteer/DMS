export interface DonorInfo {
  id: string
  donorCode: string
  firstName: string
  lastName?: string
  primaryPhone?: string
  whatsappPhone?: string
  personalEmail?: string
  officialEmail?: string
  healthScore?: number
  healthStatus?: string
}

export interface PledgeItem {
  id: string
  donorId: string
  donorName: string
  donorCode: string
  pledgeType: string
  amount?: number
  quantity?: string
  currency: string
  expectedFulfillmentDate: string
  notes?: string
  daysOverdue: number
  daysUntil: number
  donor: DonorInfo
}
