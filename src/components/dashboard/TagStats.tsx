import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TagStat {
  tag: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

interface TagStatsProps {
  stats: TagStat[];
}

export const TagStats = ({ stats }: TagStatsProps) => {
  return (
    <Card className="border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Top RFID Tags</h3>
      <div className="space-y-4">
        {stats.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No data available</p>
        ) : (
          stats.map((stat, index) => (
            <div key={stat.tag} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span className="font-mono text-sm font-medium text-foreground">{stat.tag}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">₹{stat.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{stat.count} transactions</p>
                </div>
              </div>
              <Progress value={stat.percentage} className="h-2" />
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
