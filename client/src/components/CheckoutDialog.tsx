import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, CreditCard } from "lucide-react";

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
}

interface BillingData {
  billingCompany?: string;
  billingStreet: string;
  billingPostalCode: string;
  billingCity: string;
  billingCountry: string;
}

export function CheckoutDialog({ open, onClose }: CheckoutDialogProps) {
  const { toast } = useToast();
  const [billingData, setBillingData] = useState<BillingData>({
    billingCompany: "",
    billingStreet: "",
    billingPostalCode: "",
    billingCity: "",
    billingCountry: "Deutschland",
  });

  const upgradeMutation = useMutation({
    mutationFn: async (data: BillingData) => {
      const res = await apiRequest("POST", "/api/subscription/upgrade", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      toast({
        title: "🎉 Willkommen bei Premium!",
        description: "Sie haben jetzt unbegrenzten Zugriff auf alle Features. Eine Rechnung wurde an Ihre E-Mail gesendet.",
        duration: 8000,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Upgrade fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upgradeMutation.mutate(billingData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-5 w-5 text-primary" />
            Premium upgraden
          </DialogTitle>
          <DialogDescription>
            Nur noch ein Schritt! Bitte geben Sie Ihre Rechnungsadresse ein.
          </DialogDescription>
        </DialogHeader>

        {/* Premium Plan Summary */}
        <div className="border rounded-lg p-4 bg-primary/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Premium Plan</h3>
            <div className="text-2xl font-bold">
              4,99 €
              <span className="text-sm font-normal text-muted-foreground">/Monat</span>
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Unbegrenzte Dokumente</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>KI-gestützte Kategorisierung</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>E-Mail-Upload mit persönlicher Adresse</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Zugriff teilen (1 weitere Person)</span>
            </li>
          </ul>
        </div>

        {/* Billing Address Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="billingCompany">Firma (optional)</Label>
            <Input
              id="billingCompany"
              placeholder="z.B. Musterfirma GmbH"
              value={billingData.billingCompany}
              onChange={(e) => setBillingData({ ...billingData, billingCompany: e.target.value })}
              data-testid="input-billing-company"
            />
          </div>

          <div>
            <Label htmlFor="billingStreet">Straße und Hausnummer *</Label>
            <Input
              id="billingStreet"
              placeholder="z.B. Musterstraße 123"
              value={billingData.billingStreet}
              onChange={(e) => setBillingData({ ...billingData, billingStreet: e.target.value })}
              required
              data-testid="input-billing-street"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="billingPostalCode">PLZ *</Label>
              <Input
                id="billingPostalCode"
                placeholder="12345"
                value={billingData.billingPostalCode}
                onChange={(e) => setBillingData({ ...billingData, billingPostalCode: e.target.value })}
                required
                data-testid="input-billing-postal-code"
              />
            </div>

            <div>
              <Label htmlFor="billingCity">Stadt *</Label>
              <Input
                id="billingCity"
                placeholder="Berlin"
                value={billingData.billingCity}
                onChange={(e) => setBillingData({ ...billingData, billingCity: e.target.value })}
                required
                data-testid="input-billing-city"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="billingCountry">Land</Label>
            <Input
              id="billingCountry"
              value={billingData.billingCountry}
              onChange={(e) => setBillingData({ ...billingData, billingCountry: e.target.value })}
              required
              data-testid="input-billing-country"
            />
          </div>

          <div className="pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Nach dem Upgrade erhalten Sie eine Rechnung per E-Mail.
              Sie können jederzeit monatlich kündigen.
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                data-testid="button-checkout-cancel"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={upgradeMutation.isPending}
                data-testid="button-checkout-upgrade"
              >
                {upgradeMutation.isPending ? "Wird aktiviert..." : "Jetzt Premium upgraden (4,99 €/Monat)"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
