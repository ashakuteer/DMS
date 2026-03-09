"use client";

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogDescription
} from "@/components/ui/dialog";

export default function TemplateManagerDialog({
open,
setOpen,
children
}:any){

return(

<Dialog open={open} onOpenChange={setOpen}>

<DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">

<DialogHeader>

<DialogTitle>Report Templates</DialogTitle>

<DialogDescription>
Manage configurable report templates
</DialogDescription>

</DialogHeader>

{children}

</DialogContent>

</Dialog>

)

}
