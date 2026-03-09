import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function CreateTaskDialog({
  open,
  setOpen,
  children,
  onCreate,
  submitting,
}: any) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogContent className="max-w-lg">

        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        {children}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button onClick={onCreate} disabled={submitting}>
            Create
          </Button>
        </DialogFooter>

      </DialogContent>

    </Dialog>
  );
}
