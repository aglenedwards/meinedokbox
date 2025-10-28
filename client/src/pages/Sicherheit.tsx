import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shield, Lock, Server, FileCheck, CheckCircle2, Award, Globe, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Sicherheit() {
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
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">C5-Testat & ISO 27001 zertifiziert</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight" data-testid="text-security-title">
              Ihre Daten.
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Sicher in Deutschland.
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              MeineDokBox setzt auf höchste Sicherheitsstandards. Alle Dokumente werden ausschließlich 
              auf zertifizierten Servern in Deutschland gespeichert – DSGVO-konform.
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

            {/* Security Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
                <Server className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-muted-foreground text-center">Deutschland</div>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
                <Lock className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">AES-256</div>
                <div className="text-sm text-muted-foreground text-center">Verschlüsselung</div>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
                <Award className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">C5</div>
                <div className="text-sm text-muted-foreground text-center">BSI-Testat</div>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
                <Globe className="h-8 w-8 text-primary mb-1" />
                <div className="text-2xl font-bold">DSGVO</div>
                <div className="text-sm text-muted-foreground text-center">Konform</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IONOS Certifications */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              IONOS – Vorreiter bei Cloud-Sicherheit
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Wir nutzen IONOS Object Storage in Frankfurt. IONOS ist der <strong>erste deutsche Cloud-Anbieter</strong>, 
              der sowohl das C5-Testat als auch die Zertifizierung nach IT-Grundschutz des BSI vorweisen kann.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            {/* C5 Testat */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl mb-2">C5-Testat (BSI)</CardTitle>
                    <p className="text-sm text-muted-foreground">Bundesamt für Sicherheit in der Informationstechnik</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Der Cloud Computing Compliance Criteria Catalog (C5) definiert die <strong>Mindestanforderungen 
                  für sicheres Cloud Computing</strong> und ist für im öffentlichen Sektor eingesetzte Clouds Pflicht.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Höchste Sicherheitsstandards für Behörden</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Regelmäßige Audits durch unabhängige Prüfer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Strenge Kontrollen der Infrastruktur</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* ISO 27001 IT-Grundschutz */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl mb-2">ISO 27001 IT-Grundschutz</CardTitle>
                    <p className="text-sm text-muted-foreground">Informationssicherheits-Managementsystem</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Das BSI bescheinigt IONOS die Umsetzung der notwendigen <strong>IT-Sicherheitsmaßnahmen 
                  und eines Managementsystems</strong> für Informationssicherheit (ISMS).
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">International anerkannte Zertifizierung</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Kontinuierliche Verbesserung der Sicherheit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Dokumentierte Sicherheitsprozesse</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Stand: November 2023 | Quelle: IONOS SE
            </p>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Unsere Sicherheitsmaßnahmen
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Mehrschichtige Sicherheit zum Schutz Ihrer vertraulichen Dokumente
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Server-Standort */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Server-Standort Deutschland</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Alle Ihre Dokumente werden ausschließlich in IONOS-Rechenzentren in Frankfurt am Main gespeichert 
                  (EU-Region). Personenbezogene Daten verbleiben in der EU – Übermittlung in Drittländer nur bei 
                  technischer Notwendigkeit und mit rechtlicher Absicherung durch das EU-U.S. Data Privacy Framework.
                </p>
              </CardContent>
            </Card>

            {/* Verschlüsselung */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Ende-zu-Ende-Verschlüsselung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Ihre Dokumente werden sowohl bei der Übertragung (TLS 1.3) als auch im Ruhezustand (AES-256) 
                  verschlüsselt. Höchster Verschlüsselungsstandard wie bei Banken.
                </p>
              </CardContent>
            </Card>

            {/* DSGVO */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>100% DSGVO-konform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Vollständige Einhaltung der Datenschutz-Grundverordnung. Sie behalten die volle Kontrolle 
                  über Ihre Daten – jederzeit Export oder Löschung möglich.
                </p>
              </CardContent>
            </Card>

            {/* Access Control */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Zugriffskontrolle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Granulare Berechtigungssysteme für Familien-Accounts. Private und geteilte Ordner 
                  ermöglichen selektives Teilen von Dokumenten.
                </p>
              </CardContent>
            </Card>

            {/* Backup */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Automatische Backups</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tägliche, automatische Backups Ihrer Daten an geografisch getrennten Standorten innerhalb 
                  Deutschlands. Schutz vor Datenverlust.
                </p>
              </CardContent>
            </Card>

            {/* Authentication */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Sichere Authentifizierung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Starke Passwort-Policies, E-Mail-Verifizierung und sichere Session-Verwaltung. 
                  Optional: Zwei-Faktor-Authentifizierung (in Planung).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Transparency Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Transparenz & Ihre Rechte
            </h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Wo werden meine Daten gespeichert?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Alle Dokumente werden ausschließlich auf IONOS Object Storage Servern im Rechenzentrum Frankfurt 
                    (eu-central-4) gespeichert. Die Datenbank läuft auf Neon PostgreSQL (EU-Region). 
                    Sämtliche personenbezogenen Daten verbleiben in der Europäischen Union – eine Übermittlung in 
                    Drittländer findet nur statt, wenn dies technisch erforderlich und durch das EU-U.S. Data Privacy 
                    Framework rechtlich abgesichert ist.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Wer hat Zugriff auf meine Daten?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nur Sie und die von Ihnen autorisierten Familienmitglieder. Unser Team hat keinerlei 
                    Zugriff auf Ihre Dokumente. Technische Wartungsarbeiten erfolgen ausschließlich auf 
                    Infrastrukturebene ohne Einsicht in Nutzerinhalte.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kann ich meine Daten exportieren oder löschen?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Ja, jederzeit. Sie können alle Ihre Dokumente über die Download-Funktion herunterladen. 
                    Account-Löschungen entfernen alle persönlichen Daten innerhalb von 30 Tagen endgültig 
                    aus allen Systemen – wie es die DSGVO vorschreibt.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Werden meine Daten für KI-Training verwendet?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nein, niemals. Die KI-Analyse erfolgt ausschließlich zur Kategorisierung Ihrer Dokumente. 
                    Ihre Inhalte werden nicht gespeichert, trainiert oder anderweitig verwertet. 
                    OpenAI verarbeitet die Daten nur im Auftrag und löscht sie nach der Verarbeitung.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Überzeugt? Probieren Sie es aus!
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Starten Sie noch heute mit 7 Tagen kostenloser Testphase – ohne Kreditkarte.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/")}
            data-testid="button-security-cta"
          >
            Jetzt kostenlos testen
            <Shield className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
