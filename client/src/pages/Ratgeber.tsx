import { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ArrowRight, BookOpen, Receipt, Home, Shield } from "lucide-react";

const ratgeber = [
  {
    href: "/ratgeber/aufbewahrungsfristen",
    icon: Clock,
    category: "Organisation",
    title: "Aufbewahrungsfristen für private Dokumente",
    description: "Wie lange müssen Sie Steuerbescheide, Mietverträge, Arztbriefe und Gehaltsabrechnungen aufbewahren? Komplette Übersicht 2026.",
    readTime: "8 Min.",
  },
  {
    href: "/digital-archivieren",
    icon: BookOpen,
    category: "Digitalisierung",
    title: "Digital archivieren – Schritt für Schritt",
    description: "So bringen Sie Ordnung in Ihren Papierkram: vom ersten Foto bis zur fertigen digitalen Dokumentenablage.",
    readTime: "6 Min.",
  },
  {
    href: "/rechnungen-digitalisieren",
    icon: Receipt,
    category: "Digitalisierung",
    title: "Rechnungen digitalisieren und sicher aufbewahren",
    description: "Belege per Smartphone abfotografieren, automatisch kategorisieren lassen und jederzeit wiederfinden.",
    readTime: "5 Min.",
  },
  {
    href: "/post-digitalisieren",
    icon: Home,
    category: "Organisation",
    title: "Post digitalisieren – kein Papierchaos mehr",
    description: "Eingehende Post direkt digitalisieren: So bauen Sie ein papierloses Zuhause auf.",
    readTime: "5 Min.",
  },
  {
    href: "/ratgeber/welche-dokumente-aufbewahren",
    icon: Shield,
    category: "Organisation",
    title: "Welche Dokumente aufbewahren? Checkliste 2026",
    description: "Vollständige Übersicht: 7 Kategorien, 50+ Dokumenttypen — welche Unterlagen Sie wirklich brauchen.",
    readTime: "10 Min.",
  },
];

export default function Ratgeber() {
  useEffect(() => {
    document.title = "Ratgeber – Dokumente organisieren & digitalisieren | Doklify";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Praktische Ratgeber rund um Dokumentenorganisation, Aufbewahrungsfristen und digitale Archivierung für Privatpersonen in Deutschland.");
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = 'https://doklify.de/ratgeber';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-muted/30 border-b">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Ratgeber</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Ratgeber: Dokumente organisieren & digitalisieren
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Praktische Tipps für einen papierlosen Haushalt — von Aufbewahrungsfristen bis zur
            digitalen Dokumentenablage.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-14 w-full">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ratgeber.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="hover-elevate cursor-pointer h-full">
                  <CardContent className="pt-6 pb-6 flex flex-col h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{item.category}</span>
                        <h2 className="text-base font-semibold mt-0.5 leading-snug">{item.title}</h2>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {item.readTime} Lesezeit
                      </span>
                      <span className="flex items-center gap-1 text-sm text-primary font-medium">
                        Lesen
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Highlight: Aufbewahrungsfristen */}
        <section className="mt-14 rounded-xl bg-muted/40 border px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Dokumente sicher digital aufbewahren</h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-xl">
                Statt Papierstapeln in Ordnern: Mit Doklify laden Sie Ihre Dokumente einmalig hoch,
                die KI kategorisiert automatisch — und Sie finden alles in Sekunden. Server in Deutschland,
                DSGVO-konform.
              </p>
              <Link href="/registrieren">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer">
                  7 Tage kostenlos testen
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
