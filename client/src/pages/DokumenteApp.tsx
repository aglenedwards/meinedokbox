import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Camera, Mail, Sparkles, ArrowRight, Check, Cloud, Zap, Shield, Brain, Menu, Star, X, Quote, Users, Clock, Lock, Search, FolderOpen } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export default function DokumenteApp() {
  useEffect(() => {
    document.title = "Dokumente digitalisieren App | Software für private Dokumente | MeineDokBox";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Dokumente digitalisieren mit der MeineDokBox App: Die Software für private Dokumente. Kostenlos testen, einfach scannen, automatisch organisieren. Dokumente digitalisieren software privat.");
    }
  }, []);

  const comparisonFeatures = [
    { feature: "KI-Kategorisierung", meinedokbox: true, free: false },
    { feature: "Deutsche Server (DSGVO)", meinedokbox: true, free: false },
    { feature: "Keine Werbung", meinedokbox: true, free: false },
    { feature: "Familien-Sharing", meinedokbox: true, free: false },
    { feature: "Volltextsuche", meinedokbox: true, free: "teilweise" },
    { feature: "E-Mail-Import", meinedokbox: true, free: false },
    { feature: "Zahlungserinnerungen", meinedokbox: true, free: false },
    { feature: "Offline-Zugriff", meinedokbox: true, free: "teilweise" },
    { feature: "Automatische Backups", meinedokbox: true, free: false },
    { feature: "Support auf Deutsch", meinedokbox: true, free: false },
  ];

  const faqs = [
    {
      question: "Ist MeineDokBox wirklich kostenlos testbar?",
      answer: "Ja! Sie können MeineDokBox 7 Tage lang vollständig kostenlos testen – ohne Kreditkarte, ohne versteckte Kosten. Nach der Testphase entscheiden Sie, ob Sie ein Abo abschließen möchten. Dokumente digitalisieren war noch nie so risikofrei."
    },
    {
      question: "Funktioniert die App auf meinem Smartphone?",
      answer: "MeineDokBox ist eine Web-App, die auf allen modernen Smartphones, Tablets und Computern funktioniert – egal ob iPhone, Android, Windows oder Mac. Keine Installation im App Store nötig, einfach im Browser öffnen und Dokumente digitalisieren."
    },
    {
      question: "Wie unterscheidet sich MeineDokBox von kostenlosen Scanner-Apps?",
      answer: "Kostenlose Scanner-Apps digitalisieren nur – sie organisieren nicht. MeineDokBox bietet KI-gestützte automatische Kategorisierung, Volltextsuche, Zahlungserinnerungen und sichere Speicherung auf deutschen Servern. Außerdem: keine Werbung, kein Datenverkauf."
    },
    {
      question: "Kann ich meine bereits digitalisierten Dokumente importieren?",
      answer: "Ja! Sie können bestehende PDFs und Bilder einfach hochladen. Unsere KI analysiert und kategorisiert auch bereits digitalisierte Dokumente automatisch. So haben Sie alles an einem Ort in Ihrer Dokumente digitalisieren Software."
    },
    {
      question: "Wie sicher ist die Dokumente digitalisieren Software?",
      answer: "Maximale Sicherheit: Alle Daten werden verschlüsselt auf deutschen Servern (IONOS Frankfurt) gespeichert. Wir sind vollständig DSGVO-konform und verkaufen niemals Ihre Daten. Ihre privaten Dokumente bleiben privat."
    },
    {
      question: "Kann meine Familie die App mitnutzen?",
      answer: "Mit unseren Family-Tarifen können bis zu 5 Familienmitglieder die App nutzen. Jeder hat seinen eigenen privaten Bereich, und Sie können Dokumente gezielt teilen – perfekt für Haushalte, die gemeinsam Dokumente digitalisieren möchten."
    }
  ];

  const testimonials = [
    {
      name: "Petra S.",
      role: "Hausfrau, 45",
      text: "Endlich eine App, die wirklich funktioniert! Die automatische Sortierung ist Gold wert. Ich spare jede Woche Stunden beim Dokumente digitalisieren.",
      rating: 5
    },
    {
      name: "Markus T.",
      role: "IT-Manager, 52",
      text: "Als Technik-Fan habe ich viele Apps getestet. MeineDokBox ist die beste Dokumente digitalisieren Software für Privatanwender. Endlich deutsche Server!",
      rating: 5
    },
    {
      name: "Anna L.",
      role: "Studentin, 24",
      text: "Super einfach zu bedienen und der Preis ist fair. Nutze die App für alle meine Uni-Unterlagen und Rechnungen. Dokumente digitalisieren privat leicht gemacht!",
      rating: 5
    }
  ];

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

      <section className="py-20 md:py-28 bg-gradient-to-b from-muted/50 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 relative">
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
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              MeineDokBox ist Ihre Software zum Digitalisieren privater Dokumente – 
              direkt im Browser, ohne Installation. Die intelligenteste Dokumente digitalisieren App auf dem Markt.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Keine Installation</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>KI-gestützt</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>7 Tage kostenlos</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/">
                <Button size="lg" className="text-lg px-8 py-6 shadow-xl" data-testid="button-cta-primary">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Kostenlos testen
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/preise">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Preise ansehen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">&lt;3s</div>
              <div className="text-sm text-muted-foreground">Dokument analysiert</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">15+</div>
              <div className="text-sm text-muted-foreground">Kategorien erkannt</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">DSGVO-konform</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">0 Euro</div>
              <div className="text-sm text-muted-foreground">Testphase</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              So funktioniert die Dokumente digitalisieren App
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Drei Wege, Ihre Dokumente zu erfassen – alle führen zur perfekten Organisation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-feature-camera">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smartphone-Kamera</h3>
                <p className="text-muted-foreground">
                  Fotografieren Sie Dokumente direkt mit Ihrem Handy. Die App optimiert Helligkeit, 
                  Kontrast und Perspektive automatisch. Dokumente digitalisieren privat in Sekunden.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-feature-email">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">E-Mail-Import</h3>
                <p className="text-muted-foreground">
                  Leiten Sie digitale Rechnungen an Ihre persönliche MeineDokBox-Adresse weiter. 
                  Die Software verarbeitet sie automatisch – ideal für Online-Bestellungen.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-feature-ai">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">KI-Kategorisierung</h3>
                <p className="text-muted-foreground">
                  Unsere KI erkennt Dokumententyp, Absender, Datum und Betrag – vollautomatisch. 
                  Die intelligenteste Dokumente digitalisieren Software für Privatanwender.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Volltextsuche</h3>
                      <p className="text-sm text-muted-foreground">Jedes Wort in jedem Dokument durchsuchbar</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">15+ Kategorien</h3>
                      <p className="text-sm text-muted-foreground">Automatische Sortierung in Ordner</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              MeineDokBox vs. kostenlose Alternativen
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Warum unsere Dokumente digitalisieren Software privat besser ist als kostenlose Lösungen
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/50 font-semibold text-center py-4 border-b">
                <div className="text-left pl-6">Funktion</div>
                <div className="text-primary">MeineDokBox</div>
                <div className="text-muted-foreground">Kostenlose Apps</div>
              </div>
              <CardContent className="p-0">
                {comparisonFeatures.map((item, index) => (
                  <div key={index} className={`grid grid-cols-3 py-4 text-center items-center ${index !== comparisonFeatures.length - 1 ? 'border-b' : ''}`}>
                    <div className="text-left pl-6 font-medium">{item.feature}</div>
                    <div>
                      <Check className="h-5 w-5 text-primary mx-auto" />
                    </div>
                    <div>
                      {item.free === true ? (
                        <Check className="h-5 w-5 text-muted-foreground mx-auto" />
                      ) : item.free === "teilweise" ? (
                        <span className="text-xs text-muted-foreground">teilweise</span>
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <p className="text-center text-muted-foreground mt-8">
              Kostenlose Scanner-Apps digitalisieren nur – sie organisieren nicht. MeineDokBox ist die komplette Lösung 
              für Ihre private Dokumentenverwaltung. Dokumente digitalisieren software privat kostenlos testen!
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Dokumente digitalisieren Software – mehr als nur scannen
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  MeineDokBox ist keine einfache Scanner-App. Es ist Ihre komplette Lösung für die private 
                  Dokumentenverwaltung. Vom Fotografieren bis zur Steuererklärung – alles an einem Ort.
                </p>
                
                <div className="space-y-4">
                  {[
                    "KI-gestützte automatische Kategorisierung in 15+ Ordner",
                    "Deutsche Server – 100% DSGVO-konform",
                    "Keine Werbung, kein Tracking, kein Datenverkauf",
                    "Persönliche E-Mail-Adresse für digitale Rechnungen",
                    "Familien-Sharing mit privaten Bereichen",
                    "Zahlungserinnerungen für offene Rechnungen",
                    "Volltextsuche über alle Dokumente",
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
                        <p className="text-sm text-muted-foreground">Keine Installation, sofort startklar</p>
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
                        <p className="text-sm text-muted-foreground">Dokumente in unter 3 Sekunden analysiert</p>
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
                        <p className="text-sm text-muted-foreground">Verschlüsselt, privat, DSGVO-konform</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Familien-Sharing</h3>
                        <p className="text-sm text-muted-foreground">Bis zu 5 Nutzer, private Bereiche</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Das sagen unsere Nutzer
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tausende nutzen MeineDokBox als ihre Dokumente digitalisieren App
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-8 pb-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Faire Preise für Ihre Dokumente digitalisieren Software
            </h2>
            <p className="text-lg text-muted-foreground">
              Starten Sie mit der kostenlosen Testphase – danach ab 4,17 Euro monatlich
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8 text-center">
                <h3 className="font-semibold text-lg mb-2">Solo</h3>
                <div className="text-4xl font-bold mb-2">4,17 Euro</div>
                <p className="text-sm text-muted-foreground mb-6">pro Monat bei Jahreszahlung</p>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 1 Benutzer</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 50 Dokumente/Monat</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 5 GB Speicher</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl ring-2 ring-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Beliebt
              </div>
              <CardContent className="pt-8 pb-8 text-center">
                <h3 className="font-semibold text-lg mb-2">Family</h3>
                <div className="text-4xl font-bold mb-2">6,67 Euro</div>
                <p className="text-sm text-muted-foreground mb-6">pro Monat bei Jahreszahlung</p>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Bis zu 3 Benutzer</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 100 Dokumente/Monat</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 15 GB Speicher</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8 text-center">
                <h3 className="font-semibold text-lg mb-2">Family Plus</h3>
                <div className="text-4xl font-bold mb-2">10,00 Euro</div>
                <p className="text-sm text-muted-foreground mb-6">pro Monat bei Jahreszahlung</p>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Bis zu 5 Benutzer</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 200 Dokumente/Monat</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 30 GB Speicher</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/preise">
              <Button variant="ghost" size="lg" data-testid="link-pricing">
                Alle Preise und Details
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Häufige Fragen zur Dokumente digitalisieren App
              </h2>
              <p className="text-lg text-muted-foreground">
                Alles, was Sie über unsere Software wissen müssen
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-background rounded-lg shadow-sm border-0 px-6">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Jetzt Dokumente digitalisieren – mit der MeineDokBox App
          </h2>
          <p className="text-xl mb-4 opacity-90 max-w-2xl mx-auto">
            Die beste Dokumente digitalisieren Software für Privatanwender. Starten Sie noch heute.
          </p>
          <p className="text-lg mb-8 opacity-75">
            7 Tage kostenlos testen. Keine Kreditkarte erforderlich. Jederzeit kündbar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6" data-testid="button-cta-final">
                <Sparkles className="mr-2 h-5 w-5" />
                Jetzt kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
