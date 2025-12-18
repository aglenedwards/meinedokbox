import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Camera, FolderOpen, Sparkles, ArrowRight, Check, Bell, Search, Shield, Menu, Star, Quote, Clock, Users, Zap, FileText, AlertTriangle, Calendar, TrendingUp, Lock } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export default function PostDigitalisieren() {
  const faqs = [
    {
      question: "Was ist ein digitaler Briefkasten?",
      answer: "Ein digitaler Briefkasten ist Ihre persönliche Sammelstelle für alle Dokumente – egal ob als Papierbrief eingescannt oder als digitale Post per E-Mail empfangen. MeineDokBox organisiert alles automatisch und macht Ihre Post durchsuchbar. Post digitalisieren privat war noch nie so einfach."
    },
    {
      question: "Wie scanne ich meine Post am besten?",
      answer: "Einfach die MeineDokBox-App öffnen und den Brief mit Ihrem Smartphone fotografieren. Die App optimiert das Bild automatisch (Helligkeit, Kontrast, Perspektive) und unsere KI erkennt den Absender, Datum und Inhalt. Post digitalisieren geht in Sekunden."
    },
    {
      question: "Werden meine Briefe automatisch sortiert?",
      answer: "Ja! Unsere KI erkennt automatisch, um welche Art von Post es sich handelt, und sortiert sie in die passende Kategorie: Versicherung, Behörde, Finanzen, Gesundheit und mehr. Sie müssen nichts manuell einordnen – das ist der Vorteil vom digitalen Briefkasten."
    },
    {
      question: "Kann ich Zahlungsfristen im Blick behalten?",
      answer: "Absolut! MeineDokBox erkennt automatisch Rechnungen mit Zahlungsfristen und erinnert Sie rechtzeitig. So verpassen Sie nie wieder eine Zahlung. Post digitalisieren privat mit eingebauter Fristenkontrolle."
    },
    {
      question: "Ist meine Post sicher?",
      answer: "Maximale Sicherheit: Alle Daten werden verschlüsselt auf deutschen Servern (IONOS Frankfurt) gespeichert. Wir sind vollständig DSGVO-konform. Ihr digitaler Briefkasten ist so sicher wie ein Tresor."
    },
    {
      question: "Kann ich digitale Rechnungen per E-Mail empfangen?",
      answer: "Ja! Sie erhalten eine persönliche MeineDokBox-E-Mail-Adresse. Leiten Sie digitale Rechnungen einfach dorthin weiter – sie werden automatisch verarbeitet und in Ihren digitalen Briefkasten einsortiert."
    }
  ];

  useEffect(() => {
    document.title = "Post digitalisieren privat | Digitaler Briefkasten | MeineDokBox";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Post digitalisieren privat: Ihr digitaler Briefkasten mit MeineDokBox. Briefe scannen, automatisch einsortieren und sicher archivieren. Der smarte Weg, Briefpost zu verwalten.");
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = 'https://meinedokbox.de/post-digitalisieren';

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    let scriptTag = document.getElementById('faq-schema') as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'faq-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(faqSchema);

    return () => {
      const script = document.getElementById('faq-schema');
      if (script) script.remove();
    };
  }, []);

  const useCases = [
    {
      title: "Rechnungen & Mahnungen",
      description: "Nie wieder Zahlungsfristen verpassen. Post digitalisieren und automatische Erinnerungen erhalten.",
      icon: AlertTriangle
    },
    {
      title: "Versicherungsschreiben",
      description: "Alle Policen und Schreiben Ihrer Versicherungen an einem Ort. Schnell finden, wenn Sie sie brauchen.",
      icon: Shield
    },
    {
      title: "Behördenpost",
      description: "Steuerbescheide, Rentenbescheide, Meldebescheinigungen – alles sicher archiviert.",
      icon: FileText
    },
    {
      title: "Vertragsunterlagen",
      description: "Mietverträge, Arbeitsverträge, Handyverträge – nie wieder nach dem Kleingedruckten suchen.",
      icon: Calendar
    }
  ];

  const testimonials = [
    {
      name: "Klaus W.",
      role: "Rentner, 68",
      text: "Endlich Ordnung in meiner Post! Früher habe ich ständig Rechnungen verlegt. Mit dem digitalen Briefkasten finde ich alles sofort. Post digitalisieren privat ist die beste Entscheidung.",
      rating: 5
    },
    {
      name: "Julia M.",
      role: "Berufstätige Mutter, 35",
      text: "Mit drei Kindern bleibt wenig Zeit für Papierkram. MeineDokBox ist mein digitaler Briefkasten – ich fotografiere die Post kurz ab und fertig. Die KI macht den Rest!",
      rating: 5
    },
    {
      name: "Herbert K.",
      role: "Selbstständiger, 55",
      text: "Als Selbstständiger bekomme ich täglich Post. Der digitale Briefkasten hat mein Büro revolutioniert. Alles ist durchsuchbar, nichts geht verloren. Absolute Empfehlung!",
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
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Ihr digitaler Briefkasten</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight" data-testid="text-hero-title">
              Post digitalisieren privat –
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Ihr digitaler Briefkasten
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Verwandeln Sie Ihre Briefpost in digitale Dokumente. Scannen Sie Briefe, Rechnungen und Bescheide – 
              automatisch einsortiert, durchsuchbar und jederzeit abrufbar. Post digitalisieren war noch nie so einfach.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Automatische Sortierung</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Zahlungserinnerungen</span>
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
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">&lt;5s</div>
              <div className="text-sm text-muted-foreground">Post digitalisiert</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">15+</div>
              <div className="text-sm text-muted-foreground">Kategorien erkannt</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Durchsuchbar</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">0</div>
              <div className="text-sm text-muted-foreground">Verpasste Fristen</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              So funktioniert Ihr digitaler Briefkasten
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Post digitalisieren privat in 3 einfachen Schritten – schneller als der Gang zum Briefkasten
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-step-1">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">Post fotografieren</h3>
                <p className="text-muted-foreground">
                  Öffnen Sie den Brief, fotografieren Sie ihn mit Ihrem Smartphone. Die App optimiert das Bild 
                  automatisch – Helligkeit, Kontrast und Perspektive werden korrigiert.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-step-2">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3">KI analysiert</h3>
                <p className="text-muted-foreground">
                  Unsere KI erkennt Absender, Datum, Betreff und bei Rechnungen auch den Betrag und die 
                  Zahlungsfrist. Alles wird automatisch extrahiert – Sie tippen nichts ein.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-step-3">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <FolderOpen className="h-8 w-8 text-primary" />
                </div>
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3">Automatisch sortiert</h3>
                <p className="text-muted-foreground">
                  Der Brief landet in der richtigen Kategorie Ihres digitalen Briefkastens – ob Versicherung, 
                  Behörde, Finanzen oder Gesundheit. Keine manuelle Sortierung nötig.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              So einfach ist Post digitalisieren privat. Der komplette Vorgang dauert weniger als 10 Sekunden.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Diese Post gehört in Ihren digitalen Briefkasten
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Von der Stromrechnung bis zum Steuerbescheid – Post digitalisieren für alle Lebensbereiche
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {useCases.map((useCase, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-8 pb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <useCase.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl mb-2">{useCase.title}</h3>
                      <p className="text-muted-foreground">{useCase.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Warum Sie Ihre Post digitalisieren sollten
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Der durchschnittliche Haushalt erhält über 500 Briefe pro Jahr. Ohne System wird das schnell 
                  unübersichtlich. Ein digitaler Briefkasten schafft Ordnung und spart Zeit.
                </p>
                <p className="text-lg text-muted-foreground mb-8">
                  Post digitalisieren privat bedeutet: Nie wieder wichtige Dokumente suchen, nie wieder Fristen 
                  verpassen, nie wieder Papierstapel durchsortieren. Alles ist einen Suchbegriff entfernt.
                </p>
                
                <div className="space-y-4">
                  {[
                    "Durchsuchen Sie Tausende Briefe in Sekunden",
                    "Automatische Erinnerungen bei Zahlungsfristen",
                    "Sicher archiviert auf deutschen Servern",
                    "Teilen Sie Dokumente mit Familie oder Steuerberater",
                    "Zugriff von überall – Smartphone, Tablet, Computer"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6 pb-6 text-center">
                    <Search className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">Volltextsuche</h3>
                    <p className="text-sm text-muted-foreground">Jedes Wort durchsuchbar</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6 pb-6 text-center">
                    <Bell className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">Erinnerungen</h3>
                    <p className="text-sm text-muted-foreground">Keine Frist verpassen</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6 pb-6 text-center">
                    <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">DSGVO-konform</h3>
                    <p className="text-sm text-muted-foreground">Deutsche Server</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6 pb-6 text-center">
                    <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">E-Mail-Import</h3>
                    <p className="text-sm text-muted-foreground">Digitale Post automatisch</p>
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
              Vorteile Ihres digitalen Briefkastens
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Warum immer mehr Menschen ihre Post digitalisieren
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Zeit sparen</h3>
                <p className="text-muted-foreground">
                  Statt stundenlang in Ordnern zu suchen, finden Sie jeden Brief in Sekunden. 
                  Post digitalisieren privat spart Ihnen jede Woche wertvolle Zeit.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <AlertTriangle className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Fristen einhalten</h3>
                <p className="text-muted-foreground">
                  Nie wieder Mahngebühren durch verpasste Zahlungsfristen. 
                  Ihr digitaler Briefkasten erinnert Sie automatisch rechtzeitig.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Sicher aufbewahren</h3>
                <p className="text-muted-foreground">
                  Kein Risiko durch Wasserschäden, Feuer oder Verlust. 
                  Ihre Post ist auf deutschen Servern sicher archiviert.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Mit Familie teilen</h3>
                <p className="text-muted-foreground">
                  Gemeinsame Dokumente im digitalen Briefkasten mit Partnerin oder Familie teilen. 
                  Jeder behält seinen privaten Bereich.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Sofort startklar</h3>
                <p className="text-muted-foreground">
                  Keine Installation, keine Einrichtung. Registrieren Sie sich und beginnen Sie sofort 
                  mit Post digitalisieren – Ihr digitaler Briefkasten ist bereit.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Steuern vereinfachen</h3>
                <p className="text-muted-foreground">
                  Alle Belege im digitalen Briefkasten kategorisiert. 
                  Die Steuererklärung wird zum Kinderspiel – alle Dokumente griffbereit.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Diese Post können Sie digitalisieren
              </h2>
              <p className="text-lg text-muted-foreground">
                Unsere KI erkennt automatisch über 50 verschiedene Dokumententypen und sortiert sie perfekt
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                "Rechnungen & Mahnungen",
                "Versicherungsschreiben",
                "Behördenpost",
                "Steuerbescheide",
                "Bankauszüge",
                "Vertragsunterlagen",
                "Arztbriefe & Befunde",
                "Kündigungsbestätigungen",
                "Lohnabrechnungen",
                "Garantiebelege",
                "Mietverträge",
                "KFZ-Unterlagen",
                "Handwerkerrechnungen",
                "Rentenbescheide",
                "Schulunterlagen"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
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
              Tausende nutzen MeineDokBox als ihren digitalen Briefkasten
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
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Häufige Fragen zum digitalen Briefkasten
              </h2>
              <p className="text-lg text-muted-foreground">
                Alles, was Sie über Post digitalisieren privat wissen müssen
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-muted/30 rounded-lg shadow-sm border-0 px-6">
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
            Starten Sie Ihren digitalen Briefkasten
          </h2>
          <p className="text-xl mb-4 opacity-90 max-w-2xl mx-auto">
            Post digitalisieren privat war noch nie so einfach. Probieren Sie es kostenlos aus.
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
