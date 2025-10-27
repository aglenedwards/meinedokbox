import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Check, Sparkles, ArrowRight, Users, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Preise() {
  const [, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 hero-premium-bg">
        {/* Premium Mesh Gradient Background */}
        <div className="absolute inset-0 hero-mesh-gradient" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/80 backdrop-blur-sm mb-8 shadow-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">14 Tage kostenlos testen – keine Kreditkarte nötig</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight" data-testid="text-pricing-title">
              Einfache, 
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                faire Preise
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Wählen Sie den Plan, der zu Ihnen passt. Jederzeit kündbar, ohne versteckte Kosten.
            </p>

            {/* Pricing Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
                <Sparkles className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">14 Tage</div>
                <div className="text-sm text-muted-foreground text-center">Kostenlos testen</div>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
                <Users className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">Bis 4</div>
                <div className="text-sm text-muted-foreground text-center">Familienmitglieder</div>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border col-span-2 md:col-span-1">
                <Zap className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">Jederzeit</div>
                <div className="text-sm text-muted-foreground text-center">Kündbar</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 section-premium-subtle">
        <div className="container mx-auto px-4">
          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover-elevate"
              }`}
              data-testid="button-billing-monthly"
            >
              Monatlich
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover-elevate"
              }`}
              data-testid="button-billing-yearly"
            >
              Jährlich
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary-foreground/20">
                Spare 20%
              </span>
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Solo Plan */}
            <Card className="card-premium hover-elevate" data-testid="card-pricing-solo">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl">Solo</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    €{billingPeriod === "monthly" ? "4,99" : "4,17"}
                  </span>
                  <span className="text-muted-foreground ml-2">/Monat</span>
                </div>
                {billingPeriod === "yearly" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Jährlich abgerechnet (€49,99/Jahr)
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
                    <span>50 Uploads/Monat</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>2 GB Speicherplatz</span>
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
                </ul>
                <Button
                  className="w-full mt-6"
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  data-testid="button-pricing-solo"
                >
                  Kostenlos testen
                </Button>
              </CardContent>
            </Card>

            {/* Family Plan - Hervorgehoben */}
            <Card className="border-2 border-primary shadow-2xl relative md:scale-105 card-premium hover-elevate" data-testid="card-pricing-family">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Empfohlen
                </span>
              </div>
              <CardHeader className="text-center pb-6 pt-8">
                <CardTitle className="text-2xl">Family</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold">
                    €{billingPeriod === "monthly" ? "7,99" : "7,08"}
                  </span>
                  <span className="text-muted-foreground ml-2">/Monat</span>
                </div>
                {billingPeriod === "yearly" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Jährlich abgerechnet (€84,99/Jahr)
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>2 Benutzer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>200 Uploads/Monat</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>10 GB Speicherplatz</span>
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
                </ul>
                <Button
                  className="w-full mt-6"
                  size="lg"
                  onClick={() => setLocation("/")}
                  data-testid="button-pricing-family"
                >
                  Jetzt 14 Tage kostenlos testen
                </Button>
              </CardContent>
            </Card>

            {/* Family Plus Plan */}
            <Card className="card-premium hover-elevate" data-testid="card-pricing-family-plus">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl">Family Plus</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    €{billingPeriod === "monthly" ? "11,99" : "10,00"}
                  </span>
                  <span className="text-muted-foreground ml-2">/Monat</span>
                </div>
                {billingPeriod === "yearly" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Jährlich abgerechnet (€119,99/Jahr)
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
                  variant="outline"
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
      <section className="py-24 bg-muted/30 section-premium-subtle">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Häufig gestellte Fragen
            </h2>
            
            <div className="space-y-6">
              <Card className="card-premium hover-elevate">
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

              <Card className="card-premium hover-elevate">
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

              <Card className="card-premium hover-elevate">
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

              <Card className="card-premium hover-elevate">
                <CardHeader>
                  <CardTitle>Wie funktionieren Familien-Accounts?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Der Master-Account kann bis zu 3 weitere Familienmitglieder einladen. Jeder hat seinen 
                    eigenen Login und private Ordner. Uploads und Speicher werden gemeinsam genutzt. Sie können 
                    selektiv Dokumente miteinander teilen oder privat halten.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-premium hover-elevate">
                <CardHeader>
                  <CardTitle>Welche Zahlungsmethoden akzeptieren Sie?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Wir akzeptieren Kreditkarten (Visa, Mastercard, American Express) und PayPal. 
                    Die Abrechnung erfolgt sicher über unseren Zahlungspartner Stripe.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-premium hover-elevate">
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

              <Card className="card-premium hover-elevate">
                <CardHeader>
                  <CardTitle>Gibt es Rabatte für gemeinnützige Organisationen?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Ja! Gemeinnützige Organisationen, Bildungseinrichtungen und NGOs erhalten einen Rabatt. 
                    Kontaktieren Sie uns einfach unter service@meinedokbox.de mit Ihrem Nachweis.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 section-premium-subtle">
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
