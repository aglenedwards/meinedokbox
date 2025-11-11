import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckoutDialog } from "./CheckoutDialog";

export function ReadOnlyBanner() {
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <>
      <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20 mb-6">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <AlertDescription className="ml-2 flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold text-red-900 dark:text-red-100">
              Nur-Lese-Modus aktiv
            </p>
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
              Ihre Testphase ist abgelaufen. Sie können Ihre Dokumente weiterhin ansehen und herunterladen, 
              aber keine neuen Dokumente hochladen oder bearbeiten.
            </p>
          </div>
          <Button 
            variant="default" 
            size="sm"
            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            data-testid="button-upgrade-plan"
            onClick={() => setShowCheckout(true)}
          >
            Jetzt upgraden
          </Button>
        </AlertDescription>
      </Alert>

      <CheckoutDialog 
        open={showCheckout} 
        onClose={() => setShowCheckout(false)}
        selectedPlan="family"
        selectedPeriod="yearly"
      />
    </>
  );
}
