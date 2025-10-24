import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Impressum() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Impressum</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)</h2>
            <p className="text-muted-foreground">
              Alvin Edwards<br />
              Am Kümmerling 20<br />
              55294 Bodenheim<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Kontakt</h2>
            <p className="text-muted-foreground">
              E-Mail: <a href="mailto:service@meinedokbox.de" className="text-primary hover:underline">service@meinedokbox.de</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Umsatzsteuer-ID</h2>
            <p className="text-muted-foreground">
              Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: beantragt
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <p className="text-muted-foreground">
              Alvin Edwards, Anschrift wie oben
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Verbraucher­streit­beilegung / OS-Plattform</h2>
            <p className="text-muted-foreground mb-4">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a 
                href="https://ec.europa.eu/consumers/odr" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="text-muted-foreground">
              Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucher­schlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
