import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, MapPin } from "lucide-react";
import { Footer } from "@/components/Footer";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export default function Kontakt() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-3 hover-elevate px-3 py-2 rounded-md transition-colors" data-testid="link-home">
              <img src={logoImage} alt="MeineDokBox Logo" className="h-8 w-8" />
              <span className="text-xl font-bold">MeineDokBox</span>
            </a>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Kontakt</h1>
        <p className="text-muted-foreground mb-8">
          Wir sind für Sie da! Kontaktieren Sie uns bei Fragen oder Anliegen.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                E-Mail
              </CardTitle>
              <CardDescription>
                Schreiben Sie uns eine Nachricht
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a 
                href="mailto:service@meinedokbox.de" 
                className="text-primary hover:underline font-medium"
                data-testid="link-email"
              >
                service@meinedokbox.de
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                Wir antworten in der Regel innerhalb von 24 Stunden.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Postanschrift
              </CardTitle>
              <CardDescription>
                Unsere Geschäftsadresse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <address className="not-italic text-muted-foreground">
                Alvin Edwards<br />
                Am Kümmerling 20<br />
                55294 Bodenheim<br />
                Deutschland
              </address>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Support-Zeiten</CardTitle>
            <CardDescription>
              Wann Sie mit einer Antwort rechnen können
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montag - Freitag:</span>
              <span className="font-medium">9:00 - 18:00 Uhr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Samstag - Sonntag:</span>
              <span className="font-medium">Geschlossen</span>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
