"use client";

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogDescription,
DialogFooter
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function ShareReportDialog({
open,
setOpen,
children,
onShare,
sharing
}:any){

return(

<Dialog open={open} onOpenChange={setOpen}>

<DialogContent className="max-w-md">

<DialogHeader>
<DialogTitle>Share Report</DialogTitle>
<DialogDescription>
Select donors to email this report to
</DialogDescription>
</DialogHeader>

{children}

<DialogFooter>

<Button variant="outline" onClick={()=>setOpen(false)}>
Cancel
</Button>

<Button onClick={onShare} disabled={sharing}>
Share via Email
</Button>

</DialogFooter>

</DialogContent>

</Dialog>

)

}
