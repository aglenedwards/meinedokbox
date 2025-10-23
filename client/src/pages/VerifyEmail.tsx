import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/verify-email");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      // Get token from URL query params
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Ungültiger Verifizierungslink");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "E-Mail-Adresse erfolgreich bestätigt!");
        } else {
          setStatus("error");
          setMessage(data.message || "Verifizierung fehlgeschlagen");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center">
          <img src={logoImage} alt="MeineDokBox" className="h-12 md:h-16 w-auto" data-testid="img-logo" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {status === "loading" && (
              <>
                <div className="flex justify-center mb-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <CardTitle>E-Mail-Adresse wird verifiziert...</CardTitle>
                <CardDescription>
                  Bitte warten Sie einen Moment
                </CardDescription>
              </>
            )}

            {status === "success" && (
              <>
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-green-500" data-testid="icon-success" />
                </div>
                <CardTitle className="text-green-700">E-Mail-Adresse bestätigt!</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center mb-4">
                  <XCircle className="h-12 w-12 text-destructive" data-testid="icon-error" />
                </div>
                <CardTitle className="text-destructive">Verifizierung fehlgeschlagen</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent>
            {status === "success" && (
              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground">
                  Sie können sich jetzt mit Ihrer E-Mail-Adresse und Ihrem Passwort anmelden.
                </p>
                <Button
                  onClick={() => setLocation("/")}
                  className="w-full"
                  data-testid="button-go-to-login"
                >
                  Zur Anmeldung
                </Button>
              </div>
            )}

            {status === "error" && (
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="w-full"
                data-testid="button-back-to-home"
              >
                Zurück zur Startseite
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
