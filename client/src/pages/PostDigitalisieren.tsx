import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Camera, FolderOpen, Sparkles, ArrowRight, Check, Bell, Search, Shield, Menu } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export default function PostDigitalisieren() {
  useEffect(() => {
    document.title = "Post digitalisieren privat | Digitaler Briefkasten | MeineDokBox";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Post digitalisieren privat: Ihr digitaler Briefkasten mit MeineDokBox. Briefe scannen, automatisch einsortieren und sicher archivieren.");
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
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Verwandeln Sie Ihre Briefpost in digitale Dokumente. Scannen Sie Briefe, Rechnungen und Bescheide – 
              automatisch einsortiert und jederzeit abrufbar.
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
              So funktioniert Ihr digitaler Briefkasten
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Post digitalisieren in 3 einfachen Schritten
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg" data-testid="card-step-1">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">Post fotografieren</h3>
                <p className="text-muted-foreground">
                  Öffnen Sie die App und fotografieren Sie den Brief mit Ihrem Smartphone.
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
                <h3 className="text-xl font-semibold mb-3">KI analysiert</h3>
                <p className="text-muted-foreground">
                  Die KI erkennt Absender, Datum und Inhalt – automatisch und in Sekunden.
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
                <h3 className="text-xl font-semibold mb-3">Automatisch sortiert</h3>
                <p className="text-muted-foreground">
                  Der Brief landet in der richtigen Kategorie – von Versicherung bis Behörde.
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
              Vorteile Ihres digitalen Briefkastens
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Warum immer mehr Menschen ihre Post digitalisieren
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Sofort finden</h3>
                <p className="text-sm text-muted-foreground">
                  Nie wieder in Ordnern wühlen – alles ist durchsuchbar.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Fristen im Blick</h3>
                <p className="text-sm text-muted-foreground">
                  Zahlungserinnerungen für offene Rechnungen.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Sicher archiviert</h3>
                <p className="text-sm text-muted-foreground">
                  DSGVO-konform auf deutschen Servern.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">E-Mail-Eingang</h3>
                <p className="text-sm text-muted-foreground">
                  Digitale Post automatisch importieren.
                </p>
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
                Diese Post können Sie digitalisieren
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Rechnungen & Mahnungen",
                "Versicherungsschreiben",
                "Behördenpost",
                "Steuerbescheide",
                "Bankauszüge",
                "Vertragsunterlagen",
                "Arztbriefe",
                "Kündigungsbestätigungen",
                "Lohnabrechnungen",
                "Garantiebelege"
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
            Starten Sie Ihren digitalen Briefkasten
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
