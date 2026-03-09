"use client"

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"

interface Props {
 open: boolean
 onClose: () => void
}

export default function AddDonationDialog({ open, onClose }: Props) {

 return (

 <Dialog open={open} onOpenChange={onClose}>

 <DialogContent>

 <DialogHeader>
 <DialogTitle>Add Donation</DialogTitle>
 </DialogHeader>

 <div className="space-y-4">

 <p>Add donation form here</p>

 <Button>Save Donation</Button>

 </div>

 </DialogContent>

 </Dialog>

 )

}
