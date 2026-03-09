import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function StaffCards({ staff }: any) {
  return (
    <div className="grid md:grid-cols-3 gap-4">

      {staff.map((s: any) => (
        <Card key={s.id}>
          <CardHeader className="font-semibold">
            {s.name}
          </CardHeader>

          <CardContent className="text-sm space-y-1">
            <p>Assigned: {s.tasksAssigned || 0}</p>
            <p>Completed: {s.tasksCompleted || 0}</p>
            <p>Overdue: {s.tasksOverdue || 0}</p>
          </CardContent>

        </Card>
      ))}

    </div>
  );
}
