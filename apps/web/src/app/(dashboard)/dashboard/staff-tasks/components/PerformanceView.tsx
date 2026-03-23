import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";

const GRADE_COLOR: Record<string, string> = {
  A: "text-green-600",
  B: "text-blue-600",
  C: "text-yellow-600",
  D: "text-orange-600",
  F: "text-red-600",
};

export default function PerformanceView({ performance }: { performance: any[] }) {
  if (!performance || performance.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground text-sm border rounded-lg">
        No performance data available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {performance.map((p: any) => {
        const completionPct = p.completionRate ?? (p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0);
        return (
          <Card key={p.userId} className={p.isTopPerformer ? "border-yellow-300 bg-yellow-50/20 dark:bg-yellow-950/10" : ""}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-4 flex-wrap">

                <div className="flex items-center gap-2 w-8 shrink-0">
                  {p.rank === 1 ? (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  ) : p.rank <= 3 ? (
                    <Medal className="h-5 w-5 text-blue-400" />
                  ) : (
                    <span className="text-sm text-muted-foreground font-medium">#{p.rank}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{p.name}</span>
                    <Badge variant="outline" className="text-xs">{p.role}</Badge>
                    {p.isTopPerformer && <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">Top Performer</Badge>}
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span>Total: <span className="text-foreground font-medium">{p.total ?? 0}</span></span>
                    <span>Completed: <span className="text-green-600 font-medium">{p.completed ?? 0}</span></span>
                    <span>On-time: <span className="text-blue-600 font-medium">{p.onTime ?? 0}</span></span>
                    {p.avgMinutesTaken !== null && p.avgMinutesTaken !== undefined && (
                      <span>Avg time: <span className="font-medium">{p.avgMinutesTaken}m</span></span>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${completionPct >= 80 ? "bg-green-500" : completionPct >= 50 ? "bg-blue-500" : "bg-orange-400"}`}
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-2xl font-bold ${GRADE_COLOR[p.grade] || "text-muted-foreground"}`}>{p.grade}</p>
                  <p className="text-xs text-muted-foreground">{p.score ?? 0}/100</p>
                </div>

              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
