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
            <p className="text-muted-foreground mt-4">
              E-Mail: <a href="mailto:service@meinedokbox.de" className="text-primary hover:underline">service@meinedokbox.de</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Verantwortlich für den Inhalt nach § 18 Abs. 2 Medienstaatsvertrag (MStV)</h2>
            <p className="text-muted-foreground">
              Alvin Edwards<br />
              Am Kümmerling 20<br />
              55294 Bodenheim
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Haftung für Inhalte</h2>
            <p className="text-muted-foreground mb-4">
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
              Nach §§ 8 bis 10 DDG sind wir jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
            </p>
            <p className="text-muted-foreground mb-4">
              Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
              Bei Bekanntwerden entsprechender Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Haftung für Links</h2>
            <p className="text-muted-foreground mb-4">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
              Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
              Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
            <p className="text-muted-foreground mb-4">
              Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft.
              Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
              Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar.
              Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Urheberrecht</h2>
            <p className="text-muted-foreground mb-4">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.
              Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
            </p>
            <p className="text-muted-foreground mb-4">
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet.
              Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis.
              Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Hinweis gemäß § 36 Verbraucherstreitbeilegungsgesetz (VSBG)</h2>
            <p className="text-muted-foreground">
              Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
