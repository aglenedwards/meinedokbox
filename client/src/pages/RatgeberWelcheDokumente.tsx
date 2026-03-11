import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Clock, ArrowRight, Check, FileText, Shield, Home, Heart, Briefcase, Car, Receipt, AlertTriangle, Archive, Sparkles, BookOpen } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function RatgeberWelcheDokumente() {
  const faqs = [
    {
      question: "Welche Dokumente sollte man niemals wegwerfen?",
      answer: "Geburtsurkunde, Heirats-/Scheidungsurkunde, Erbschein, Rentenunterlagen, Schul- und Berufsabschlusszeugnisse sowie Grundbuchauszüge sollten niemals entsorgt werden. Diese Originaldokumente sind oft nicht ersetzbar oder nur mit großem Aufwand neu zu beantragen."
    },
    {
      question: "Wie lange muss man Steuerbescheide aufbewahren?",
      answer: "Steuerbescheide sollten mindestens 4 Jahre lang aufbewahrt werden (1 Jahr Einspruchsfrist + ca. 3 Jahre Bearbeitungszeit). Bei Steuerprüfungen kann das Finanzamt auch auf ältere Unterlagen zurückgreifen. Empfehlenswert sind 10 Jahre zur Sicherheit."
    },
    {
      question: "Muss man Kontoauszüge aufbewahren?",
      answer: "Kontoauszüge für Privatpersonen müssen gesetzlich nicht aufbewahrt werden — empfohlen sind aber 3 Jahre, um Zahlungen bei Streitigkeiten nachweisen zu können. Für steuerlich relevante Buchungen gilt die 4-Jahres-Regel."
    },
    {
      question: "Wie lange gelten Garantieunterlagen?",
      answer: "Garantieunterlagen (Kaufbeleg, Garantiekarte) sollten für den gesamten Garantiezeitraum plus mindestens 3 Jahre aufbewahrt werden. Bei teuren Geräten (Kühlschrank, Waschmaschine) empfiehlt sich die Aufbewahrung für 5–10 Jahre."
    },
    {
      question: "Was passiert wenn ich wichtige Dokumente weggeworfen habe?",
      answer: "Je nach Dokument sind Neuausstellungen möglich: Geburtsurkunden beim Standesamt, Zeugnisse bei der Schule/Universität, Grundbuchauszüge beim Grundbuchamt. Das kostet Zeit und Geld. Mit digitaler Archivierung passiert Ihnen das nicht mehr."
    },
    {
      question: "Darf man Originaldokumente durch Scans ersetzen?",
      answer: "Für viele alltägliche Zwecke ja — Finanzämter akzeptieren digitale Belege. Dennoch sollten Originaldokumente wie Urkunden, notarielle Verträge und Originalzeugnisse im Original aufbewahrt werden, auch wenn Sie bereits digitalisiert haben."
    }
  ];

  useEffect(() => {
    document.title = "Welche Dokumente aufbewahren? Vollständige Checkliste 2026 | MeineDokBox";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Welche Dokumente müssen Sie aufbewahren und welche können weg? Vollständige Checkliste 2026: Lebensdokumente, Steuern, Versicherungen, Wohnen und mehr.");
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = 'https://meinedokbox.de/ratgeber/welche-dokumente-aufbewahren';

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Welche Dokumente aufbewahren? Vollständige Checkliste 2026",
      "description": "Vollständige Checkliste welche Dokumente Privatpersonen in Deutschland aufbewahren müssen",
      "author": { "@type": "Organization", "name": "MeineDokBox" },
      "publisher": { "@type": "Organization", "name": "MeineDokBox", "url": "https://meinedokbox.de" },
      "datePublished": "2026-01-01",
      "dateModified": "2026-03-01"
    };
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
      }))
    };
    ["article-schema", "faq-schema"].forEach(id => { const s = document.getElementById(id); if (s) s.remove(); });
    [{ id: "article-schema", data: articleSchema }, { id: "faq-schema", data: faqSchema }].forEach(({ id, data }) => {
      const s = document.createElement('script');
      s.id = id;
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(data);
      document.head.appendChild(s);
    });
    return () => { ["article-schema", "faq-schema"].forEach(id => { const s = document.getElementById(id); if (s) s.remove(); }); };
  }, []);

  const categories = [
    {
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      title: "Lebensdokumente",
      subtitle: "Niemals wegwerfen",
      badge: "Dauerhaft",
      badgeColor: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
      items: [
        { doc: "Geburtsurkunde", note: "Original + Kopie aufbewahren" },
        { doc: "Personalausweis / Reisepass", note: "Auch abgelaufene Versionen 10 Jahre" },
        { doc: "Heiratsurkunde / Scheidungsurteil", note: "Lebenslang im Original" },
        { doc: "Sterbeurkunden (Angehörige)", note: "Für Erbangelegenheiten" },
        { doc: "Erbschein / Testament", note: "Original beim Notar hinterlegen" },
        { doc: "Schul- und Abschlusszeugnisse", note: "Alle Zeugnisse dauerhaft" },
        { doc: "Berufs- und Hochschulabschlüsse", note: "Urkunden im Original" },
        { doc: "Impfpass", note: "Lebenslang — digital sichern" },
      ]
    },
    {
      icon: Receipt,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/30",
      title: "Steuern & Finanzen",
      subtitle: "Für Finanzamt und Nachweise",
      badge: "4–10 Jahre",
      badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
      items: [
        { doc: "Steuerbescheide", note: "Mindestens 4 Jahre, empfohlen 10 Jahre" },
        { doc: "Steuererklärungsunterlagen", note: "4 Jahre nach Abgabe" },
        { doc: "Belege für Werbungskosten", note: "Handwerker, Fahrtkosten etc." },
        { doc: "Kontoauszüge", note: "Empfohlen 3–4 Jahre" },
        { doc: "Sparbücher / Depotauszüge", note: "Bis zur vollständigen Auflösung" },
        { doc: "Kreditverträge", note: "Laufzeit + 3 Jahre" },
        { doc: "Rentenbescheide", note: "Alle Bescheide dauerhaft" },
        { doc: "Gehaltsabrechnungen", note: "Mindestens 10 Jahre" },
      ]
    },
    {
      icon: Shield,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      title: "Versicherungen",
      subtitle: "Für Schadenfälle und Kündigungen",
      badge: "Laufzeit + 3 J.",
      badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
      items: [
        { doc: "Versicherungspolicen", note: "Gesamte Laufzeit + 3 Jahre" },
        { doc: "Krankenversicherungsnachweis", note: "Lückenlos — für Rentenbescheid" },
        { doc: "Lebensversicherungsunterlagen", note: "Bis zur Auszahlung + 5 Jahre" },
        { doc: "Unfallberichte / Schadenmeldungen", note: "5 Jahre nach Abschluss" },
        { doc: "Kündigungsbestätigungen", note: "3 Jahre aufbewahren" },
        { doc: "Rentenversicherungsauszüge", note: "Dauerhaft — fürs Rentenkonto" },
      ]
    },
    {
      icon: Home,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      title: "Wohnen & Immobilien",
      subtitle: "Mietverträge, Kaufbelege, Handwerker",
      badge: "5–30 Jahre",
      badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
      items: [
        { doc: "Mietvertrag", note: "Gesamte Mietdauer + 3 Jahre" },
        { doc: "Nebenkostenabrechnungen", note: "3 Jahre nach Eingang" },
        { doc: "Übergabeprotokoll (Einzug/Auszug)", note: "3 Jahre nach Auszug" },
        { doc: "Handwerkerrechnungen", note: "5 Jahre (Gewährleistung § 634a BGB)" },
        { doc: "Grundbuchauszug", note: "Dauerhaft bei Eigentum" },
        { doc: "Kaufvertrag Immobilie", note: "Dauerhaft im Original" },
        { doc: "Bauunterlagen / Grundrisse", note: "Dauerhaft als Eigentümer" },
        { doc: "Energieausweis", note: "10 Jahre" },
      ]
    },
    {
      icon: Car,
      color: "text-cyan-600",
      bg: "bg-cyan-50 dark:bg-cyan-950/30",
      title: "Fahrzeuge",
      subtitle: "KFZ-Unterlagen vollständig behalten",
      badge: "Laufzeit + 3 J.",
      badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400",
      items: [
        { doc: "Fahrzeugbrief (Zulassungsbescheinigung II)", note: "Dauerhaft — Eigentümernachweis" },
        { doc: "Fahrzeugschein (Zulassungsbescheinigung I)", note: "Immer im Fahrzeug" },
        { doc: "Kaufvertrag Fahrzeug", note: "Bis Weiterverkauf + 3 Jahre" },
        { doc: "HU/AU-Prüfberichte", note: "Bis zur nächsten Prüfung" },
        { doc: "Reparaturrechnungen", note: "Bis Weiterverkauf (steigert Wert)" },
        { doc: "KFZ-Versicherungsunterlagen", note: "Laufzeit + 3 Jahre" },
      ]
    },
    {
      icon: Heart,
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      title: "Gesundheit & Familie",
      subtitle: "Für Behandlungen und Ansprüche",
      badge: "10 J. – dauerhaft",
      badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
      items: [
        { doc: "Impfpass", note: "Lebenslang" },
        { doc: "Mutterpass / Kinderuntersuchungshefte", note: "Lebenslang des Kindes" },
        { doc: "Arztbriefe / Befundberichte", note: "Lebenslang empfohlen" },
        { doc: "Krankenhausberichte", note: "10 Jahre" },
        { doc: "Krankenversicherungskarte-Nachweise", note: "Für Rentenansprüche" },
        { doc: "Rezepte für Hilfsmittel", note: "3 Jahre" },
        { doc: "Behindertenausweis", note: "Gültigkeitsdauer + 3 Jahre" },
      ]
    },
    {
      icon: Briefcase,
      color: "text-slate-600",
      bg: "bg-slate-50 dark:bg-slate-950/30",
      title: "Arbeit & Karriere",
      subtitle: "Nachweise für Beruf und Rente",
      badge: "Dauerhaft",
      badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-950/50 dark:text-slate-400",
      items: [
        { doc: "Arbeitsverträge", note: "Dauerhaft — auch gekündigte" },
        { doc: "Arbeitszeugnisse", note: "Lebenslang" },
        { doc: "Gehaltsabrechnungen", note: "Mindestens 10 Jahre" },
        { doc: "Sozialversicherungsausweis", note: "Lebenslang" },
        { doc: "Nachweise Elternzeit / Krankengeld", note: "10 Jahre" },
        { doc: "Abfindungsvereinbarungen", note: "10 Jahre" },
        { doc: "Weiterbildungszertifikate", note: "Lebenslang" },
      ]
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Link href="/"><span className="hover:text-foreground cursor-pointer transition-colors">Startseite</span></Link>
            <span>/</span>
            <Link href="/ratgeber"><span className="hover:text-foreground cursor-pointer transition-colors">Ratgeber</span></Link>
            <span>/</span>
            <span className="text-foreground">Welche Dokumente aufbewahren</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-5">
            <BookOpen className="h-4 w-4" />
            Ratgeber · Dokumente
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-5 leading-tight">
            Welche Dokumente aufbewahren?<br className="hidden md:block" />
            <span className="text-primary">Checkliste 2026</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Ein Überblick über alle wichtigen Dokumente — geordnet nach Kategorie — und wie lange Sie diese aufbewahren sollten.
            Damit Sie im Ernstfall immer den richtigen Beleg zur Hand haben.
          </p>
          <div className="flex flex-wrap justify-center gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> 10 Min. Lesezeit</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Aktualisiert März 2026</span>
            <span className="flex items-center gap-1.5"><Archive className="h-4 w-4 text-primary" /> 7 Kategorien</span>
          </div>
        </div>
      </section>

      {/* Intro + niemals entsorgen */}
      <section className="py-12 bg-background border-t">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4 mb-8">
            <p>
              Jedes Jahr entstehen neue Unterlagen: Steuerbescheide, Handwerkerrechnungen, Versicherungspolicen, Arztbriefe.
              Viele davon landen im Schuhkarton oder werden zu früh weggeworfen — und genau dann, wenn man sie braucht, sind sie weg.
            </p>
            <p>
              Diese Checkliste zeigt Ihnen, <strong className="text-foreground">welche Dokumente Sie aufbewahren müssen</strong> und wie lang — sortiert nach den sieben wichtigsten Lebensbereichen.
            </p>
          </div>

          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-6 py-5 flex gap-4 items-start">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-red-800 dark:text-red-300">Diese Dokumente dürfen Sie niemals wegwerfen</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {[
                  "Geburtsurkunde", "Heiratsurkunde / Scheidungsurteil",
                  "Schulzeugnisse & Berufsabschlüsse", "Erbschein & Testament",
                  "Rentenunterlagen (alle)", "Sozialversicherungsausweis",
                  "Arbeitsverträge & Arbeitszeugnisse", "Grundbuchauszug & Kaufvertrag (Immobilie)",
                ].map(doc => (
                  <span key={doc} className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                    <Check className="h-3.5 w-3.5 shrink-0" />{doc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kategorie-Karten */}
      <section className="py-16 bg-muted/20 border-t">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center">Vollständige Checkliste nach Kategorie</h2>
          <p className="text-center text-muted-foreground mb-10">Klicken Sie auf eine Kategorie um alle Dokumente zu sehen</p>

          <div className="space-y-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.title} className={`rounded-xl border ${cat.bg} p-6`}>
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <div className={`p-2 rounded-lg bg-white/60 dark:bg-black/20 shrink-0`}>
                      <Icon className={`h-5 w-5 ${cat.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight">{cat.title}</h3>
                      <p className="text-sm text-muted-foreground">{cat.subtitle}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cat.badgeColor} shrink-0`}>{cat.badge}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                    {cat.items.map((item) => (
                      <div key={item.doc} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium">{item.doc}</span>
                          <span className="text-xs text-muted-foreground ml-1.5">— {item.note}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tipp: Digital archivieren */}
      <section className="py-14 bg-background border-t">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="rounded-xl bg-primary/5 border border-primary/20 px-6 py-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="p-3 rounded-lg bg-primary/10 shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">Praxistipp</p>
              <h3 className="text-lg font-semibold mb-2">Alle Dokumente digital sichern — niemals verlieren</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Die sicherste Methode: Digitalisieren Sie alle wichtigen Dokumente mit MeineDokBox.
                Kamera draufhalten, KI erkennt den Dokumenttyp automatisch, fertig — sicher archiviert auf deutschen Servern.
                Auch wenn ein Original verloren geht, haben Sie immer eine digitale Kopie.
              </p>
              <Link href="/registrieren">
                <Button size="sm" className="gap-2" data-testid="button-tipp-cta-welche-dokumente">
                  <Sparkles className="h-4 w-4" />
                  Jetzt kostenlos starten
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/20 border-t">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Häufige Fragen</h2>
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

      {/* Weitere Ratgeber */}
      <section className="py-12 bg-background border-t">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-lg font-semibold mb-5">Weiterführende Ratgeber</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: "/ratgeber/aufbewahrungsfristen", icon: Clock, title: "Aufbewahrungsfristen", desc: "Genaue Fristen für alle Dokumenttypen" },
              { href: "/rechnungen-digitalisieren", icon: Receipt, title: "Rechnungen digitalisieren", desc: "Belege schnell und sicher archivieren" },
              { href: "/digital-archivieren", icon: Archive, title: "Digital archivieren", desc: "Schritt-für-Schritt zum papierlosen Büro" },
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

      <Footer />
    </div>
  );
}
