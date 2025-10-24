import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Brain, Camera, Mail, Scan, FolderOpen, Search, Zap, Users, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Funktionen() {
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
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Powered by OpenAI GPT-4 Vision</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight" data-testid="text-features-title">
              Intelligente Funktionen.
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Einfach zu bedienen.
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Erfahren Sie, wie MeineDokBox modernste KI-Technologie nutzt, um Ihre Dokumente 
              automatisch zu kategorisieren und zu organisieren.
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
                onClick={() => setLocation("/preise")}
                data-testid="button-hero-pricing"
              >
                Preise ansehen
              </Button>
            </div>

            {/* Feature Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
                <Camera className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground text-center">Upload-Wege</div>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
                <Brain className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">95%+</div>
                <div className="text-sm text-muted-foreground text-center">KI-Genauigkeit</div>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
                <Zap className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">KI</div>
                <div className="text-sm text-muted-foreground text-center">Automatisch</div>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
                <FolderOpen className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">15</div>
                <div className="text-sm text-muted-foreground text-center">KI-Kategorien</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KI Technology Deep Dive */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-center">
              Wie funktioniert die KI-Kategorisierung?
            </h2>
            <p className="text-xl text-muted-foreground text-center mb-12">
              MeineDokBox nutzt <strong>OpenAI GPT-4 Vision</strong> – die weltweit fortschrittlichste 
              KI für Bild- und Texterkennung.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold mb-6">Der Ablauf in 3 Schritten</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Dokument hochladen</h4>
                    <p className="text-muted-foreground">
                      Sie laden ein Foto, Scan oder PDF hoch – per App, E-Mail oder Drag & Drop.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">KI analysiert</h4>
                    <p className="text-muted-foreground">
                      GPT-4 Vision erkennt Text, Kontext und Dokumententyp. Die KI "versteht", 
                      ob es sich um eine Rechnung, einen Vertrag oder einen Brief handelt.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Automatisch kategorisiert</h4>
                    <p className="text-muted-foreground">
                      Das Dokument landet automatisch im richtigen Ordner mit einem 
                      aussagekräftigen Titel. Fertig – keine manuelle Arbeit nötig!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  KI-Kategorien
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                    <span><strong>Rechnungen</strong> – Stromrechnung, Handwerker, Online-Käufe</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                    <span><strong>Verträge</strong> – Mietverträge, Arbeitsverträge, Versicherungen</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                    <span><strong>Versicherung</strong> – Policen, Schadensmeldungen, Korrespondenz</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                    <span><strong>Briefe</strong> – Behördenschreiben, Banken, private Post</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                    <span><strong>Sonstiges</strong> – Alles andere landet hier</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Die KI arbeitet mit <strong>95%+ Genauigkeit</strong> und lernt kontinuierlich dazu.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Confidence Score */}
          <Card className="max-w-4xl mx-auto bg-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl">Confidence Score – Wie sicher ist sich die KI?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Jedes kategorisierte Dokument erhält einen <strong>Confidence Score</strong> (0-100%). 
                Das zeigt Ihnen, wie sicher sich die KI bei der Kategorisierung ist.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-semibold">90-100%:</span>
                  <span className="text-muted-foreground">Sehr sicher – typische, eindeutige Dokumente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-semibold">70-89%:</span>
                  <span className="text-muted-foreground">Sicher – Dokument passt gut zur Kategorie</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-semibold">&lt;70%:</span>
                  <span className="text-muted-foreground">Unsicher – manuell überprüfen empfohlen</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Upload Methods */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              3 Wege, Dokumente hochzuladen
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Wählen Sie die Methode, die am besten zu Ihrem Workflow passt
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Camera */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smartphone-Kamera</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Fotografieren Sie Dokumente direkt mit der Smartphone-App oder PWA.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Multi-Shot-Modus:</strong> Mehrere Dokumente hintereinander</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Auto-Optimierung:</strong> Automatische Bildverbesserung</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Perfekt für unterwegs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Email */}
            <Card className="border-2 border-primary/30">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>E-Mail-Weiterleitung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Leiten Sie Dokumente einfach an Ihre persönliche E-Mail-Adresse weiter.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Einzigartige Adresse:</strong> ihre-id@dokbox.de</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Automatisch kategorisiert</strong> inkl. E-Mail-Text</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Ideal für Online-Rechnungen</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Upload */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <Scan className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Desktop-Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Laden Sie PDFs oder gescannte Dokumente vom Computer hoch.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Drag & Drop:</strong> Dateien einfach reinziehen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Batch-Upload:</strong> Mehrere Dateien gleichzeitig</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Unterstützt: PDF, JPEG, PNG, WEBP</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Organization Features */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Intelligente Organisation
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Mehr als nur Kategorisierung – ein komplettes Organisationssystem
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Folder System */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Ordner-System</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Erstellen Sie eigene Ordner und Unterordner. Die KI kategorisiert automatisch, 
                  aber Sie können jederzeit manuell verschieben.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Unbegrenzte Ordner-Hierarchien</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Farb-Coding für schnelle Übersicht</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Drag & Drop-Organisation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Search */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Volltext-Suche</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Finden Sie jedes Dokument in Sekundenschnelle – auch in gescannten Bildern 
                  dank OCR-Texterkennung.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Suche nach Titel, Kategorie, Datum</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>OCR-Suche in Dokumenten-Text</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Filter & erweiterte Suchoptionen</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Sharing */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Familien-Accounts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Teilen Sie Dokumente sicher mit Familienmitgliedern – mit granularen Berechtigungen.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Private & geteilte Ordner</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Master/Slave-Account-System</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Token-basierte Einladungen</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Document Viewer */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <Scan className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Dokument-Viewer</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Betrachten Sie Dokumente direkt im Browser – ohne Download, auf jedem Gerät.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Vollbild-Modus für PDFs & Bilder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Download-Button für Offline-Zugriff</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Responsive auf Mobile & Desktop</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Erleben Sie die KI-Power selbst
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Starten Sie noch heute mit 14 Tagen kostenloser Testphase – ohne Kreditkarte.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/")}
            data-testid="button-features-cta"
          >
            Jetzt kostenlos testen
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
