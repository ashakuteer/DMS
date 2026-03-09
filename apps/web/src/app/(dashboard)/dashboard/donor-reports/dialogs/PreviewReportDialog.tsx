"use client";

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogDescription
} from "@/components/ui/dialog";

export default function PreviewReportDialog({
open,
setOpen,
title,
description,
children
}:any){

return(

<Dialog open={open} onOpenChange={setOpen}>

<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">

<DialogHeader>

<DialogTitle>{title}</DialogTitle>

<DialogDescription>
{description}
</DialogDescription>

</DialogHeader>

{children}

</DialogContent>

</Dialog>

)

}
