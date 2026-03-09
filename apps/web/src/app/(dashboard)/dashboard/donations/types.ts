export interface Donor {
  id: string
  donorCode: string
  firstName: string
  lastName?: string
  primaryPhone?: string
  personalEmail?: string
  officialEmail?: string
  whatsappPhone?: string
  city?: string
  state?: string
}

export interface Donation {
  id: string
  donorId: string
  donationDate: string
  donationAmount: string
  currency: string
  donationType: string
  donationMode: string | null
  donationPurpose?: string
  transactionId?: string
  remarks?: string
  quantity?: string
  unit?: string
  itemDescription?: string
  donationHomeType?: string
  receiptNumber?: string
  financialYear?: string
  donor: Donor
  createdBy?: { id: string; name: string }
}

export interface DonationsResponse {
  items: Donation[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface HomeStats {
  homeType: string
  label: string
  cashTotal: number
  inKindCount: number
  totalCount: number
}

export interface DonationStats {
  byHome: HomeStats[]
  totals: {
    cashTotal: number
    inKindCount: number
    totalDonations: number
  }
}
