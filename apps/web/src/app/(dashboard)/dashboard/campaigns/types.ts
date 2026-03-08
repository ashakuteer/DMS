export interface Campaign {
  id: string
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  goalAmount: number
  currency: string
  status: string
  homeTypes: string[]
  createdAt: string
  updatedAt: string
  totalRaised: number
  donorCount: number
  donationCount: number
  progressPercent: number
}

export interface CampaignDonor {
  donor: {
    id: string
    donorCode: string
    firstName: string
    lastName: string | null
    primaryPhone: string | null
    personalEmail: string | null
    officialEmail: string | null
    city: string | null
  }
  totalAmount: number
  donationCount: number
  lastDonation: string
}

export interface BeneficiarySearchResult {
  id: string
  code: string
  fullName: string
  homeType: string
  status: string
}
