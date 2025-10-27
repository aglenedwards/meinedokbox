import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  selectedPlan?: "solo" | "family" | "family-plus";
  selectedPeriod?: "monthly" | "yearly";
}

const planDetails = {
  solo: {
    name: "Solo",
    monthlyPrice: 4.99,
    yearlyPrice: 47.88,
    features: [
      "1 Benutzer",
      "2 GB Speicherplatz",
      "KI-Kategorisierung",
      "Smartphone-App & PWA",
      "E-Mail-Eingang",
    ],
  },
  family: {
    name: "Family",
    monthlyPrice: 8.39,
    yearlyPrice: 83.88,
    features: [
      "2 Benutzer",
      "Unbegrenzter Speicherplatz",
      "Unbegrenzte Dokumente",
      "KI-Kategorisierung",
      "Smartphone-App & PWA",
      "Private & geteilte Ordner",
      "E-Mail-Eingang",
    ],
  },
  "family-plus": {
    name: "Family Plus",
    monthlyPrice: 11.99,
    yearlyPrice: 119.88,
    features: [
      "4 Benutzer",
      "Unbegrenzter Speicherplatz",
      "Unbegrenzte Dokumente",
      "KI-Kategorisierung",
      "Smartphone-App & PWA",
      "Private & geteilte Ordner",
      "E-Mail-Eingang",
      "Prioritäts-Support",
    ],
  },
};

export function CheckoutDialog({ open, onClose, selectedPlan = "family", selectedPeriod = "yearly" }: CheckoutDialogProps) {
  const { toast } = useToast();
  const [plan, setPlan] = useState<"solo" | "family" | "family-plus">(selectedPlan);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(selectedPeriod);

  const currentPlan = planDetails[plan];
  const currentPrice = billingPeriod === "monthly" ? currentPlan.monthlyPrice : currentPlan.yearlyPrice;
  const displayPrice = billingPeriod === "monthly" 
    ? `${currentPrice.toFixed(2)} €/Monat`
    : `${currentPrice.toFixed(2)} €/Jahr (${(currentPrice / 12).toFixed(2)} €/Monat)`;

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/create-checkout-session", {
        plan,
        period: billingPeriod,
      });
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout fehlgeschlagen",
        description: "Die Checkout-Session konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = () => {
    checkoutMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-5 w-5 text-primary" />
            {currentPlan.name} upgraden
          </DialogTitle>
          <DialogDescription>
            Schließen Sie Ihr Upgrade in wenigen Schritten ab. Zahlung über Stripe (Kreditkarte, SEPA-Lastschrift).
          </DialogDescription>
        </DialogHeader>

        {/* Plan Selection */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tarif</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as any)}>
                <SelectTrigger data-testid="select-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="family-plus">Family Plus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Abrechnungszeitraum</Label>
              <Select value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as any)}>
                <SelectTrigger data-testid="select-billing-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="yearly">Jährlich (spare ~20%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Plan Summary */}
          <div className="border rounded-lg p-4 bg-primary/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{currentPlan.name} Plan</h3>
              <div className="text-2xl font-bold">
                {displayPrice}
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              {currentPlan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tax & Payment Info */}
          <div className="border rounded-lg p-4 bg-muted/30 space-y-2 text-sm">
            <p className="font-medium">Zahlungsinformationen:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Alle Preise inkl. 19% deutscher MwSt.</li>
              <li>✓ Sichere Zahlung über Stripe</li>
              <li>✓ Kreditkarte oder SEPA-Lastschrift</li>
              <li>✓ Jederzeit kündbar</li>
              <li>✓ Rechnung per E-Mail nach Zahlung</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={checkoutMutation.isPending}
            data-testid="button-checkout-cancel"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleCheckout}
            className="flex-1"
            disabled={checkoutMutation.isPending}
            data-testid="button-checkout-upgrade"
          >
            {checkoutMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Lädt...
              </>
            ) : (
              `Weiter zur Zahlung (${displayPrice})`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
