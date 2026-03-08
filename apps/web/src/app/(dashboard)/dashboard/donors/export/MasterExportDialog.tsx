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

export default function MasterExportDialog({ open, setOpen }: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogContent>

        <DialogHeader>
          <DialogTitle>
            Master Donor Export
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Export donor Excel file.
        </p>

      </DialogContent>

    </Dialog>
  )
}
