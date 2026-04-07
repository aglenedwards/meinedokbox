import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function AGB() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Allgemeine Geschäftsbedingungen</h1>
        <p className="text-sm text-muted-foreground mb-8">Stand: März 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-10">

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 1 Geltungsbereich</h2>
            <p className="text-muted-foreground mb-3">
              Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für alle Verträge zwischen
            </p>
            <p className="text-muted-foreground mb-3 pl-4 border-l-2 border-muted">
              Alvin Edwards<br />
              Am Kümmerling 20<br />
              55294 Bodenheim<br />
              E-Mail: <a href="mailto:service@doklify.de" className="underline">service@doklify.de</a>
            </p>
            <p className="text-muted-foreground mb-3">
              (nachfolgend „Anbieter") und natürlichen Personen, die den Dienst Doklify für private Zwecke nutzen
              (nachfolgend „Kunde" oder „Nutzer").
            </p>
            <p className="text-muted-foreground mb-3">
              Abweichende, entgegenstehende oder ergänzende Allgemeine Geschäftsbedingungen des Kunden werden nicht
              Vertragsbestandteil, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
            </p>
            <p className="text-muted-foreground">
              Doklify richtet sich ausschließlich an Verbraucher im Sinne von § 13 BGB. Eine gewerbliche Nutzung
              ist ohne vorherige schriftliche Zustimmung des Anbieters nicht gestattet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 2 Vertragsgegenstand</h2>
            <p className="text-muted-foreground mb-3">
              Doklify ist ein webbasierter Dienst zur digitalen Verwaltung persönlicher Dokumente. Der Anbieter
              stellt dem Kunden je nach gewähltem Tarif folgende Leistungen zur Verfügung:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>Upload, Speicherung und Abruf von Dokumenten (JPEG, PNG, WEBP, PDF)</li>
              <li>KI-gestützte Texterkennung (OCR) und automatische Kategorisierung von Dokumenten</li>
              <li>Ordnerbasierte Dokumentenorganisation mit Freigabefunktion</li>
              <li>Empfang von Dokumenten per E-Mail (Dokumente per E-Mail)</li>
              <li>Familienfreigabe: gemeinsame Nutzung durch mehrere Personen im Haushalt (je nach Tarif)</li>
              <li>Mobile Nutzung als Progressive Web App (PWA)</li>
            </ul>
            <p className="text-muted-foreground">
              Die Datenspeicherung erfolgt ausschließlich auf Servern in Deutschland (Frankfurt am Main) und ist
              DSGVO-konform. Details entnehmen Sie der Datenschutzerklärung unter{" "}
              <a href="/datenschutz" className="underline">doklify.de/datenschutz</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 3 Registrierung und Vertragsschluss</h2>
            <p className="text-muted-foreground mb-3">
              Voraussetzung für die Nutzung des Dienstes ist die Registrierung eines Nutzerkontos. Die Registrierung
              ist Personen ab 18 Jahren vorbehalten.
            </p>
            <p className="text-muted-foreground mb-3">
              Der Vertrag kommt zustande, wenn der Kunde:
            </p>
            <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-3">
              <li>ein Nutzerkonto erstellt (per E-Mail/Passwort oder über einen Drittanbieter-Login),</li>
              <li>einen Tarif auswählt,</li>
              <li>die Zahlungsdaten eingibt und den Zahlungsvorgang über Stripe abschließt,</li>
              <li>diese AGB sowie die Datenschutzerklärung akzeptiert.</li>
            </ol>
            <p className="text-muted-foreground">
              Der Anbieter sendet nach erfolgreicher Registrierung eine Bestätigungs-E-Mail. Diese stellt keine
              gesonderte Vertragsannahme dar, sondern dient lediglich der Information über den Vertragsschluss.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 4 Tarife und Preise</h2>
            <p className="text-muted-foreground mb-3">
              Doklify wird ausschließlich als Jahresabonnement angeboten. Folgende Tarife stehen zur Verfügung:
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm text-muted-foreground border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Tarif</th>
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Jahrespreis (brutto)</th>
                    <th className="text-left py-2 font-semibold text-foreground">Inbegriffen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2 pr-4 font-medium">Solo</td>
                    <td className="py-2 pr-4">€ 59,99 / Jahr</td>
                    <td className="py-2">1 Nutzer, 10 GB Speicher, 100 Uploads/Monat</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Familie</td>
                    <td className="py-2 pr-4">€ 99,99 / Jahr</td>
                    <td className="py-2">bis 3 Nutzer, 30 GB Speicher, 300 Uploads/Monat</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Familie Pro</td>
                    <td className="py-2 pr-4">€ 139,99 / Jahr</td>
                    <td className="py-2">bis 5 Nutzer, 100 GB Speicher, 1.000 Uploads/Monat</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground mb-3">
              Alle Preise verstehen sich als Endpreise inklusive der gesetzlichen Mehrwertsteuer.
            </p>
            <p className="text-muted-foreground">
              Der Anbieter behält sich vor, Preise mit einer Ankündigungsfrist von mindestens 4 Wochen anzupassen
              (siehe § 13). Der Kunde hat in diesem Fall das Recht zur außerordentlichen Kündigung zum Zeitpunkt
              des Inkrafttretens der neuen Preise.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 5 Kostenlose Testphase</h2>
            <p className="text-muted-foreground mb-3">
              Neukunden erhalten eine kostenlose Testphase von 7 Tagen. Für die Aktivierung der Testphase ist die
              Angabe gültiger Zahlungsdaten (Kreditkarte oder SEPA-Lastschrift) zwingend erforderlich. Während der
              Testphase werden keine Kosten erhoben.
            </p>
            <p className="text-muted-foreground mb-3">
              Wenn der Kunde nicht vor Ablauf der 7-tägigen Testphase kündigt, wird der gewählte Jahrestarif
              automatisch zum vollen Jahrespreis in Rechnung gestellt. Die Abbuchung erfolgt über den
              Zahlungsdienstleister Stripe am ersten Tag nach Ablauf der Testphase.
            </p>
            <p className="text-muted-foreground">
              Während der Testphase stehen dem Kunden alle Funktionen des gewählten Tarifs ohne Einschränkung zur
              Verfügung. Der Kunde kann die Testphase jederzeit durch Kündigung vor Ablauf der 7 Tage kostenfrei
              beenden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 6 Zahlungsbedingungen</h2>
            <p className="text-muted-foreground mb-3">
              Die Zahlung erfolgt jährlich im Voraus. Der Jahresbetrag wird mit Beginn jedes Abrechnungszeitraums
              automatisch vom hinterlegten Zahlungsmittel eingezogen. Die Zahlungsabwicklung erfolgt über den
              Zahlungsdienstleister Stripe Payments Europe, Ltd.
            </p>
            <p className="text-muted-foreground mb-3">
              Akzeptierte Zahlungsmethoden richten sich nach den von Stripe jeweils angebotenen Optionen
              (z. B. Kreditkarte, SEPA-Lastschrift). Dem Kunden wird nach jeder Zahlung eine Quittung per
              E-Mail zugesandt.
            </p>
            <p className="text-muted-foreground mb-3">
              Bei Zahlungsverzug behält sich der Anbieter vor, den Zugang zum Dienst nach einer angemessenen
              Frist einzuschränken, bis der ausstehende Betrag beglichen ist.
            </p>
            <p className="text-muted-foreground">
              Das Abonnement verlängert sich automatisch um ein weiteres Jahr, wenn es nicht fristgerecht
              gemäß § 8 gekündigt wird.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 7 Widerrufsrecht</h2>

            <div className="bg-muted/40 rounded-md p-4 mb-4">
              <p className="font-semibold mb-3">Widerrufsbelehrung</p>
              <p className="text-muted-foreground mb-3">
                <strong>Widerrufsrecht:</strong> Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen
                diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt 14 Tage ab dem Tag des Vertragsschlusses.
              </p>
              <p className="text-muted-foreground mb-3">
                Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Alvin Edwards, Am Kümmerling 20, 55294 Bodenheim,
                E-Mail: <a href="mailto:service@doklify.de" className="underline">service@doklify.de</a>)
                mittels einer eindeutigen Erklärung (z. B. eine per E-Mail übersandte Mitteilung) über Ihren
                Entschluss, diesen Vertrag zu widerrufen, informieren.
              </p>
              <p className="text-muted-foreground">
                Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des
                Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
              </p>
            </div>

            <div className="bg-muted/40 rounded-md p-4 mb-4">
              <p className="font-semibold mb-3">Widerrufsfolgen</p>
              <p className="text-muted-foreground">
                Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten
                haben, unverzüglich und spätestens binnen 14 Tagen ab dem Tag zurückzuzahlen, an dem die
                Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung
                verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt
                haben, sofern mit Ihnen nicht ausdrücklich etwas anderes vereinbart wurde.
              </p>
            </div>

            <div className="bg-muted/40 rounded-md p-4">
              <p className="font-semibold mb-3">Vorzeitiges Erlöschen des Widerrufsrechts</p>
              <p className="text-muted-foreground">
                Das Widerrufsrecht erlischt vorzeitig, wenn der Anbieter die Dienstleistung vollständig erbracht
                hat. Bei einem Dienst mit laufender Leistungserbringung (Abonnement) gilt: Wenn der Kunde
                ausdrücklich zugestimmt hat, dass der Anbieter mit der Ausführung des Vertrags vor Ablauf der
                Widerrufsfrist beginnt, und der Kunde zur Kenntnis genommen hat, dass er sein Widerrufsrecht
                mit Beginn der Vertragserfüllung verliert (§ 356 Abs. 4 BGB), erlischt das Widerrufsrecht
                mit vollständiger Vertragserfüllung. Diese Zustimmung und Kenntnisnahme erfolgt durch den
                Kunden explizit im Rahmen des Bestellprozesses (Checkout).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 8 Laufzeit und Kündigung</h2>
            <p className="text-muted-foreground mb-3">
              Das Abonnement wird für eine Laufzeit von 12 Monaten (1 Jahr) abgeschlossen und verlängert sich
              automatisch um jeweils ein weiteres Jahr, sofern es nicht fristgerecht gekündigt wird.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong>Kündigungsfrist:</strong> Das Abonnement kann mit einer Frist von mindestens 30 Tagen
              zum Ende des jeweiligen Abrechnungszeitraums gekündigt werden. Die Kündigung ist möglich:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>per E-Mail an: <a href="mailto:service@doklify.de" className="underline">service@doklify.de</a></li>
              <li>über die Kontoeinstellungen im Nutzerbereich (Einstellungen → Abonnement)</li>
            </ul>
            <p className="text-muted-foreground mb-3">
              Nach Eingang der Kündigung erhält der Kunde eine Bestätigung per E-Mail. Der Zugang zum Dienst
              bleibt bis zum Ende des bezahlten Abrechnungszeitraums bestehen.
            </p>
            <p className="text-muted-foreground">
              Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger
              Grund für den Anbieter liegt insbesondere vor, wenn der Kunde gegen diese AGB verstößt,
              falsche Angaben bei der Registrierung gemacht hat oder mit Zahlungen in Verzug ist.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 9 Keine anteilige Rückerstattung</h2>
            <p className="text-muted-foreground mb-3">
              Nach Ablauf der 14-tägigen Widerrufsfrist (§ 7) werden keine anteiligen Rückerstattungen für
              den nicht genutzten Teil des Abonnementzeitraums gewährt, wenn der Kunde das Abonnement
              vorzeitig kündigt.
            </p>
            <p className="text-muted-foreground mb-3">
              Kündigt der Kunde beispielsweise 3 Monate vor Ablauf des Jahresabonnements, läuft der Zugang
              bis zum Ende des bezahlten Abrechnungsjahres weiter. Eine Rückzahlung der verbleibenden
              9 Monatswerte findet nicht statt.
            </p>
            <p className="text-muted-foreground">
              Ausnahmen hiervon gelten ausschließlich bei nachgewiesener dauerhafter Nichtverfügbarkeit
              des Dienstes (mehr als 30 aufeinanderfolgende Tage) oder bei einer wesentlichen
              Einschränkung der vertraglich vereinbarten Leistungen durch den Anbieter.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 10 Datenschutz</h2>
            <p className="text-muted-foreground mb-3">
              Der Anbieter verarbeitet personenbezogene Daten des Kunden ausschließlich zur Vertragserfüllung
              und im Einklang mit der Datenschutz-Grundverordnung (DSGVO) sowie dem Bundesdatenschutzgesetz
              (BDSG).
            </p>
            <p className="text-muted-foreground mb-3">
              Alle Daten werden auf Servern in Deutschland (Frankfurt am Main, IONOS SE) gespeichert und
              verlassen nicht die Europäische Union. Detaillierte Informationen zur Datenverarbeitung,
              zu den Rechten des Nutzers und zur Datensicherheit finden sich in der Datenschutzerklärung:
            </p>
            <p className="text-muted-foreground">
              <a href="/datenschutz" className="underline">doklify.de/datenschutz</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 11 Nutzungsregeln und Pflichten des Kunden</h2>
            <p className="text-muted-foreground mb-3">
              Der Kunde verpflichtet sich:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>den Dienst ausschließlich für private Zwecke und im Rahmen dieser AGB zu nutzen;</li>
              <li>keine rechtswidrigen, anstößigen oder die Rechte Dritter verletzenden Inhalte hochzuladen;</li>
              <li>Zugangsdaten vertraulich zu behandeln und nicht an Dritte weiterzugeben;</li>
              <li>den Anbieter unverzüglich zu informieren, wenn Zugangsdaten Dritten bekannt geworden sind;</li>
              <li>keine automatisierten Zugriffe (Scraping, Bots) auf den Dienst durchzuführen.</li>
            </ul>
            <p className="text-muted-foreground mb-3">
              Familienmitglieder können auf Einladung des Hauptnutzers Zugang zum Familien-Account erhalten.
              Jedes Familienmitglied muss die Nutzungsbedingungen akzeptieren und ist für die eigene
              Nutzung selbst verantwortlich.
            </p>
            <p className="text-muted-foreground">
              Der Kunde ist für die Sicherung seiner Daten mitverantwortlich. Der Anbieter stellt
              eine Export-Funktion (ZIP-Download) bereit. Die Nutzung dieser Funktion zur regelmäßigen
              Datensicherung wird empfohlen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 12 Verfügbarkeit und Haftungsbeschränkung</h2>
            <p className="text-muted-foreground mb-3">
              Der Anbieter strebt eine Verfügbarkeit des Dienstes von 99 % im Jahresdurchschnitt an.
              Geplante Wartungsfenster werden nach Möglichkeit angekündigt. Ein Rechtsanspruch auf eine
              bestimmte Verfügbarkeit besteht nicht.
            </p>
            <p className="text-muted-foreground mb-3">
              Die Haftung des Anbieters ist auf Vorsatz und grobe Fahrlässigkeit beschränkt. Bei
              leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher
              Vertragspflichten (Kardinalpflichten), und auch dann nur für den vorhersehbaren,
              vertragstypischen Schaden.
            </p>
            <p className="text-muted-foreground mb-3">
              Der Anbieter haftet nicht für:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-3">
              <li>Datenverluste, die durch fehlerhafte Bedienung des Kunden entstehen;</li>
              <li>Schäden durch unbefugten Zugriff Dritter, sofern der Anbieter die branchenüblichen
                Sicherheitsstandards eingehalten hat;</li>
              <li>Ausfälle oder Einschränkungen durch höhere Gewalt (z. B. Naturkatastrophen,
                Cyberangriffe auf Drittdienste, gesetzliche Maßnahmen);</li>
              <li>die Richtigkeit der KI-gestützten Texterkennung und Kategorisierung — diese dienen
                der Unterstützung und sind vom Kunden zu überprüfen.</li>
            </ul>
            <p className="text-muted-foreground">
              Die Haftungsbeschränkungen gelten nicht bei Verletzung von Leben, Körper oder Gesundheit
              sowie bei Ansprüchen nach dem Produkthaftungsgesetz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 13 Leistungsänderungen und Anpassung der AGB</h2>
            <p className="text-muted-foreground mb-3">
              Der Anbieter behält sich vor, den Funktionsumfang des Dienstes weiterzuentwickeln, zu erweitern
              oder anzupassen, sofern dies zumutbar ist und die wesentlichen Vertragspflichten nicht
              beeinträchtigt werden.
            </p>
            <p className="text-muted-foreground mb-3">
              Änderungen dieser AGB sowie Preisanpassungen werden dem Kunden mindestens 4 Wochen vor
              Inkrafttreten per E-Mail mitgeteilt. Widerspricht der Kunde der Änderung nicht innerhalb
              von 4 Wochen nach Zugang der Mitteilung, gelten die geänderten AGB als angenommen.
              Auf dieses Widerspruchsrecht und die Folgen des Schweigens wird in der Mitteilung
              ausdrücklich hingewiesen.
            </p>
            <p className="text-muted-foreground">
              Widerspricht der Kunde fristgerecht, ist er berechtigt, das Abonnement zum Zeitpunkt
              des Inkrafttretens der Änderungen außerordentlich zu kündigen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 14 Außergerichtliche Streitbeilegung</h2>
            <p className="text-muted-foreground mb-3">
              Die Europäische Kommission stellt unter{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>{" "}
              eine Online-Plattform zur außergerichtlichen Streitbeilegung (OS-Plattform) bereit.
            </p>
            <p className="text-muted-foreground">
              Der Anbieter ist weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§ 15 Schlussbestimmungen</h2>
            <p className="text-muted-foreground mb-3">
              Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
              Zwingende Verbraucherschutzvorschriften des Staates, in dem der Kunde seinen gewöhnlichen
              Aufenthalt hat, bleiben unberührt.
            </p>
            <p className="text-muted-foreground mb-3">
              Gerichtsstand für Streitigkeiten mit Kaufleuten, juristischen Personen des öffentlichen
              Rechts oder öffentlich-rechtlichen Sondervermögen ist Mainz, Rheinland-Pfalz. Für
              Verbraucher gilt der gesetzliche Gerichtsstand.
            </p>
            <p className="text-muted-foreground">
              Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden,
              bleibt die Wirksamkeit der übrigen Bestimmungen davon unberührt. An die Stelle der
              unwirksamen Bestimmung tritt die gesetzliche Regelung (salvatorische Klausel).
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
