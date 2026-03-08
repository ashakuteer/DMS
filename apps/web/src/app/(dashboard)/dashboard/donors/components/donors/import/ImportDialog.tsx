import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

interface Props {
  open: boolean
  setOpen: (v: boolean) => void
}

export default function ImportDialog({ open, setOpen }: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogContent>

        <DialogHeader>
          <DialogTitle>
            Import Donors
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Import functionality continues here.
        </p>

      </DialogContent>

    </Dialog>
  )
}
