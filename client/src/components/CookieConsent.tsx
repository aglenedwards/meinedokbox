import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Settings, Check, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ConsentSettings = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const CONSENT_STORAGE_KEY = "meinedokbox_cookie_consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    initClarity?: () => void;
  }
}

function updateGoogleConsent(settings: ConsentSettings) {
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      analytics_storage: settings.analytics ? "granted" : "denied",
      ad_storage: settings.marketing ? "granted" : "denied",
      ad_user_data: settings.marketing ? "granted" : "denied",
      ad_personalization: settings.marketing ? "granted" : "denied",
    });
  }
  
  // Initialize Microsoft Clarity if analytics consent is given
  if (settings.analytics && typeof window.initClarity === "function") {
    window.initClarity();
  }
}

export function getConsentSettings(): ConsentSettings | null {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent("open-cookie-settings"));
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ConsentSettings>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = getConsentSettings();
    if (stored) {
      setSettings(stored);
      updateGoogleConsent(stored);
    } else {
      setShowBanner(true);
    }

    const handleOpenSettings = () => {
      setShowSettings(true);
      setShowBanner(true);
    };
    window.addEventListener("open-cookie-settings", handleOpenSettings);
    return () => window.removeEventListener("open-cookie-settings", handleOpenSettings);
  }, []);

  const saveSettings = (newSettings: ConsentSettings) => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
    updateGoogleConsent(newSettings);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    saveSettings({ necessary: true, analytics: true, marketing: true });
  };

  const rejectAll = () => {
    saveSettings({ necessary: true, analytics: false, marketing: false });
  };

  const saveCustomSettings = () => {
    saveSettings(settings);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
          data-testid="cookie-banner"
        >
          <Card className="mx-auto max-w-4xl shadow-2xl border-2">
            {!showSettings ? (
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="flex-shrink-0 hidden md:flex">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Cookie className="w-7 h-7 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Cookie className="w-5 h-5 md:hidden" />
                      Wir verwenden Cookies
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Wir nutzen Cookies, um Ihnen die bestmögliche Erfahrung zu bieten. 
                      Einige sind für den Betrieb notwendig, während andere uns helfen, 
                      unsere Services zu verbessern und personalisierte Werbung anzuzeigen.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setShowSettings(true)}
                      className="order-3 sm:order-1"
                      data-testid="button-cookie-settings"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Einstellungen
                    </Button>
                    <Button
                      variant="outline"
                      onClick={rejectAll}
                      className="order-2"
                      data-testid="button-cookie-reject"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Ablehnen
                    </Button>
                    <Button
                      onClick={acceptAll}
                      className="order-1 sm:order-3"
                      data-testid="button-cookie-accept"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Alle akzeptieren
                    </Button>
                  </div>
                </div>
              </CardContent>
            ) : (
              <>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Cookie-Einstellungen</CardTitle>
                        <CardDescription>
                          Passen Sie Ihre Datenschutzeinstellungen an
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowSettings(false);
                        if (!getConsentSettings()) {
                          setShowBanner(true);
                        } else {
                          setShowBanner(false);
                        }
                      }}
                      data-testid="button-close-settings"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="space-y-1">
                        <p className="font-medium">Notwendige Cookies</p>
                        <p className="text-sm text-muted-foreground">
                          Erforderlich für die Grundfunktionen der Website (Login, Session)
                        </p>
                      </div>
                      <Switch checked={true} disabled className="opacity-50" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border hover-elevate transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">Analyse Cookies</p>
                        <p className="text-sm text-muted-foreground">
                          Helfen uns zu verstehen, wie Besucher mit der Website interagieren (Microsoft Clarity)
                        </p>
                      </div>
                      <Switch
                        checked={settings.analytics}
                        onCheckedChange={(checked) =>
                          setSettings((s) => ({ ...s, analytics: checked }))
                        }
                        data-testid="switch-analytics"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border hover-elevate transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">Marketing Cookies</p>
                        <p className="text-sm text-muted-foreground">
                          Ermöglichen personalisierte Werbung (Google Ads)
                        </p>
                      </div>
                      <Switch
                        checked={settings.marketing}
                        onCheckedChange={(checked) =>
                          setSettings((s) => ({ ...s, marketing: checked }))
                        }
                        data-testid="switch-marketing"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={rejectAll}
                      className="flex-1"
                      data-testid="button-reject-all"
                    >
                      Alle ablehnen
                    </Button>
                    <Button
                      onClick={saveCustomSettings}
                      className="flex-1"
                      data-testid="button-save-settings"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Auswahl speichern
                    </Button>
                    <Button
                      onClick={acceptAll}
                      className="flex-1"
                      data-testid="button-accept-all"
                    >
                      Alle akzeptieren
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
