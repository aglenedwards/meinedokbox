import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export default function Datenschutz() {
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
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Datenschutz auf einen Blick</h2>
            <h3 className="text-lg font-semibold mb-3">Allgemeine Hinweise</h3>
            <p className="text-muted-foreground mb-4">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Verantwortliche Stelle</h2>
            <p className="text-muted-foreground mb-4">
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
            </p>
            <p className="text-muted-foreground">
              Alvin Edwards<br />
              Am Kümmerling 20<br />
              55294 Bodenheim<br />
              Deutschland<br />
              <br />
              E-Mail: <a href="mailto:service@meinedokbox.de" className="text-primary hover:underline">service@meinedokbox.de</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Datenerfassung auf dieser Website</h2>
            <h3 className="text-lg font-semibold mb-3">Cookies</h3>
            <p className="text-muted-foreground mb-4">
              Unsere Website verwendet Cookies. Das sind kleine Textdateien, die Ihr Webbrowser auf Ihrem Endgerät speichert. Cookies helfen uns dabei, unser Angebot nutzerfreundlicher und effektiver zu machen.
            </p>
            
            <h3 className="text-lg font-semibold mb-3">Server-Log-Dateien</h3>
            <p className="text-muted-foreground mb-4">
              Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Ihre Rechte</h2>
            <p className="text-muted-foreground">
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.
            </p>
          </section>

          <section className="bg-muted/30 p-6 rounded-lg">
            <p className="text-sm text-muted-foreground italic">
              Diese Datenschutzerklärung befindet sich noch in Bearbeitung. Eine vollständige Version wird in Kürze verfügbar sein.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
