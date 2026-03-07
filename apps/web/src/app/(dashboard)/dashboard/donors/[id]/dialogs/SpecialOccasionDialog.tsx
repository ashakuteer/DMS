"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SpecialOccasionFormData {
type: string;
day: string;
month: string;
relatedPersonName?: string;
notes?: string;
}

interface SpecialOccasionDialogProps {
open: boolean;
onOpenChange: (open: boolean) => void;
editingSpecialOccasion: boolean;
specialOccasionForm: SpecialOccasionFormData;
setSpecialOccasionForm: (form: SpecialOccasionFormData) => void;
savingSpecialOccasion: boolean;
onSubmit: (e: React.FormEvent) => void;
}

export default function SpecialOccasionDialog({
open,
onOpenChange,
editingSpecialOccasion,
specialOccasionForm,
setSpecialOccasionForm,
savingSpecialOccasion,
onSubmit,
}: SpecialOccasionDialogProps) {
return (
<Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent className="sm:max-w-[500px]">
<DialogHeader>
<DialogTitle>
{editingSpecialOccasion ? "Edit Special Day" : "Add Special Day"}
</DialogTitle>
<DialogDescription>
{editingSpecialOccasion
? "Update special day details"
: "Add a new special day to remember"}
</DialogDescription>
</DialogHeader>

<form onSubmit={onSubmit}>
<div className="grid gap-4 py-4">

<div className="grid grid-cols-4 items-center gap-4">
<Label htmlFor="so-type" className="text-right">
Type *
</Label>

<Select
value={specialOccasionForm.type}
onValueChange={(value) =>
setSpecialOccasionForm({
...specialOccasionForm,
type: value,
})
}
>
<SelectTrigger
className="col-span-3"
data-testid="select-special-occasion-type"
>
<SelectValue placeholder="Select type" />
</SelectTrigger>

<SelectContent>
<SelectItem value="DOB_SELF">Birthday (Self)</SelectItem>
<SelectItem value="DOB_SPOUSE">Birthday (Spouse)</SelectItem>
<SelectItem value="DOB_CHILD">Birthday (Child)</SelectItem>
<SelectItem value="ANNIVERSARY">Wedding Anniversary</SelectItem>
<SelectItem value="DEATH_ANNIVERSARY">
Memorial Day (Loved One)
</SelectItem>
<SelectItem value="OTHER">Other</SelectItem>
</SelectContent>
</Select>
</div>

<div className="grid grid-cols-4 items-center gap-4">
<Label className="text-right">Day & Month *</Label>

<div className="col-span-3 flex gap-2">

<Select
value={specialOccasionForm.day}
onValueChange={(value) =>
setSpecialOccasionForm({
...specialOccasionForm,
day: value,
})
}
>
<SelectTrigger
className="w-[100px]"
data-testid="select-special-occasion-day"
>
<SelectValue placeholder="Day" />
</SelectTrigger>

<SelectContent>
{Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
<SelectItem key={d} value={String(d)}>
{d}
</SelectItem>
))}
</SelectContent>
</Select>

<Select
value={specialOccasionForm.month}
onValueChange={(value) =>
setSpecialOccasionForm({
...specialOccasionForm,
month: value,
})
}
>
<SelectTrigger
className="flex-1"
data-testid="select-special-occasion-month"
>
<SelectValue placeholder="Month" />
</SelectTrigger>

<SelectContent>
<SelectItem value="1">January</SelectItem>
<SelectItem value="2">February</SelectItem>
<SelectItem value="3">March</SelectItem>
<SelectItem value="4">April</SelectItem>
<SelectItem value="5">May</SelectItem>
<SelectItem value="6">June</SelectItem>
<SelectItem value="7">July</SelectItem>
<SelectItem value="8">August</SelectItem>
<SelectItem value="9">September</SelectItem>
<SelectItem value="10">October</SelectItem>
<SelectItem value="11">November</SelectItem>
<SelectItem value="12">December</SelectItem>
</SelectContent>

</Select>
</div>

<p className="col-span-4 text-right text-xs text-muted-foreground">
Year is intentionally not collected.
</p>

</div>

<div className="grid grid-cols-4 items-center gap-4">
<Label htmlFor="so-person" className="text-right">
Person Name
</Label>

<Input
id="so-person"
value={specialOccasionForm.relatedPersonName || ""}
onChange={(e) =>
setSpecialOccasionForm({
...specialOccasionForm,
relatedPersonName: e.target.value,
})
}
className="col-span-3"
placeholder="Optional (e.g., child's name)"
data-testid="input-special-occasion-person"
/>
</div>

<div className="grid grid-cols-4 items-center gap-4">
<Label htmlFor="so-notes" className="text-right">
Notes
</Label>

<Textarea
id="so-notes"
value={specialOccasionForm.notes || ""}
onChange={(e) =>
setSpecialOccasionForm({
...specialOccasionForm,
notes: e.target.value,
})
}
className="col-span-3"
placeholder="Optional notes"
data-testid="input-special-occasion-notes"
/>

</div>

</div>

<DialogFooter>
<Button
type="button"
variant="outline"
onClick={() => onOpenChange(false)}
>
Cancel
</Button>

<Button
type="submit"
disabled={savingSpecialOccasion}
data-testid="button-save-special-occasion"
>
{savingSpecialOccasion ? (
<>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />
Saving...
</>
) : editingSpecialOccasion ? (
"Update"
) : (
"Add"
)}
</Button>

</DialogFooter>
</form>
</DialogContent>
</Dialog>
);
}
