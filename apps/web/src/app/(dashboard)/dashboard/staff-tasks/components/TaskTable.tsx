import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

export default function TaskTable({
  tasks,
  onEdit,
  onDelete,
}: any) {
  return (
    <Table>

      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {tasks.map((task: any) => (
          <TableRow key={task.id}>

            <TableCell>{task.title}</TableCell>

            <TableCell>{task.status}</TableCell>

            <TableCell>{task.priority}</TableCell>

            <TableCell className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(task)}
              >
                <Edit className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>

          </TableRow>
        ))}
      </TableBody>

    </Table>
  );
}
