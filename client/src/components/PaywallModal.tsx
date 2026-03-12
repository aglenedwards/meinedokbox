import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Bell, ThumbsUp, Check, Loader2, PackageOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface PaywallModalProps {
  open: boolean;
  onClose?: () => void;
}

const PLANS = [
  {
    id: "solo" as const,
    label: "Solo",
    yearlyPrice: 59.99,
    monthlyEquiv: 5.00,
    uploads: "50 Dokumente/Monat",
    storage: "2 GB Speicher",
    users: "1 Person",
    emailInbound: true,
    migrationUploads: "500 Dokumente Erstimport",
  },
  {
    id: "family" as const,
    label: "Familie",
    yearlyPrice: 99.99,
    monthlyEquiv: 8.33,
    uploads: "200 Dokumente/Monat",
    storage: "10 GB Speicher",
    users: "Bis 2 Personen",
    emailInbound: true,
    migrationUploads: "1.000 Dokumente Erstimport",
  },
  {
    id: "family-plus" as const,
    label: "Familie Pro",
    yearlyPrice: 139.99,
    monthlyEquiv: 11.67,
    uploads: "500 Dokumente/Monat",
    storage: "25 GB Speicher",
    users: "Bis 4 Personen",
    emailInbound: true,
    migrationUploads: "2.000 Dokumente Erstimport",
  },
];

function getTrialEndDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function PaywallModal({ open, onClose }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"solo" | "family" | "family-plus">("family");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const plan = PLANS.find(p => p.id === selectedPlan)!;
  const trialEndDate = getTrialEndDate();

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/user/welcome-modal-seen", {});
      const response = await apiRequest("POST", "/api/stripe/create-checkout-session", {
        plan: selectedPlan,
        period: "yearly",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Keine Checkout-URL erhalten");
      }
    } catch (error) {
      toast({
        title: "Fehler beim Starten",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose ? (isOpen) => { if (!isOpen) onClose(); } : undefined} modal>
      <DialogContent
        className="sm:max-w-[480px] p-0 gap-0 overflow-hidden"
        onInteractOutside={onClose ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={onClose ? undefined : (e) => e.preventDefault()}
        hideCloseButton={!onClose}
      >
        <DialogTitle className="sr-only">Testphase starten</DialogTitle>

        {/* Timeline Header */}
        <div className="bg-muted/40 border-b px-6 py-5">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            So funktioniert die Testphase
          </p>
          <div className="space-y-3">
            <TimelineStep
              icon={<Lock className="h-4 w-4" />}
              label="Heute"
              description="Vollzugriff auf alle Funktionen – sofort nutzbar"
              active
            />
            <TimelineStep
              icon={<Bell className="h-4 w-4" />}
              label="In 5 Tagen"
              description="Erinnerung per E-Mail vor Ende der Testphase"
            />
            <TimelineStep
              icon={<ThumbsUp className="h-4 w-4" />}
              label="In 7 Tagen"
              description="Erste Abbuchung – nur wenn nicht vorher gekündigt"
              last
            />
          </div>
        </div>

        {/* Plan Tabs */}
        <div className="px-6 pt-5">
          <div className="flex rounded-lg border bg-muted/30 p-1 gap-1 mb-4">
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                  selectedPlan === p.id
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`tab-plan-${p.id}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Plan Features */}
          <div className="space-y-1.5 mb-4">
            {[plan.users, plan.uploads, plan.storage, ...(plan.emailInbound ? ["Dokumente per E-Mail"] : [])].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PackageOpen className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
              <span className="font-medium text-foreground">{plan.migrationUploads}</span>
              <span className="text-xs text-muted-foreground">— einmalig für Ihre bestehende Ablage</span>
            </div>
          </div>
        </div>

        {/* Pricing Panel */}
        <div className="mx-6 mb-5 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Kostenlose Testphase aktiviert</span>
            <Badge variant="secondary" className="text-xs">
              <Check className="h-3 w-3 mr-1" />
              7 Tage gratis
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full border-2 border-primary" />
                <span className="text-sm text-muted-foreground">Heute fällig</span>
              </div>
              <span className="text-sm font-semibold">0,00 €</span>
            </div>
            <div className="ml-1 border-l-2 border-dashed border-muted-foreground/30 h-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Fällig: {trialEndDate}</span>
              </div>
              <span className="text-sm font-semibold">
                {plan.yearlyPrice.toFixed(2).replace(".", ",")} €/Jahr
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Entspricht ca. {plan.monthlyEquiv.toFixed(2).replace(".", ",")} €/Monat · inkl. 19% MwSt.
          </p>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <Button
            className="w-full"
            size="lg"
            onClick={handleStartTrial}
            disabled={isLoading}
            data-testid="button-start-paywall-trial"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Weiterleitung zu Stripe…
              </>
            ) : (
              "Kostenlose Testphase starten"
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3">
            Sichere Zahlung über Stripe · Kreditkarte oder SEPA-Lastschrift
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TimelineStepProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  active?: boolean;
  last?: boolean;
}

function TimelineStep({ icon, label, description, active, last }: TimelineStepProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground border"
        }`}>
          {icon}
        </div>
        {!last && <div className="w-px flex-1 bg-border mt-1 min-h-[8px]" />}
      </div>
      <div className="pb-3 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${active ? "text-foreground" : "text-muted-foreground"}`}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
