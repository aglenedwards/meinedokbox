import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GracePeriodBannerProps {
  graceDaysRemaining: number;
}

const REMINDER_KEY = "gracePeriodLastReminder";
const REMINDER_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export function GracePeriodBanner({ graceDaysRemaining }: GracePeriodBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const lastReminder = localStorage.getItem(REMINDER_KEY);
    const now = Date.now();

    if (lastReminder) {
      const timeSinceReminder = now - parseInt(lastReminder, 10);
      if (timeSinceReminder < REMINDER_INTERVAL) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(REMINDER_KEY, Date.now().toString());
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20 mb-6 relative">
      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="ml-2 flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold text-orange-900 dark:text-orange-100">
            Ihre Testphase ist abgelaufen
          </p>
          <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
            Sie haben noch <span className="font-bold">{graceDaysRemaining} {graceDaysRemaining === 1 ? 'Tag' : 'Tage'}</span> Zeit, 
            um einen Plan auszuwählen. Uploads sind vorübergehend deaktiviert.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/#pricing">
            <Button 
              variant="default" 
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
              data-testid="button-choose-plan"
            >
              Plan wählen
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/40"
            data-testid="button-dismiss-grace-banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
