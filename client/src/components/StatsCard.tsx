import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatsCard({ title, value, icon: Icon, description, trend = 'neutral' }: StatsCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group">
      <CardContent className="p-6 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold tracking-tight" data-testid={`text-value-${title}`}>{value}</p>
            {description && (
              <p className={`text-xs mt-1 ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                {trend === 'up' && '↑ '}
                {trend === 'down' && '↓ '}
                {description}
              </p>
            )}
          </div>
          <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-3 transition-transform duration-300 group-hover:scale-110">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
