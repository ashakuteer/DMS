import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function PerformanceView({ performance }: any) {
  if (!performance) return null;

  return (
    <div className="space-y-4">

      {performance.monthly.map((m: any) => (
        <Card key={m.month}>
          <CardContent className="pt-4">

            <div className="flex items-center gap-4">
              <span className="w-20">{m.monthName}</span>

              <Progress value={m.score} className="flex-1 h-3" />

              <span className="w-12 text-right">
                {m.score}%
              </span>
            </div>

          </CardContent>
        </Card>
      ))}

    </div>
  );
}
