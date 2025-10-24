import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Heart, Target, Eye, Compass, Shield, Zap, Users, ArrowRight, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function UeberUns() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 hero-premium-bg">
        {/* Premium Mesh Gradient Background */}
        <div className="absolute inset-0 hero-mesh-gradient" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/80 backdrop-blur-sm mb-8 shadow-lg">
              <Heart className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Made with ❤️ in Germany</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight" data-testid="text-about-title">
              Über 
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                MeineDokBox
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Wir glauben, dass Dokumentenverwaltung im 21. Jahrhundert einfach, sicher und intelligent sein sollte.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button
                size="lg"
                className="text-lg px-8 py-6"
                onClick={() => setLocation("/")}
                data-testid="button-hero-start"
              >
                Jetzt kostenlos testen
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 bg-background/50 backdrop-blur-sm"
                onClick={() => setLocation("/funktionen")}
                data-testid="button-hero-features"
              >
                Mehr erfahren
              </Button>
            </div>

            {/* Company Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
                <MapPin className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-muted-foreground text-center">Deutschland</div>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
                <Shield className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">DSGVO</div>
                <div className="text-sm text-muted-foreground text-center">Konform</div>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border col-span-2 md:col-span-1">
                <Users className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">Für alle</div>
                <div className="text-sm text-muted-foreground text-center">Einfach & sicher</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Unsere Mission</h2>
            </div>
            
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-8">
                <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                  <strong className="text-foreground">Papierkram für alle vereinfachen</strong> – und dabei höchste 
                  Datenschutz-Standards einhalten.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Jeder kennt es: Wichtige Dokumente gehen verloren, Ordner quellen über, und die Suche nach 
                  einer bestimmten Rechnung dauert ewig. Wir haben MeineDokBox entwickelt, um genau diese 
                  Probleme zu lösen – mit modernster KI-Technologie, die so einfach zu bedienen ist, dass sie 
                  jeder nutzen kann.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10">
                <Eye className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Unsere Vision</h2>
            </div>
            
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-8">
                <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                  <strong className="text-foreground">Eine Welt, in der niemand mehr Zeit mit Papierkram verschwendet.</strong>
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Wir träumen von einer Zukunft, in der Dokumente automatisch dort landen, wo sie hingehören. 
                  Wo Sie jedes Dokument in Sekundenschnelle finden – egal ob Steuerunterlagen von vor 3 Jahren 
                  oder die Rechnung von letzter Woche.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  MeineDokBox ist der erste Schritt auf diesem Weg. Wir bauen das intelligenteste 
                  Dokumentenmanagement-System, das es je gab – und dabei bleibt es zu 100% in Deutschland.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10">
                <Compass className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Unsere Werte</h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Privacy First */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Datenschutz First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Ihre Daten gehören Ihnen – nicht uns, nicht der KI, niemandem sonst. 
                  100% Deutschland, 100% DSGVO, 100% Transparenz.
                </p>
              </CardContent>
            </Card>

            {/* Simplicity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Einfachheit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Technologie sollte das Leben leichter machen, nicht komplizierter. 
                  Wir bauen Werkzeuge, die jeder sofort verstehen kann.
                </p>
              </CardContent>
            </Card>

            {/* Innovation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Innovation mit Verantwortung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Wir nutzen die neueste KI-Technologie – aber immer mit Blick auf 
                  Datenschutz, Sicherheit und ethische Standards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Warum MeineDokBox?
            </h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Das Problem</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Die meisten Menschen verschwenden <strong>Stunden pro Monat</strong> mit der Suche nach 
                    Dokumenten. Ordner stapeln sich, wichtige Unterlagen gehen verloren, und niemand hat 
                    Lust, stundenlang zu sortieren. Cloud-Lösungen aus den USA? Datenschutzrechtlich fragwürdig. 
                    Komplexe Enterprise-Software? Zu teuer und zu kompliziert für Privatpersonen.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Die Lösung</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    MeineDokBox kombiniert das Beste aus zwei Welten:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">1</span>
                      </div>
                      <div>
                        <strong className="text-foreground">Modernste KI-Technologie</strong>
                        <p className="text-sm text-muted-foreground">
                          OpenAI GPT-4 Vision erkennt und kategorisiert Dokumente automatisch – 
                          besser als jeder Mensch es manuell könnte.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">2</span>
                      </div>
                      <div>
                        <strong className="text-foreground">Made & Hosted in Germany</strong>
                        <p className="text-sm text-muted-foreground">
                          Alle Daten bleiben in Deutschland (IONOS Frankfurt). DSGVO-konform, 
                          BSI-zertifiziert, ohne Umwege über die USA oder andere Drittstaaten.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">3</span>
                      </div>
                      <div>
                        <strong className="text-foreground">Einfach zu bedienen</strong>
                        <p className="text-sm text-muted-foreground">
                          Foto machen oder E-Mail weiterleiten – fertig. Keine komplizierte Einrichtung, 
                          keine Schulungen, keine Handbücher.
                        </p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Für wen ist MeineDokBox?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Privatpersonen & Familien
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Verträge, Rechnungen, Versicherungen – alles an einem Ort. 
                        Teilen Sie Dokumente sicher mit Ihrer Familie.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Freiberufler & Selbstständige
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Kundenprojekte, Belege, Steuerdokumente – automatisch organisiert. 
                        Sparen Sie Zeit für Ihr Kerngeschäft.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Kleine Unternehmen
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Team-basierte Dokumentenverwaltung ohne teure Enterprise-Lizenz. 
                        DSGVO-konform für Ihre Kundendaten.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Datenschutz-Bewusste
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Sie möchten keine Cloud aus den USA? Perfekt – MeineDokBox 
                        ist 100% deutsch und DSGVO-konform.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Fragen? Feedback? Wir sind für Sie da!
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Kontaktieren Sie uns jederzeit – wir antworten in der Regel innerhalb von 24 Stunden.
            </p>
            
            <Card className="mb-8">
              <CardContent className="pt-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">E-Mail Support</h3>
                    <a 
                      href="mailto:service@meinedokbox.de" 
                      className="text-primary hover:underline text-lg"
                    >
                      service@meinedokbox.de
                    </a>
                  </div>
                  
                  
                </div>
              </CardContent>
            </Card>

            <Button
              size="lg"
              onClick={() => setLocation("/kontakt")}
              variant="outline"
              data-testid="button-contact-page"
            >
              Zum Kontaktformular
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Werden Sie Teil der MeineDokBox-Familie
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Starten Sie noch heute mit 14 Tagen kostenloser Testphase – ohne Kreditkarte.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/")}
            data-testid="button-about-cta"
          >
            Jetzt kostenlos testen
            <Heart className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
