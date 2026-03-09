"use client"

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle
} from "@/components/ui/dialog"

import { Donation } from "../types"
import { getDonorName, formatAmount } from "../utils"

interface Props {
 donation: Donation | null
 open: boolean
 onClose: () => void
}

export default function DonationDetailsDialog({ donation, open, onClose }: Props) {

 if (!donation) return null

 return (

 <Dialog open={open} onOpenChange={onClose}>

 <DialogContent>

 <DialogHeader>
 <DialogTitle>Donation Details</DialogTitle>
 </DialogHeader>

 <div className="space-y-2">

 <p>Donor: {getDonorName(donation.donor)}</p>

 <p>Amount: {formatAmount(donation.donationAmount)}</p>

 <p>Date: {donation.donationDate}</p>

 </div>

 </DialogContent>

 </Dialog>

 )

}
