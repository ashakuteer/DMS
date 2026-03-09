import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function EditTaskDialog({
  open,
  setOpen,
  children,
  onUpdate,
  submitting,
}: any) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogContent className="max-w-lg">

        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        {children}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button onClick={onUpdate} disabled={submitting}>
            Update
          </Button>
        </DialogFooter>

      </DialogContent>

    </Dialog>
  );
}
