import { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, FileText, Shield, ArrowRight, CheckCircle2, AlertTriangle, Home, Heart, Briefcase, Car, Receipt, BookOpen } from "lucide-react";

const tableData = [
  {
    category: "Steuer & Finanzen",
    icon: Receipt,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    items: [
      { document: "Steuererklärung & Bescheide", duration: "4 Jahre", note: "Empfohlen: 10 Jahre bei Nachfragen" },
      { document: "Belege zur Steuererklärung", duration: "4 Jahre", note: "Ab Ende des Steuerjahres" },
      { document: "Gehaltsabrechnungen", duration: "Bis zur Rente", note: "Als Rentennachweis unverzichtbar" },
      { document: "Kontoauszüge", duration: "3 Jahre", note: "Bei Rechtsstreitigkeiten länger empfohlen" },
      { document: "Kreditverträge", duration: "3 Jahre", note: "Nach vollständiger Rückzahlung" },
    ]
  },
  {
    category: "Wohnen & Immobilien",
    icon: Home,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
    items: [
      { document: "Mietvertrag", duration: "Mietdauer + 3 Jahre", note: "Nach Auszug wegen Kaution & Nachforderungen" },
      { document: "Nebenkostenabrechnungen", duration: "3 Jahre", note: "Verjährungsfrist für Nachforderungen" },
      { document: "Handwerker- & Baurechnungen", duration: "5 Jahre", note: "Gewährleistungsansprüche (§ 634a BGB)" },
      { document: "Kaufvertrag Immobilie", duration: "Lebenslang", note: "Eigentumsnachweis, niemals entsorgen" },
      { document: "Grundrisse & Baupläne", duration: "Lebenslang", note: "Für Umbauten und Verkauf" },
    ]
  },
  {
    category: "Rente & Versicherungen",
    icon: Shield,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    items: [
      { document: "Rentenversicherungsnachweise", duration: "Lebenslang", note: "Lücken im Rentenkonto müssen nachgewiesen werden" },
      { document: "Lebensversicherungspolicen", duration: "Laufzeit + 3 Jahre", note: "Für eventuelle Ansprüche" },
      { document: "Krankenversicherungsnachweise", duration: "Solange aktiv + 3 Jahre", note: "" },
      { document: "Unfallberichte & Gutachten", duration: "10 Jahre", note: "Spätschäden können lange nachwirken" },
    ]
  },
  {
    category: "Gesundheit",
    icon: Heart,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    items: [
      { document: "Arztbriefe & Befunde", duration: "Lebenslang empfohlen", note: "Für Folgebehandlungen und Gutachten" },
      { document: "Impfpass", duration: "Lebenslang", note: "Original + digitale Kopie sichern" },
      { document: "Krankenhausberichte", duration: "Lebenslang empfohlen", note: "Besonders bei Operationen" },
      { document: "Rezepte & Medikamentenliste", duration: "3 Jahre", note: "Bei Dauermedikation aktuell halten" },
    ]
  },
  {
    category: "Arbeit & Bildung",
    icon: Briefcase,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    items: [
      { document: "Arbeitsverträge", duration: "Dauer Arbeitsverhältnis + 3 Jahre", note: "Für eventuelle Ansprüche nach Kündigung" },
      { document: "Zeugnisse & Zertifikate", duration: "Lebenslang", note: "Berufs- und Schulzeugnisse niemals entsorgen" },
      { document: "Abschlussunterlagen / Diplome", duration: "Lebenslang", note: "" },
      { document: "Fortbildungsnachweise", duration: "Lebenslang", note: "Für Bewerbungen und Rentennachweis" },
    ]
  },
  {
    category: "Fahrzeug & Mobilität",
    icon: Car,
    color: "text-yellow-600",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    items: [
      { document: "Fahrzeugbrief (Zulassung)", duration: "Solange im Besitz + 3 Jahre", note: "" },
      { document: "Kaufvertrag Fahrzeug", duration: "Solange im Besitz + 3 Jahre", note: "Für Gewährleistungsansprüche" },
      { document: "Hauptuntersuchung (TÜV)", duration: "Bis zur nächsten HU", note: "" },
      { document: "Kfz-Versicherungsnachweise", duration: "3 Jahre nach Ablauf", note: "" },
    ]
  },
];

const neverDiscard = [
  "Personalausweis / Reisepass (Kopien)",
  "Geburtsurkunde",
  "Heirats- oder Scheidungsurkunde",
  "Erbschein & Testament",
  "Kaufverträge für Immobilien",
  "Rentenversicherungsverlauf",
  "Schul- und Berufsabschlüsse",
  "Impfpass",
];

export default function RatgeberAufbewahrungsfristen() {
  useEffect(() => {
    document.title = "Aufbewahrungsfristen private Dokumente 2026 – Komplette Übersicht | Doklify";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Wie lange müssen Sie private Dokumente aufbewahren? Komplette Übersicht der Aufbewahrungsfristen 2026: Steuern, Mietvertrag, Arztbriefe, Gehaltsabrechnungen und mehr – mit Tabelle zum Downloaden.");
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = 'https://doklify.de/ratgeber/aufbewahrungsfristen';

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Aufbewahrungsfristen für private Dokumente 2026 – Komplette Übersicht",
      "description": "Wie lange müssen Sie private Dokumente aufbewahren? Übersicht aller Aufbewahrungsfristen für Privatpersonen in Deutschland.",
      "author": { "@type": "Organization", "name": "Doklify" },
      "publisher": { "@type": "Organization", "name": "Doklify", "url": "https://doklify.de" },
      "dateModified": "2026-03-01",
      "mainEntityOfPage": "https://doklify.de/ratgeber/aufbewahrungsfristen"
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(articleSchema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-muted/30 border-b">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/ratgeber">
              <span className="hover:text-foreground cursor-pointer transition-colors">Ratgeber</span>
            </Link>
            <span>/</span>
            <span>Aufbewahrungsfristen</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Ratgeber</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Aufbewahrungsfristen für private Dokumente 2026
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
            Welche Unterlagen müssen Sie wie lange aufbewahren — und was können Sie bedenkenlos entsorgen?
            Komplette Übersicht für Privatpersonen in Deutschland.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> 6 Kategorien</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> 8 Min. Lesezeit</span>
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> Aktualisiert März 2026</span>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-14 w-full">

        {/* Intro */}
        <div className="prose prose-slate dark:prose-invert max-w-none mb-10">
          <p className="text-muted-foreground text-lg leading-relaxed">
            Die meisten Menschen horten entweder alles — oder entsorgen zu früh. Beides ist problematisch.
            Zu früh weggeworfen kann bedeuten: fehlende Belege bei der Steuererklärung, verlorene
            Rentenansprüche oder Streit mit dem Vermieter. Zu viel aufbewahrt führt zu
            unübersichtlichen Papierstapeln, die niemand mehr durchblickt.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Diese Übersicht zeigt Ihnen für jede Dokumentenkategorie, wie lange die Aufbewahrung
            sinnvoll oder gesetzlich empfohlen ist — und was Sie getrost entsorgen können.
          </p>
        </div>

        {/* Niemals entsorgen Box */}
        <Card className="mb-10 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <h2 className="text-lg font-semibold">Diese Dokumente niemals entsorgen</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Unabhängig von Fristen: Diese Unterlagen bewahren Sie lebenslang auf — am besten digital gesichert und im Original an einem sicheren Ort.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {neverDiscard.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tables by category */}
        <div className="space-y-10">
          {tableData.map((category) => {
            const Icon = category.icon;
            return (
              <section key={category.category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${category.bg}`}>
                    <Icon className={`h-5 w-5 ${category.color}`} />
                  </div>
                  <h2 className="text-xl font-semibold">{category.category}</h2>
                </div>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left py-3 px-4 font-semibold">Dokument</th>
                        <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Aufbewahrungsdauer</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden sm:table-cell">Hinweis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {category.items.map((item) => (
                        <tr key={item.document} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium">{item.document}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 font-semibold text-primary whitespace-nowrap">
                              <Clock className="h-3.5 w-3.5" />
                              {item.duration}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{item.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>

        {/* Praktische Tipps */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold mb-6">Praktische Tipps zur Aufbewahrung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Digital sichern, Original behalten",
                text: "Digitalisieren Sie wichtige Dokumente und bewahren Sie das Original an einem sicheren Ort auf. Bei verlorenen Originalen reicht oft die digitale Kopie für Behörden."
              },
              {
                title: "Jahresmappen statt Dauerstapel",
                text: "Sortieren Sie neue Dokumente sofort nach Kategorie und Jahr. So können Sie abgelaufene Fristen einfach erkennen und ältere Jahrgänge gezielt entsorgen."
              },
              {
                title: "Fristbeginn beachten",
                text: "Die meisten Fristen starten nicht beim Ausstellungsdatum, sondern am Ende des betreffenden Jahres oder nach Vertragsende. Eine dreijährige Frist für eine Rechnung von März 2024 läuft also bis Ende 2027."
              },
              {
                title: "Notfallmappe anlegen",
                text: "Hinterlegen Sie Kopien aller lebenslang aufzubewahrenden Dokumente an einem zweiten Ort — für Angehörige im Notfall. Eine digitale Notfallmappe ist ideal."
              },
            ].map((tip) => (
              <Card key={tip.title}>
                <CardContent className="pt-5">
                  <h3 className="font-semibold mb-2">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-14 rounded-xl bg-primary/5 border border-primary/20 px-6 py-10 text-center">
          <h2 className="text-2xl font-semibold mb-3">Alle Dokumente digital organisieren</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Mit Doklify behalten Sie den Überblick: Laden Sie Ihre Unterlagen hoch, unsere KI
            kategorisiert sie automatisch — und Sie finden jedes Dokument in Sekunden wieder.
            DSGVO-konform, Server in Deutschland.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/registrieren">
              <Button size="lg" className="gap-2">
                7 Tage kostenlos testen
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/funktionen">
              <Button size="lg" variant="outline">
                Alle Funktionen ansehen
              </Button>
            </Link>
          </div>
        </section>

        {/* Weitere Ratgeber */}
        <section className="mt-14">
          <h2 className="text-xl font-semibold mb-5">Weitere Ratgeber</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/ratgeber/welche-dokumente-aufbewahren">
              <Card className="hover-elevate cursor-pointer h-full">
                <CardContent className="pt-5 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">Welche Dokumente aufbewahren?</p>
                    <p className="text-xs text-muted-foreground">Vollständige Checkliste – 7 Kategorien, 50+ Dokumente</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 mt-0.5" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/digital-archivieren">
              <Card className="hover-elevate cursor-pointer h-full">
                <CardContent className="pt-5 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">Digital archivieren</p>
                    <p className="text-xs text-muted-foreground">So digitalisieren Sie Ihren Papierkram Schritt für Schritt</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 mt-0.5" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/rechnungen-digitalisieren">
              <Card className="hover-elevate cursor-pointer h-full">
                <CardContent className="pt-5 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <Receipt className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">Rechnungen digitalisieren</p>
                    <p className="text-xs text-muted-foreground">Belege sicher digital aufbewahren und schnell wiederfinden</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 mt-0.5" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
