import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Check, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Preise() {
  const [, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">14 Tage kostenlos testen</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="text-pricing-title">
            Einfache, faire Preise
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Wählen Sie den Plan, der zu Ihnen passt. Jederzeit kündbar, ohne versteckte Kosten.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as "monthly" | "yearly")}>
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="monthly" data-testid="tab-monthly">Monatlich</TabsTrigger>
                <TabsTrigger value="yearly" data-testid="tab-yearly">
                  Jährlich 
                  <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">-17%</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Starter Plan */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription>Perfekt für Einzelpersonen</CardDescription>
                <div className="flex items-baseline gap-2 mt-6">
                  <span className="text-5xl font-bold">
                    {billingPeriod === "monthly" ? "€6" : "€5"}
                  </span>
                  <span className="text-muted-foreground ml-2">/Monat</span>
                </div>
                {billingPeriod === "yearly" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Jährlich abgerechnet (€59,88/Jahr)
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>1 Benutzer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>100 Uploads/Monat</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>5 GB Speicherplatz</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>KI-Kategorisierung</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Smartphone-App & PWA</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>E-Mail-Eingang</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Standard-Support</span>
                  </li>
                </ul>
                <Button
                  className="w-full mt-6"
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  data-testid="button-pricing-starter"
                >
                  Kostenlos testen
                </Button>
              </CardContent>
            </Card>

            {/* Family Plus Plan */}
            <Card className="relative overflow-hidden border-2 border-primary">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold">
                Beliebt
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Family Plus</CardTitle>
                <CardDescription>Ideal für Familien & kleine Teams</CardDescription>
                <div className="flex items-baseline gap-2 mt-6">
                  <span className="text-5xl font-bold">
                    {billingPeriod === "monthly" ? "€12" : "€10"}
                  </span>
                  <span className="text-muted-foreground ml-2">/Monat</span>
                </div>
                {billingPeriod === "yearly" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Jährlich abgerechnet (€119,88/Jahr)
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>4 Benutzer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>500 Uploads/Monat</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>25 GB Speicherplatz</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>KI-Kategorisierung</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Smartphone-App & PWA</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Private & geteilte Ordner</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>E-Mail-Eingang</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Prioritäts-Support</span>
                  </li>
                </ul>
                <Button
                  className="w-full mt-6"
                  size="lg"
                  onClick={() => setLocation("/")}
                  data-testid="button-pricing-family-plus"
                >
                  Kostenlos testen
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Häufig gestellte Fragen
            </h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Wie funktioniert die 14-tägige Testphase?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Sie können MeineDokBox 14 Tage lang vollständig kostenlos testen – ohne Angabe von Zahlungsdaten. 
                    Nach Ablauf der Testphase können Sie sich für einen kostenpflichtigen Plan entscheiden oder Ihren 
                    Account einfach verfallen lassen.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kann ich jederzeit kündigen?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Ja, Sie können Ihr Abonnement jederzeit mit einem Klick kündigen. Es gibt keine Mindestlaufzeit 
                    und keine versteckten Kosten. Bei monatlicher Zahlung endet der Zugang zum Monatsende, bei 
                    jährlicher Zahlung zum Jahresende.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Was passiert, wenn ich mein Limit überschreite?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Wenn Sie Ihr monatliches Upload-Limit erreichen, können Sie bis zum nächsten Monat warten oder 
                    ein Upgrade auf einen höheren Plan durchführen. Ihr Speicherplatz bleibt erhalten – Sie können 
                    nur keine neuen Dokumente mehr hochladen. Wir senden Ihnen rechtzeitig eine Benachrichtigung.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Wie funktionieren Familien-Accounts?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Der Master-Account kann bis zu 3 weitere Familienmitglieder (Slaves) einladen. Jeder hat seinen 
                    eigenen Login und private Ordner. Uploads und Speicher werden gemeinsam genutzt. Sie können 
                    selektiv Dokumente miteinander teilen oder privat halten.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Welche Zahlungsmethoden akzeptieren Sie?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Wir akzeptieren Kreditkarten (Visa, Mastercard, American Express), SEPA-Lastschrift und PayPal. 
                    Die Abrechnung erfolgt sicher über unseren Zahlungspartner Stripe.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Was passiert mit meinen Daten, wenn ich kündige?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Sie können vor der Kündigung alle Ihre Dokumente herunterladen. Nach Ablauf Ihres Abonnements 
                    behalten wir Ihre Daten für 30 Tage, falls Sie Ihre Meinung ändern. Danach werden alle Daten 
                    endgültig und unwiderruflich gelöscht – DSGVO-konform.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gibt es Rabatte für gemeinnützige Organisationen?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Ja! Gemeinnützige Organisationen, Bildungseinrichtungen und NGOs erhalten 30% Rabatt. 
                    Kontaktieren Sie uns einfach unter service@meinedokbox.de mit Ihrem Nachweis.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Noch Fragen?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Kontaktieren Sie uns – wir helfen Ihnen gerne weiter!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setLocation("/kontakt")}
              variant="outline"
              data-testid="button-contact"
            >
              Kontakt aufnehmen
            </Button>
            <Button
              size="lg"
              onClick={() => setLocation("/")}
              data-testid="button-pricing-cta"
            >
              Jetzt kostenlos testen
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
