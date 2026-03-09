import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TaskDetailDialog({
  open,
  setOpen,
  task,
}: any) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogContent className="max-w-lg">

        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <p>Status: {task.status}</p>
          <p>Priority: {task.priority}</p>
          <p>Category: {task.category}</p>
          <p>Notes: {task.notes || "—"}</p>
        </div>

      </DialogContent>

    </Dialog>
  );
}
