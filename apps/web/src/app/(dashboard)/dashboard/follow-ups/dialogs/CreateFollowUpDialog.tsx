"use client";

import { useState } from "react";
import { format, addDays } from "date-fns";
import { Loader2, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogDescription,
DialogFooter
} from "@/components/ui/dialog";

import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue
} from "@/components/ui/select";

import { fetchWithAuth } from "@/lib/auth";

export default function CreateFollowUpDialog({
open,
onOpenChange,
user,
staffUsers,
onCreated,
toast
}:any){

const [submitting,setSubmitting] = useState(false)

const [formData,setFormData] = useState({
note:"",
dueDate:format(addDays(new Date(),3),"yyyy-MM-dd"),
priority:"NORMAL",
assignedToId:user?.id || ""
})

const [donorSearch,setDonorSearch] = useState("")
const [donorResults,setDonorResults] = useState<any[]>([])
const [donorSearchLoading,setDonorSearchLoading] = useState(false)
const [selectedDonor,setSelectedDonor] = useState<any>(null)

async function searchDonors(query:string){

setDonorSearchLoading(true)

try{

const res = await fetchWithAuth(`/api/donors?search=${encodeURIComponent(query)}&limit=20`)

if(res.ok){

const data = await res.json()

const list = data.items || data.donors || data.data || data

setDonorResults(Array.isArray(list) ? list : [])

}

}catch{
console.error("donor search error")
}
finally{
setDonorSearchLoading(false)
}

}

async function handleCreate(){

if(!selectedDonor){
toast({title:"Error",description:"Select donor",variant:"destructive"})
return
}

setSubmitting(true)

try{

const res = await fetchWithAuth("/api/follow-ups",{
method:"POST",
body:JSON.stringify({
donorId:selectedDonor.id,
assignedToId:formData.assignedToId || user?.id,
note:formData.note,
dueDate:formData.dueDate,
priority:formData.priority
})
})

if(res.ok){

toast({title:"Created",description:"Follow-up created"})

onOpenChange(false)

onCreated()

}

}catch{

toast({title:"Error",description:"Failed to create",variant:"destructive"})

}
finally{
setSubmitting(false)
}

}

return(

<Dialog open={open} onOpenChange={onOpenChange}>

<DialogContent className="max-w-lg">

<DialogHeader>
<DialogTitle>New Follow-up</DialogTitle>
<DialogDescription>Create reminder for donor</DialogDescription>
</DialogHeader>

<div className="space-y-4">

{/* donor */}

{selectedDonor ? (

<div className="p-2 border rounded">

<p className="text-sm font-medium">
{selectedDonor.firstName} {selectedDonor.lastName || ""}
</p>

<Button
variant="ghost"
size="sm"
onClick={()=>setSelectedDonor(null)}
>
Change
</Button>

</div>

) : (

<div>

<div className="relative">

<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"/>

<Input
placeholder="Search donor"
value={donorSearch}
className="pl-9"
onChange={(e)=>{
setDonorSearch(e.target.value)

if(e.target.value.length>=2)
searchDonors(e.target.value)
}}
/>

</div>

{donorSearchLoading && (
<Loader2 className="h-4 w-4 animate-spin"/>
)}

{donorResults.map(d=>(
<div
key={d.id}
className="p-2 border-b cursor-pointer"
onClick={()=>setSelectedDonor(d)}
>
{d.firstName} {d.lastName}
</div>
))}

</div>

)}

{/* note */}

<Textarea
placeholder="Follow-up note"
value={formData.note}
onChange={(e)=>setFormData({...formData,note:e.target.value})}
/>

{/* date */}

<Input
type="date"
value={formData.dueDate}
onChange={(e)=>setFormData({...formData,dueDate:e.target.value})}
/>

{/* priority */}

<Select
value={formData.priority}
onValueChange={(v)=>setFormData({...formData,priority:v})}
>

<SelectTrigger>
<SelectValue/>
</SelectTrigger>

<SelectContent>
<SelectItem value="LOW">Low</SelectItem>
<SelectItem value="NORMAL">Normal</SelectItem>
<SelectItem value="HIGH">High</SelectItem>
<SelectItem value="URGENT">Urgent</SelectItem>
</SelectContent>

</Select>

</div>

<DialogFooter>

<Button variant="outline" onClick={()=>onOpenChange(false)}>
Cancel
</Button>

<Button onClick={handleCreate} disabled={submitting}>

{submitting
? <Loader2 className="h-4 w-4 animate-spin mr-1"/>
: <Plus className="h-4 w-4 mr-1"/>
}

Create

</Button>

</DialogFooter>

</DialogContent>

</Dialog>

)

}
