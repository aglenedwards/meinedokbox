import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FreeBannerProps {
  onUpgrade: () => void;
}

export function FreeBanner({ onUpgrade }: FreeBannerProps) {
  return (
    <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 mb-6">
      <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      <AlertDescription className="ml-2 flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold text-yellow-900 dark:text-yellow-100">
            Free-Plan - Nur Lesezugriff
          </p>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
            Sie können Ihre gespeicherten Dokumente ansehen und herunterladen, 
            aber keine neuen Dokumente hochladen. Upgraden Sie für volle Funktionalität.
          </p>
        </div>
        <Button 
          variant="default" 
          size="sm"
          onClick={onUpgrade}
          className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
          data-testid="button-upgrade-free"
        >
          Jetzt upgraden
        </Button>
      </AlertDescription>
    </Alert>
  );
}
