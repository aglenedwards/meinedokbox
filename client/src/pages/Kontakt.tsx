import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Kontakt() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

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
