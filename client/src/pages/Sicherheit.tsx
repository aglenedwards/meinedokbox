import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shield, Lock, Server, FileCheck, CheckCircle2, Award, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Sicherheit() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm mb-6">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Höchste Sicherheitsstandards</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="text-security-title">
            Ihre Daten.<br />Sicher in Deutschland.
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            MeineDokBox setzt auf höchste Sicherheitsstandards. Alle Dokumente werden ausschließlich 
            auf zertifizierten Servern in Deutschland gespeichert – DSGVO-konform und ohne Umwege über Drittstaaten.
          </p>
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
                  Alle Ihre Dokumente werden ausschließlich in IONOS-Rechenzentren in Frankfurt am Main gespeichert. 
                  Keine Datenübertragung in Drittstaaten außerhalb der EU.
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
                    Alle Dokumente werden auf IONOS Object Storage Servern im Rechenzentrum Frankfurt (eu-central-4) 
                    gespeichert. Die Datenbank läuft auf Neon PostgreSQL (ebenfalls EU-Region). 
                    Keinerlei Datenübertragung außerhalb Deutschlands bzw. der EU.
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
            Starten Sie noch heute mit 14 Tagen kostenloser Testphase – ohne Kreditkarte.
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
