import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Mail, MailX } from "lucide-react";

export default function Unsubscribe() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "resubscribed">("loading");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("uid");
    setUid(userId);

    if (!userId) {
      setStatus("error");
      return;
    }

    fetch(`/api/unsubscribe?uid=${encodeURIComponent(userId)}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setMaskedEmail(data.email || "");
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  const handleResubscribe = async () => {
    if (!uid) return;
    try {
      const res = await fetch("/api/resubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      if (res.ok) {
        setStatus("resubscribed");
      }
    } catch (e) {
      console.error("Resubscribe error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          {status === "loading" && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground">Wird verarbeitet...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 w-fit mx-auto">
                <MailX className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold mb-2" data-testid="text-unsubscribe-title">Erfolgreich abgemeldet</h1>
                {maskedEmail && (
                  <p className="text-muted-foreground text-sm" data-testid="text-unsubscribe-email">
                    {maskedEmail}
                  </p>
                )}
              </div>
              <p className="text-muted-foreground">
                Du erhaeltst keine weiteren Marketing-E-Mails von MeineDokBox. 
                Wichtige E-Mails zu deinem Konto (z.B. Passwort-Reset) erhaeltst du weiterhin.
              </p>
              <div className="pt-4 space-y-3">
                <Button 
                  variant="outline" 
                  onClick={handleResubscribe}
                  className="w-full"
                  data-testid="button-resubscribe"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Doch wieder anmelden
                </Button>
                <a href="/" className="block">
                  <Button variant="ghost" className="w-full" data-testid="link-home">
                    Zur Startseite
                  </Button>
                </a>
              </div>
            </>
          )}

          {status === "resubscribed" && (
            <>
              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 w-fit mx-auto">
                <CheckCircle className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold mb-2">Wieder angemeldet!</h1>
              </div>
              <p className="text-muted-foreground">
                Du erhaeltst wieder Benachrichtigungen und Tipps von MeineDokBox.
              </p>
              <a href="/" className="block pt-4">
                <Button className="w-full" data-testid="link-home-resubscribed">
                  Zur Startseite
                </Button>
              </a>
            </>
          )}

          {status === "error" && (
            <>
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 w-fit mx-auto">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold mb-2">Fehler</h1>
              </div>
              <p className="text-muted-foreground">
                Der Abmelde-Link ist ungueltig oder abgelaufen. 
                Bitte kontaktiere uns unter service@meinedokbox.de.
              </p>
              <a href="/" className="block pt-4">
                <Button variant="outline" className="w-full" data-testid="link-home-error">
                  Zur Startseite
                </Button>
              </a>
            </>
          )}

          <p className="text-xs text-muted-foreground pt-4 border-t">
            MeineDokBox - Intelligente Dokumentenverwaltung
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
