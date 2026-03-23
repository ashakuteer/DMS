import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";

const LEVEL_CONFIG: Record<string, { color: string; bg: string; bar: string }> = {
  Excellent: { color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700", bar: "bg-green-500" },
  Good:      { color: "text-blue-700 dark:text-blue-400",  bg: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",   bar: "bg-blue-500" },
  Warning:   { color: "text-yellow-700 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700", bar: "bg-yellow-500" },
  Critical:  { color: "text-red-700 dark:text-red-400",    bg: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",       bar: "bg-red-500" },
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
        const level = p.statusLevel || (p.score >= 90 ? "Excellent" : p.score >= 70 ? "Good" : p.score >= 50 ? "Warning" : "Critical");
        const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.Critical;
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
                    <span>Missed: <span className="text-red-600 font-medium">{p.missed ?? 0}</span></span>
                    <span>Completion: <span className="font-medium">{completionPct}%</span></span>
                    {p.avgMinutesTaken !== null && p.avgMinutesTaken !== undefined && (
                      <span>Avg time: <span className="font-medium">{p.avgMinutesTaken}m</span></span>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cfg.bar}`}
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                  {p.insight && (
                    <p className="mt-2 text-xs italic text-muted-foreground">{p.insight}</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <Badge className={`text-xs font-semibold px-2 py-0.5 border ${cfg.bg} ${cfg.color}`}>
                    {level}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{p.score ?? 0} pts</p>
                </div>

              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
