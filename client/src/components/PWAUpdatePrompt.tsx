import { useState, useEffect } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { skipWaiting } from "@/lib/registerServiceWorker";

export function PWAUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker.ready.then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            setRegistration(reg);
            setShowUpdate(true);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      skipWaiting();
      setShowUpdate(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-top-5">
      <Card className="p-4 shadow-lg border-2 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              Update verfügbar
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Eine neue Version von MeineDokBox ist verfügbar
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                data-testid="button-update-pwa"
                className="flex-1"
              >
                Jetzt aktualisieren
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                data-testid="button-dismiss-update"
              >
                Später
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-6 w-6"
            onClick={handleDismiss}
            data-testid="button-close-update"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
