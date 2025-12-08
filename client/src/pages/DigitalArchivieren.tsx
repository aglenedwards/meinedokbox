import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Search, Shield, Sparkles, ArrowRight, Check, FileText, Lock, Cloud, Menu, ChevronDown, Star, Users, TrendingUp, Clock, Zap, HardDrive, Trash2, Building2, Quote } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export default function DigitalArchivieren() {
  useEffect(() => {
    document.title = "Digital archivieren | Digitale Dokumentenablage | MeineDokBox";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Digital archivieren mit MeineDokBox: Ihre digitale Dokumentenablage für private Dokumente. Archivierung digital, sicher und DSGVO-konform in Deutschland. Dokumente digital archivieren war noch nie so einfach.");
    }
  }, []);

  const faqs = [
    {
      question: "Wie funktioniert digitale Archivierung mit MeineDokBox?",
      answer: "Sie fotografieren oder laden Ihre Dokumente hoch, unsere KI erkennt automatisch den Dokumententyp und sortiert ihn in die passende Kategorie. So entsteht ohne manuellen Aufwand eine strukturierte digitale Dokumentenablage. Die Archivierung digital erfolgt vollautomatisch."
    },
    {
      question: "Ist meine digitale Dokumentenablage sicher?",
      answer: "Absolut. Ihre Dokumente werden ausschließlich auf deutschen Servern gespeichert (IONOS Frankfurt). Die Übertragung erfolgt verschlüsselt und wir sind vollständig DSGVO-konform. Ihre digitale Archivierung ist so sicher wie ein Banktresor."
    },
    {
      question: "Kann ich meine physischen Ordner komplett ersetzen?",
      answer: "Ja! Viele unserer Nutzer haben nach der Archivierung von Ordnern ihre Papierakten entsorgt. Mit der Volltextsuche finden Sie jedes Dokument in Sekunden – schneller als in jedem physischen Aktenschrank."
    },
    {
      question: "Wie lange werden meine Dokumente gespeichert?",
      answer: "Solange Sie ein aktives Abonnement haben, bleiben Ihre Dokumente sicher archiviert. Wir empfehlen regelmäßige Backups, die Sie jederzeit herunterladen können. Dokumente digital archivieren bedeutet auch langfristige Sicherheit."
    },
    {
      question: "Welche Dokumentenformate werden unterstützt?",
      answer: "MeineDokBox unterstützt alle gängigen Formate: PDF, JPG, PNG und WEBP. Sie können Dokumente fotografieren, hochladen oder per E-Mail weiterleiten. Die digitale Dokumentenablage akzeptiert praktisch jedes Dokument."
    },
    {
      question: "Kann ich meine digitale Archivierung mit der Familie teilen?",
      answer: "Ja! Mit unseren Family-Tarifen können bis zu 5 Familienmitglieder die digitale Dokumentenablage nutzen. Jedes Mitglied hat einen privaten Bereich, und Sie können Dokumente gezielt teilen – ideal für die gemeinsame Archivierung von Ordnern."
    }
  ];

  const testimonials = [
    {
      name: "Thomas M.",
      role: "Familienvater, 42",
      text: "Endlich Ordnung! Ich habe 8 Aktenordner digital archiviert und finde jetzt alles in Sekunden. Die beste Investition für unseren Haushalt.",
      rating: 5
    },
    {
      name: "Sandra K.",
      role: "Selbstständige, 38",
      text: "Die automatische Kategorisierung ist genial. Ich werfe einfach alles rein und die KI sortiert perfekt. Digitale Dokumentenablage war noch nie so einfach.",
      rating: 5
    },
    {
      name: "Michael R.",
      role: "Rentner, 67",
      text: "Auch für mich als 'nicht so Technik-affinen' super verständlich. Die Archivierung digital funktioniert einwandfrei. Top Service!",
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
              <FolderOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Ihre digitale Dokumentenablage</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight" data-testid="text-hero-title">
              Digital archivieren –
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Ordnung für Ihre Dokumente
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Schluss mit Papierstapeln und Aktenordnern. Mit MeineDokBox archivieren Sie Ihre Dokumente digital – 
              strukturiert, sicher und jederzeit griffbereit. Ihre digitale Dokumentenablage für die moderne Welt.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>DSGVO-konform</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Deutsche Server</span>
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
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">15+</div>
              <div className="text-sm text-muted-foreground">Kategorien automatisch</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">DSGVO-konform</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">&lt;3s</div>
              <div className="text-sm text-muted-foreground">Dokument archiviert</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">7</div>
              <div className="text-sm text-muted-foreground">Tage kostenlos</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Digitale Dokumentenablage – so funktioniert's
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Archivierung digital leicht gemacht: Vom Papierdokument zum geordneten digitalen Archiv in nur drei Schritten
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-step-1">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">Dokumente erfassen</h3>
                <p className="text-muted-foreground">
                  Fotografieren Sie Dokumente mit Ihrem Smartphone, laden Sie PDFs hoch oder leiten Sie E-Mails weiter. 
                  Jeder Weg führt zur digitalen Archivierung.
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
                <h3 className="text-xl font-semibold mb-3">KI sortiert automatisch</h3>
                <p className="text-muted-foreground">
                  Unsere KI analysiert jeden Beleg, erkennt Absender, Datum und Betrag. 
                  Die automatische Kategorisierung erspart Ihnen stundenlanges Sortieren.
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
                <h3 className="text-xl font-semibold mb-3">Digital archiviert</h3>
                <p className="text-muted-foreground">
                  Ihre digitale Dokumentenablage wächst automatisch. Volltextsuche, Filter und Tags helfen Ihnen, 
                  jedes Dokument in Sekunden zu finden.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-6">
              So einfach ist Dokumente digital archivieren. Keine komplizierte Einrichtung, keine Schulung nötig.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Archivierung von Ordnern – endlich digital
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Physische Aktenordner nehmen Platz, verstauben und sind bei Umzügen ein Alptraum. 
                  Mit MeineDokBox ersetzen Sie den kompletten Aktenschrank durch eine schlanke digitale Dokumentenablage.
                </p>
                <p className="text-lg text-muted-foreground mb-8">
                  Die Archivierung digital bietet Ihnen nicht nur mehr Platz im Regal, sondern auch echte Vorteile im Alltag: 
                  Schneller finden, sicher aufbewahren und von überall zugreifen.
                </p>
                
                <div className="space-y-4">
                  {[
                    "Durchsuchen Sie Tausende Dokumente in Sekunden",
                    "Kein Risiko durch Wasserschäden oder Feuer",
                    "Zugriff von Smartphone, Tablet und Computer",
                    "Teilen Sie Dokumente sicher mit Familie oder Steuerberater",
                    "Automatische Kategorisierung spart stundenlange Sortierarbeit"
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
                    <Cloud className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">Cloud-Zugriff</h3>
                    <p className="text-sm text-muted-foreground">Von überall erreichbar</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6 pb-6 text-center">
                    <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">Verschlüsselt</h3>
                    <p className="text-sm text-muted-foreground">Maximale Sicherheit</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6 pb-6 text-center">
                    <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">DSGVO</h3>
                    <p className="text-sm text-muted-foreground">Deutsche Server</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Dokumente digital archivieren – alle Vorteile
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Warum immer mehr Haushalte auf digitale Archivierung umsteigen
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
                  Statt stundenlang in Ordnern zu suchen, finden Sie jedes Dokument in Sekunden. 
                  Die digitale Dokumentenablage macht Schluss mit dem Papierchaos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <HardDrive className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Platz gewinnen</h3>
                <p className="text-muted-foreground">
                  Verabschieden Sie sich von sperrigen Aktenschränken. 
                  Nach der Archivierung von Ordnern können Sie die Papiere entsorgen.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Sicher aufbewahren</h3>
                <p className="text-muted-foreground">
                  Digitale Archivierung schützt vor Verlust durch Wasserschäden, Feuer oder Diebstahl. 
                  Ihre Dokumente sind auf deutschen Servern sicher.
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
                  Gemeinsame Dokumente digital archivieren und mit Familienmitgliedern teilen. 
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
                  mit Ihrer digitalen Dokumentenablage.
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
                  Alle Belege digital archiviert und kategorisiert. 
                  Die Steuererklärung wird zum Kinderspiel mit der digitalen Archivierung.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Diese Dokumente können Sie digital archivieren
              </h2>
              <p className="text-lg text-muted-foreground">
                Unsere KI erkennt automatisch über 50 verschiedene Dokumententypen und sortiert sie in 15 Kategorien
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                "Rechnungen & Belege",
                "Verträge & Policen",
                "Kontoauszüge",
                "Steuerbescheide",
                "Arztbriefe & Befunde",
                "Gehaltsabrechnungen",
                "Versicherungsunterlagen",
                "Mietverträge",
                "Garantiebelege",
                "Behördenschreiben",
                "Handwerkerrechnungen",
                "Stromrechnungen",
                "KFZ-Unterlagen",
                "Schulzeugnisse",
                "Rentenbescheide"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-background shadow-sm">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Das sagen unsere Nutzer
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tausende Haushalte nutzen bereits MeineDokBox für ihre digitale Dokumentenablage
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

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Häufige Fragen zur digitalen Archivierung
              </h2>
              <p className="text-lg text-muted-foreground">
                Alles, was Sie über Dokumente digital archivieren wissen müssen
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
            Starten Sie jetzt mit der digitalen Archivierung
          </h2>
          <p className="text-xl mb-4 opacity-90 max-w-2xl mx-auto">
            Verabschieden Sie sich vom Papierchaos. Ihre digitale Dokumentenablage wartet auf Sie.
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
