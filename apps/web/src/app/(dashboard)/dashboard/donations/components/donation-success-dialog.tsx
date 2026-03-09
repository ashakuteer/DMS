"use client"

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle
} from "@/components/ui/dialog"

import { Check } from "lucide-react"

export default function DonationSuccessDialog({ open, onClose }: any) {

 return (

 <Dialog open={open} onOpenChange={onClose}>

 <DialogContent>

 <DialogHeader>

 <div className="flex justify-center">

 <Check className="text-green-600 h-10 w-10" />

 </div>

 <DialogTitle className="text-center">

 Donation Saved Successfully

 </DialogTitle>

 </DialogHeader>

 </DialogContent>

 </Dialog>

 )

}
