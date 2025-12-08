import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Search, Shield, Sparkles, ArrowRight, Check, FileText, Lock, Cloud, Menu } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export default function DigitalArchivieren() {
  useEffect(() => {
    document.title = "Digital archivieren | Digitale Dokumentenablage | MeineDokBox";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Digital archivieren mit MeineDokBox: Ihre digitale Dokumentenablage für private Dokumente. Archivierung digital, sicher und DSGVO-konform in Deutschland.");
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
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Schluss mit Papierstapeln und Aktenordnern. Mit MeineDokBox archivieren Sie Ihre Dokumente digital – 
              strukturiert, sicher und jederzeit griffbereit.
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
              Digitale Dokumentenablage – so funktioniert's
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Archivierung digital leicht gemacht: Vom Papierdokument zum geordneten digitalen Archiv
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg" data-testid="card-step-1">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">Dokumente erfassen</h3>
                <p className="text-muted-foreground">
                  Fotografieren, hochladen oder per E-Mail weiterleiten – Ihre Dokumente kommen einfach an.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg" data-testid="card-step-2">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3">KI sortiert automatisch</h3>
                <p className="text-muted-foreground">
                  Unsere KI erkennt den Dokumententyp und ordnet ihn der richtigen Kategorie zu.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg" data-testid="card-step-3">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <FolderOpen className="h-8 w-8 text-primary" />
                </div>
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3">Digital archiviert</h3>
                <p className="text-muted-foreground">
                  Ihre Dokumente sind sicher gespeichert und jederzeit durchsuchbar.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Archivierung von Ordnern – endlich digital
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ersetzen Sie physische Aktenordner durch Ihre digitale Dokumentenablage
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Sofort finden statt lange suchen</h3>
                    <p className="text-muted-foreground">
                      Durchsuchen Sie Tausende Dokumente in Sekunden. Die Volltextsuche findet jeden Beleg.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Cloud className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Von überall zugreifen</h3>
                    <p className="text-muted-foreground">
                      Ihre Dokumente sind auf jedem Gerät verfügbar – Smartphone, Tablet oder Computer.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Sicher in Deutschland gespeichert</h3>
                    <p className="text-muted-foreground">
                      DSGVO-konforme Speicherung auf deutschen Servern. Ihre Daten bleiben privat.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Kein Dokumentenverlust mehr</h3>
                    <p className="text-muted-foreground">
                      Digitale Archivierung schützt vor Wasserschäden, Feuer und Verlust.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Diese Dokumente können Sie digital archivieren
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
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
                "Behördenschreiben"
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

      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Starten Sie jetzt mit der digitalen Archivierung
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
