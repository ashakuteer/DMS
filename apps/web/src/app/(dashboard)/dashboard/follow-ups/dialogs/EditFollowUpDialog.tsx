"use client"

import { Loader2, Edit } from "lucide-react"

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogFooter
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

export default function EditFollowUpDialog({
open,
onOpenChange,
followUp,
formData,
setFormData,
onSave,
submitting
}:any){

if(!followUp) return null

return(

<Dialog open={open} onOpenChange={onOpenChange}>

<DialogContent className="max-w-lg">

<DialogHeader>
<DialogTitle>Edit Follow-up</DialogTitle>
</DialogHeader>

<div className="space-y-4">

<div className="p-2 border rounded bg-muted">

{followUp.donor.firstName} {followUp.donor.lastName}

</div>

<Textarea
value={formData.note}
onChange={(e)=>setFormData({...formData,note:e.target.value})}
/>

<Input
type="date"
value={formData.dueDate}
onChange={(e)=>setFormData({...formData,dueDate:e.target.value})}
/>

</div>

<DialogFooter>

<Button variant="outline" onClick={()=>onOpenChange(false)}>
Cancel
</Button>

<Button onClick={onSave} disabled={submitting}>

{submitting
? <Loader2 className="h-4 w-4 animate-spin mr-1"/>
: <Edit className="h-4 w-4 mr-1"/>
}

Save

</Button>

</DialogFooter>

</DialogContent>

</Dialog>

)

}
