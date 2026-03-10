import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, Camera, Search, Shield, ArrowRight, Check, Sparkles, Clock, FolderOpen, Zap, FileText, Star, Menu, AlertTriangle, BookOpen } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export default function RechnungenDigitalisieren() {
  const faqs = [
    {
      question: "Wie digitalisiere ich Rechnungen am schnellsten?",
      answer: "Einfach die MeineDokBox-App öffnen, die Rechnung mit dem Smartphone fotografieren – fertig. Unsere KI erkennt automatisch Betrag, Datum, Absender und Kategorie. Rechnungen digitalisieren dauert damit nur Sekunden pro Beleg."
    },
    {
      question: "Wie lange muss ich Rechnungen aufbewahren?",
      answer: "Für Privatpersonen gilt: Handwerkerrechnungen 5 Jahre (Gewährleistung), Rechnungen für die Steuererklärung mindestens 4 Jahre, Kaufbelege für Garantiefälle für den gesamten Garantiezeitraum plus 3 Jahre. Mit der digitalen Archivierung sind alle Belege automatisch sicher aufbewahrt."
    },
    {
      question: "Kann ich Rechnungen per E-Mail empfangen?",
      answer: "Ja! Mit MeineDokBox erhalten Sie eine persönliche Eingangs-E-Mail-Adresse. Leiten Sie digitale Rechnungen einfach dorthin weiter – sie werden automatisch verarbeitet, kategorisiert und in Ihrem digitalen Archiv abgelegt."
    },
    {
      question: "Welche Formate werden unterstützt?",
      answer: "MeineDokBox unterstützt alle gängigen Formate: PDF, JPG, PNG und WEBP. Sie können Rechnungen abfotografieren, hochladen oder per E-Mail weiterleiten. Auch mehrere Seiten können zu einem Dokument zusammengefügt werden."
    },
    {
      question: "Sind meine Rechnungen sicher gespeichert?",
      answer: "Alle Belege werden verschlüsselt auf deutschen Servern (IONOS Frankfurt am Main) gespeichert und verlassen nie die EU. MeineDokBox ist vollständig DSGVO-konform. Ihre digitalen Rechnungen sind sicherer als in jedem Papierordner."
    },
    {
      question: "Kann ich Rechnungen mit meinem Partner teilen?",
      answer: "Mit dem Familien-Tarif können Sie Ordner gezielt mit Ihrem Partner teilen – zum Beispiel einen gemeinsamen Ordner für Haushaltsrechnungen. Gleichzeitig hat jede Person ihren privaten Bereich für persönliche Belege."
    },
    {
      question: "Wie finde ich eine bestimmte Rechnung wieder?",
      answer: "Über die Volltextsuche: Geben Sie einfach den Händlernamen, Betrag oder Datum ein. MeineDokBox durchsucht alle Ihre Belege in Sekunden – egal wie viele Rechnungen Sie archiviert haben. Schluss mit Suchen in Papierordnern."
    }
  ];

  useEffect(() => {
    document.title = "Rechnungen digitalisieren & aufbewahren | Belege digital verwalten | MeineDokBox";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Rechnungen digitalisieren leicht gemacht: Belege per Smartphone abfotografieren, KI sortiert automatisch. Alle Rechnungen digital aufbewahren – DSGVO-konform auf deutschen Servern.");
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = 'https://meinedokbox.de/rechnungen-digitalisieren';

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
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
    return () => { const s = document.getElementById('faq-schema'); if (s) s.remove(); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <img src={logoImage} alt="MeineDokBox" className="h-10 cursor-pointer" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/funktionen"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Funktionen</span></Link>
            <Link href="/preise"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Preise</span></Link>
            <Link href="/ratgeber"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Ratgeber</span></Link>
            <Link href="/registrieren"><Button size="sm">Kostenlos testen</Button></Link>
          </nav>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader><SheetTitle>MeineDokBox</SheetTitle></SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <Link href="/funktionen"><span className="text-foreground cursor-pointer">Funktionen</span></Link>
                <Link href="/preise"><span className="text-foreground cursor-pointer">Preise</span></Link>
                <Link href="/ratgeber"><span className="text-foreground cursor-pointer">Ratgeber</span></Link>
                <Link href="/registrieren"><Button className="w-full">Kostenlos testen</Button></Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Receipt className="h-4 w-4" />
            Belege & Rechnungen
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Rechnungen digitalisieren —<br className="hidden md:block" />
            <span className="text-primary">schnell, sicher, automatisch</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Belege abfotografieren, hochladen oder per E-Mail weiterleiten.
            MeineDokBox erkennt automatisch Betrag, Datum und Absender — und legt alles sortiert ab.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/registrieren">
              <Button size="lg" className="gap-2 text-base">
                <Sparkles className="h-5 w-5" />
                7 Tage kostenlos testen
              </Button>
            </Link>
            <Link href="/funktionen">
              <Button size="lg" variant="outline" className="text-base">Alle Funktionen</Button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground">
            {["Keine Kreditkarte nötig", "DSGVO-konform", "Server in Deutschland"].map(t => (
              <span key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Warum digitale Rechnungen */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Warum Rechnungen digitalisieren?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Papierbelege gehen verloren, verblassen und sind schwer zu finden. Digitale Rechnungen sind immer griffbereit.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: "Steuererklärung",
                desc: "Belege für Handwerker, Haushaltshilfen und haushaltsnahe Dienstleistungen steuerlich absetzen. Digitale Belege werden von Finanzämtern akzeptiert."
              },
              {
                icon: Shield,
                title: "Garantieansprüche",
                desc: "Kaufbelege sofort zur Hand wenn das Gerät ausfällt. Mit MeineDokBox finden Sie jeden Kassenbon in Sekunden — egal wie lange er zurückliegt."
              },
              {
                icon: Clock,
                title: "Aufbewahrungsfristen",
                desc: "Handwerkerrechnungen 5 Jahre, Steuerbelege 4 Jahre. Digitale Archivierung sorgt dafür, dass kein Beleg verloren geht — auch nach Jahren noch abrufbar."
              },
              {
                icon: Search,
                title: "Sofort wiederfinden",
                desc: "Suchen Sie nach Betrag, Absender oder Datum. Die Volltextsuche durchforstet alle Ihre Rechnungen in Sekunden — kein Wühlen in Ordnern mehr."
              },
              {
                icon: FolderOpen,
                title: "Automatisch sortiert",
                desc: "Die KI erkennt ob es eine Handwerkerrechnung, Arztrechnung oder ein Kassenbon ist — und legt alles automatisch in die richtige Kategorie."
              },
              {
                icon: Zap,
                title: "In Sekunden erledigt",
                desc: "Rechnung erhalten, kurz abfotografieren, fertig. Kein manuelles Eintippen, keine manuelle Sortierung. MeineDokBox übernimmt alles automatisch."
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardContent className="pt-6">
                    <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* So funktioniert es */}
      <section className="py-20 bg-muted/30 border-y">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">So einfach geht Rechnungen digitalisieren</h2>
            <p className="text-muted-foreground">Drei Schritte — von der Papierrechnung zur digitalen Ablage</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", icon: Camera, title: "Foto oder Upload", desc: "Rechnung mit dem Smartphone abfotografieren oder als PDF hochladen. Auch per E-Mail weiterleiten möglich." },
              { step: "2", icon: Sparkles, title: "KI kategorisiert automatisch", desc: "MeineDokBox erkennt Absender, Betrag, Datum und Dokumenttyp — vollautomatisch, ohne manuelle Eingabe." },
              { step: "3", icon: FolderOpen, title: "Sortiert & durchsuchbar", desc: "Der Beleg ist sofort abgelegt und per Volltextsuche findbar. Für immer — sicher auf deutschen Servern." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="text-center">
                  <div className="relative inline-flex items-center justify-center mb-5">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{item.step}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Aufbewahrungsfristen Hinweis */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-6 py-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/50 shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Wie lange müssen Sie Rechnungen aufbewahren?</h3>
              <div className="text-sm text-muted-foreground space-y-1.5 mb-4">
                <p><strong className="text-foreground">Handwerkerrechnungen:</strong> 5 Jahre — wegen Gewährleistungsansprüchen nach § 634a BGB</p>
                <p><strong className="text-foreground">Steuerbelege:</strong> Mindestens 4 Jahre ab Ende des Steuerjahres</p>
                <p><strong className="text-foreground">Garantiescheins & Kaufbelege:</strong> Garantiezeitraum + 3 Jahre</p>
                <p><strong className="text-foreground">Arzt- & Krankenhausrechnungen:</strong> Lebenslang empfohlen</p>
              </div>
              <Link href="/ratgeber/aufbewahrungsfristen">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer">
                  Alle Aufbewahrungsfristen im Überblick
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bewertungen */}
      <section className="py-20 bg-muted/30 border-t">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Was Nutzer sagen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { text: "Endlich kein Schuhkarton mehr voller Quittungen. Ich fotografiere jede Rechnung direkt ab und finde sie später sofort wieder.", name: "Thomas K.", city: "München" },
              { text: "Die Steuererklärung war dieses Jahr zum ersten Mal stressfrei. Alle Handwerkerbelege auf einen Klick zusammengestellt.", name: "Sandra B.", city: "Hamburg" },
              { text: "Mein Mann und ich teilen uns einen Ordner für Haushaltsrechnungen — perfekt für das Familien-Abo.", name: "Petra M.", city: "Köln" },
            ].map((review) => (
              <Card key={review.name}>
                <CardContent className="pt-6">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
                  </div>
                  <p className="text-sm text-muted-foreground italic mb-4">"{review.text}"</p>
                  <p className="text-sm font-medium">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.city}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-10">Häufige Fragen zum Rechnungen digitalisieren</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border rounded-lg px-5">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Weitere Links */}
      <section className="py-12 bg-muted/30 border-t">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-lg font-semibold mb-5">Mehr zum Thema</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: "/ratgeber/aufbewahrungsfristen", icon: Clock, title: "Aufbewahrungsfristen", desc: "Welche Belege wie lange aufbewahren?" },
              { href: "/digital-archivieren", icon: FolderOpen, title: "Digital archivieren", desc: "Alle Dokumente digital verwalten" },
              { href: "/post-digitalisieren", icon: BookOpen, title: "Post digitalisieren", desc: "Eingehende Post automatisch verarbeiten" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="hover-elevate cursor-pointer h-full">
                    <CardContent className="pt-5 flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted shrink-0"><Icon className="h-4 w-4 text-primary" /></div>
                      <div>
                        <p className="font-medium text-sm mb-0.5">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 mt-0.5" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Schluss mit dem Belegchaos</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Alle Rechnungen digital, sortiert und durchsuchbar — in weniger als einer Minute eingerichtet.
          </p>
          <Link href="/registrieren">
            <Button size="lg" variant="secondary" className="text-lg px-8 gap-2" data-testid="button-cta-rechnungen">
              <Sparkles className="h-5 w-5" />
              Jetzt kostenlos starten
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 opacity-75 text-sm">7 Tage kostenlos • Server in Deutschland • DSGVO-konform</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
