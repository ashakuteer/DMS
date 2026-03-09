"use client"

import { useEffect, useState } from "react"

import DonationStatsCard from "./components/donation-stats"
import DonationFilters from "./components/donation-filters"
import DonationTable from "./components/donation-table"
import DonationDetailsDialog from "./components/donation-details-dialog"

import { Donation, DonationStats } from "./types"

export default function DonationsPage() {

const [donations,setDonations] = useState<Donation[]>([])
const [stats,setStats] = useState<DonationStats | null>(null)

const [search,setSearch] = useState("")
const [selected,setSelected] = useState<Donation | null>(null)

useEffect(()=>{

fetch("/api/donations")
.then(res=>res.json())
.then(data=>setDonations(data.items))

},[])

return (

<div className="p-6 space-y-6">

<h1 className="text-3xl font-bold">
Donations
</h1>

{stats && <DonationStatsCard stats={stats} />}

<DonationFilters
search={search}
setSearch={setSearch}
/>

<DonationTable
donations={donations}
onView={(id)=>{

const d = donations.find(x=>x.id===id)
if(d) setSelected(d)

}}
/>

<DonationDetailsDialog
donation={selected}
open={!!selected}
onClose={()=>setSelected(null)}
/>

</div>

)

}
