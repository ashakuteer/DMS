import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StaffCards({ staff }: { staff: any[] }) {
  if (!staff || staff.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground text-sm border rounded-lg">
        No staff data available.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {staff.map((s: any) => {
        const stats = s.taskStats || {};
        const score = s.latestPerformanceScore;
        return (
          <Card key={s.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{s.name}</span>
                <Badge variant="outline" className="text-xs">{s.role}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{s.email}</p>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>Assigned: <span className="font-medium">{stats.assigned ?? 0}</span></p>
              <p>Completed: <span className="font-medium text-green-600">{stats.completed ?? 0}</span></p>
              <p>Overdue: <span className="font-medium text-red-600">{stats.overdue ?? 0}</span></p>
              {score !== null && score !== undefined && (
                <p className="pt-1 text-xs text-muted-foreground">Performance score: <span className="font-medium">{score}</span></p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
