import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles } from "lucide-react";

interface TrialBannerProps {
  daysRemaining: number;
  onUpgrade: () => void;
}

export function TrialBanner({ daysRemaining, onUpgrade }: TrialBannerProps) {
  if (daysRemaining <= 0) {
    return null;
  }

  const isUrgent = daysRemaining <= 3;

  return (
    <Alert className={isUrgent ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20" : "border-primary bg-primary/5"}>
      <Sparkles className="h-4 w-4" />
      <AlertTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>
          {isUrgent ? "⚡ Trial endet bald!" : "🎉 Family-Trial aktiv"}
        </span>
        <Button 
          variant={isUrgent ? "default" : "outline"} 
          size="sm" 
          onClick={onUpgrade}
          data-testid="button-upgrade-from-banner"
          className="w-full sm:w-auto"
        >
          Tarife vergleichen
        </Button>
      </AlertTitle>
      <AlertDescription className="flex items-center gap-2 mt-1">
        <Clock className="h-4 w-4" />
        <span>
          {isUrgent ? (
            <strong>Nur noch {daysRemaining} {daysRemaining === 1 ? "Tag" : "Tage"} bis zum Ende Ihrer Trial-Phase!</strong>
          ) : (
            <span>Sie testen den Family-Tarif mit allen Features kostenfrei. Noch {daysRemaining} Tage verbleibend.</span>
          )}
        </span>
      </AlertDescription>
    </Alert>
  );
}
