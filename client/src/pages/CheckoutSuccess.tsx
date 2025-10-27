import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan") || "solo";
    const period = params.get("period") || "monthly";

    const planPrices: Record<string, { monthly: number; yearly: number }> = {
      solo: { monthly: 4.99, yearly: 49.99 },
      family: { monthly: 7.99, yearly: 84.99 },
      familyPlus: { monthly: 11.99, yearly: 119.99 },
    };

    const value = planPrices[plan]?.[period as "monthly" | "yearly"] || 0;
    const currency = "EUR";

    // Google Ads Conversion Tracking
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "conversion", {
        send_to: "AW-CONVERSION_ID/CONVERSION_LABEL",
        value: value,
        currency: currency,
        transaction_id: `checkout_${Date.now()}`,
      });
    }

    // Facebook Pixel Purchase Event
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Purchase", {
        value: value,
        currency: currency,
        content_name: `${plan}_${period}`,
        content_type: "product",
      });
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setLocation("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-primary/20" data-testid="card-checkout-success">
        <CardHeader className="text-center pb-6 pt-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              <CheckCircle className="h-20 w-20 text-primary relative" />
            </div>
          </div>
          <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
            Zahlung erfolgreich!
          </CardTitle>
          <p className="text-xl text-muted-foreground">
            Vielen Dank für Ihr Vertrauen in MeineDokBox
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-12">
          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <p className="text-center text-lg">
              <strong>Ihr Abo ist jetzt aktiv!</strong>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Sie erhalten in Kürze eine Bestätigungs-E-Mail mit allen Details</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Ihre erweiterten Funktionen stehen ab sofort zur Verfügung</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Sie können Ihr Abo jederzeit in den Einstellungen verwalten</span>
              </li>
            </ul>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Sie werden in <strong className="text-primary">{countdown} Sekunden</strong> automatisch zum Dashboard weitergeleitet
            </p>
            <Button
              size="lg"
              className="w-full md:w-auto"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-goto-dashboard"
            >
              Jetzt zum Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
