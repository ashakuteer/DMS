"use client"

import { Loader2, CheckCircle2 } from "lucide-react"

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogFooter
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function CompleteFollowUpDialog({
open,
onOpenChange,
followUp,
completedNote,
setCompletedNote,
onComplete,
submitting
}:any){

if(!followUp) return null

return(

<Dialog open={open} onOpenChange={onOpenChange}>

<DialogContent className="max-w-md">

<DialogHeader>
<DialogTitle>Complete Follow-up</DialogTitle>
</DialogHeader>

<div className="space-y-4">

<div className="p-3 border rounded bg-muted">

<p className="text-sm font-medium">
{followUp.donor.firstName} {followUp.donor.lastName}
</p>

<p className="text-xs text-muted-foreground">
{followUp.note}
</p>

</div>

<Textarea
placeholder="Completion note"
value={completedNote}
onChange={(e)=>setCompletedNote(e.target.value)}
/>

</div>

<DialogFooter>

<Button variant="outline" onClick={()=>onOpenChange(false)}>
Cancel
</Button>

<Button onClick={onComplete} disabled={submitting}>

{submitting
? <Loader2 className="h-4 w-4 animate-spin mr-1"/>
: <CheckCircle2 className="h-4 w-4 mr-1"/>
}

Complete

</Button>

</DialogFooter>

</DialogContent>

</Dialog>

)

}
