import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Camera, Mail, Sparkles, ArrowRight, Check, Cloud, Zap, Shield, Brain, Menu } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export default function DokumenteApp() {
  useEffect(() => {
    document.title = "Dokumente digitalisieren App | Software für private Dokumente | MeineDokBox";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Dokumente digitalisieren mit der MeineDokBox App: Die Software für private Dokumente. Kostenlos testen, einfach scannen, automatisch organisieren.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-6 py-4 md:py-5 flex items-center justify-between gap-6">
          <Link href="/">
            <div className="flex items-center flex-shrink-0 hover-elevate active-elevate-2 px-3 py-2 rounded-lg transition-all cursor-pointer">
              <img src={logoImage} alt="MeineDokBox" className="h-12 md:h-14 lg:h-16 w-auto" data-testid="img-logo" />
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link href="/funktionen">
              <Button variant="ghost" size="default" className="text-base font-medium px-5" data-testid="nav-funktionen">
                Funktionen
              </Button>
            </Link>
            <Link href="/sicherheit">
              <Button variant="ghost" size="default" className="text-base font-medium px-5" data-testid="nav-sicherheit">
                Sicherheit
              </Button>
            </Link>
            <Link href="/preise">
              <Button variant="ghost" size="default" className="text-base font-medium px-5" data-testid="nav-preise">
                Preise
              </Button>
            </Link>
            <Link href="/ueber-uns">
              <Button variant="ghost" size="default" className="text-base font-medium px-5" data-testid="nav-ueber-uns">
                Über uns
              </Button>
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <Link href="/">
              <Button size="default" className="text-base font-semibold px-6 shadow-lg hover:shadow-xl transition-shadow" data-testid="button-header-start">
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <Link href="/funktionen">
                  <Button variant="ghost" className="w-full justify-start text-lg">Funktionen</Button>
                </Link>
                <Link href="/sicherheit">
                  <Button variant="ghost" className="w-full justify-start text-lg">Sicherheit</Button>
                </Link>
                <Link href="/preise">
                  <Button variant="ghost" className="w-full justify-start text-lg">Preise</Button>
                </Link>
                <Link href="/ueber-uns">
                  <Button variant="ghost" className="w-full justify-start text-lg">Über uns</Button>
                </Link>
                <div className="border-t pt-4 mt-2">
                  <Link href="/">
                    <Button className="w-full text-lg">Kostenlos starten</Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <section className="py-20 md:py-28 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/80 backdrop-blur-sm mb-8 shadow-lg">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Web-App für alle Geräte</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight" data-testid="text-hero-title">
              Dokumente digitalisieren –
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                die App für Ihre privaten Unterlagen
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              MeineDokBox ist Ihre Software zum Digitalisieren privater Dokumente – 
              direkt im Browser, ohne Installation. Scannen, organisieren, finden.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/">
                <Button size="lg" className="text-lg px-8 py-6" data-testid="button-cta-primary">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Kostenlos testen
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              So funktioniert die MeineDokBox-App
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Dokumente digitalisieren – privat, sicher und vollautomatisch
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg" data-testid="card-feature-camera">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smartphone-Kamera</h3>
                <p className="text-muted-foreground">
                  Fotografieren Sie Dokumente direkt mit Ihrem Handy. Die App optimiert das Bild automatisch.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg" data-testid="card-feature-email">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">E-Mail-Eingang</h3>
                <p className="text-muted-foreground">
                  Leiten Sie Rechnungen an Ihre persönliche Adresse weiter – automatische Verarbeitung inklusive.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg" data-testid="card-feature-ai">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">KI-Kategorisierung</h3>
                <p className="text-muted-foreground">
                  Die KI erkennt Dokumententyp, Absender und Betrag – vollautomatisch.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Dokumente digitalisieren Software – kostenlos testen
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Im Vergleich zu anderen kostenlosen Lösungen bietet MeineDokBox entscheidende Vorteile 
                  für die Digitalisierung Ihrer privaten Dokumente:
                </p>
                
                <div className="space-y-4">
                  {[
                    "KI-gestützte automatische Kategorisierung",
                    "Deutsche Server – DSGVO-konform",
                    "Keine Werbung, kein Datenverkauf",
                    "Persönliche E-Mail-Adresse für Dokumente",
                    "Familien-Sharing mit privaten Bereichen",
                    "7 Tage kostenlos testen ohne Kreditkarte"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Cloud className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Web-App im Browser</h3>
                        <p className="text-sm text-muted-foreground">Keine Installation nötig</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Blitzschnelle Verarbeitung</h3>
                        <p className="text-sm text-muted-foreground">Dokumente in Sekunden analysiert</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Maximale Sicherheit</h3>
                        <p className="text-sm text-muted-foreground">Verschlüsselt & privat</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Faire Preise für Ihre Dokumenten-Software
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Starten Sie mit der kostenlosen Testphase – ohne Verpflichtung
            </p>

            <div className="grid sm:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-8 pb-8 text-center">
                  <h3 className="font-semibold text-lg mb-2">Solo</h3>
                  <div className="text-3xl font-bold mb-2">ab 4,17 Euro</div>
                  <p className="text-sm text-muted-foreground">pro Monat</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg ring-2 ring-primary">
                <CardContent className="pt-8 pb-8 text-center">
                  <h3 className="font-semibold text-lg mb-2">Family</h3>
                  <div className="text-3xl font-bold mb-2">ab 6,67 Euro</div>
                  <p className="text-sm text-muted-foreground">pro Monat</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="pt-8 pb-8 text-center">
                  <h3 className="font-semibold text-lg mb-2">Family Plus</h3>
                  <div className="text-3xl font-bold mb-2">ab 10,00 Euro</div>
                  <p className="text-sm text-muted-foreground">pro Monat</p>
                </CardContent>
              </Card>
            </div>

            <Link href="/preise">
              <Button variant="ghost" size="lg" className="mt-8" data-testid="link-pricing">
                Alle Preise ansehen
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Jetzt Dokumente digitalisieren – mit der MeineDokBox App
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            7 Tage kostenlos testen. Keine Kreditkarte erforderlich.
          </p>
          <Link href="/">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" data-testid="button-cta-final">
              <Sparkles className="mr-2 h-5 w-5" />
              Jetzt kostenlos starten
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
