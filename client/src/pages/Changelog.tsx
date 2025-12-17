import { useQuery } from "@tanstack/react-query";
import { Sparkles, Wrench, Bug, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardFooter } from "@/components/DashboardFooter";
import type { Changelog } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const typeConfig: Record<string, { icon: typeof Sparkles; label: string; colorClass: string }> = {
  "new": {
    icon: Sparkles,
    label: "Neu",
    colorClass: "bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800"
  },
  "improved": {
    icon: Wrench,
    label: "Verbessert",
    colorClass: "bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800"
  },
  "fixed": {
    icon: Bug,
    label: "Behoben",
    colorClass: "bg-orange-500/10 text-orange-600 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-800"
  },
};

export default function ChangelogPage() {
  const { data: entries = [], isLoading } = useQuery<Changelog[]>({
    queryKey: ["/api/changelog"],
  });

  const groupedByMonth = entries.reduce((acc, entry) => {
    const date = new Date(entry.publishedAt);
    const monthKey = format(date, "MMMM yyyy", { locale: de });
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(entry);
    return acc;
  }, {} as Record<string, Changelog[]>);

  const months = Object.keys(groupedByMonth);

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Sparkles className="h-6 w-6 text-primary" />
              Was ist neu?
            </h1>
            <p className="text-muted-foreground mt-1">
              Alle Neuigkeiten, Verbesserungen und Fehlerbehebungen auf einen Blick.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-1/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Noch keine Neuigkeiten</h3>
                <p className="text-muted-foreground">
                  Updates und Neuerungen werden hier angezeigt.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-10">
              {months.map((month) => (
                <div key={month}>
                  <div className="flex items-center gap-2 mb-4 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">{month}</h2>
                  </div>
                  
                  <div className="space-y-4 border-l-2 border-muted pl-6 ml-2">
                    {groupedByMonth[month].map((entry) => {
                      const config = typeConfig[entry.type] || typeConfig.new;
                      const Icon = config.icon;
                      
                      return (
                        <div key={entry.id} className="relative" data-testid={`changelog-entry-${entry.id}`}>
                          <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                  {entry.title}
                                </CardTitle>
                                <Badge variant="outline" className={config.colorClass}>
                                  <Icon className="h-3 w-3 mr-1" />
                                  {config.label}
                                </Badge>
                              </div>
                              <CardDescription className="text-xs">
                                {format(new Date(entry.publishedAt), "d. MMMM yyyy", { locale: de })}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {entry.description}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <DashboardFooter />
    </DashboardLayout>
  );
}
