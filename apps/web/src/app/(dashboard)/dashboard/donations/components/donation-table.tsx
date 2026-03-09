"use client"

import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow
} from "@/components/ui/table"

import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import { Donation } from "../types"
import { getDonorName, getDonationTypeBadgeColor, formatAmount } from "../utils"

interface Props {
 donations: Donation[]
 onView: (id: string) => void
}

export default function DonationTable({ donations, onView }: Props) {

 return (

 <div className="rounded-md border">

 <Table>

 <TableHeader>

 <TableRow>
 <TableHead>Date</TableHead>
 <TableHead>Donor</TableHead>
 <TableHead>Type</TableHead>
 <TableHead className="text-right">Amount</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>

 </TableHeader>

 <TableBody>

 {donations.map((d) => (

 <TableRow key={d.id}>

 <TableCell>{d.donationDate}</TableCell>

 <TableCell>

 <div className="flex flex-col">

 <span>{getDonorName(d.donor)}</span>

 <span className="text-xs text-muted-foreground">
 {d.donor.donorCode}
 </span>

 </div>

 </TableCell>

 <TableCell>

 <Badge className={getDonationTypeBadgeColor(d.donationType)}>

 {d.donationType}

 </Badge>

 </TableCell>

 <TableCell className="text-right">

 {formatAmount(d.donationAmount)}

 </TableCell>

 <TableCell className="text-right">

 <Eye
 className="h-4 w-4 cursor-pointer"
 onClick={() => onView(d.id)}
 />

 </TableCell>

 </TableRow>

 ))}

 </TableBody>

 </Table>

 </div>

 )

}
