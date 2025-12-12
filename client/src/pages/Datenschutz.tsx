import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Datenschutz() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          {/* 1. Verantwortlicher */}
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Verantwortlicher</h2>
            <p className="text-muted-foreground mb-4">
              Verantwortlich für die Datenverarbeitung auf dieser Website und in der App ist:
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

          {/* 2. Allgemeines */}
          <section>
            <h2 className="text-xl font-semibold mb-4">2. Allgemeines zur Datenverarbeitung</h2>
            <p className="text-muted-foreground">
              Wir verarbeiten personenbezogene Daten der Nutzer grundsätzlich nur, soweit dies zur Bereitstellung einer funktionsfähigen Website, App sowie unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung personenbezogener Daten erfolgt regelmäßig nur nach Einwilligung des Nutzers oder wenn eine gesetzliche Grundlage besteht.
            </p>
          </section>

          {/* 3. Hosting */}
          <section>
            <h2 className="text-xl font-semibold mb-4">3. Hosting und Infrastruktur</h2>
            
            <h3 className="text-lg font-semibold mb-3">3.1 Hosting</h3>
            <p className="text-muted-foreground mb-4">
              Unsere Website wird über die folgenden Anbieter betrieben:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
              <li>Hostinger International Ltd. (Website-Hosting)</li>
              <li>Cloudflare Inc. (Content Delivery Network und Sicherheit)</li>
              <li>Replit Inc. (Applikations-Hosting für die Web-App)</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Zwischen uns und den genannten Anbietern bestehen Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO.
              Daten können im Rahmen von Cloudflare oder Replit in die USA übermittelt werden. Die Anbieter sind nach dem EU-U.S. Data Privacy Framework zertifiziert, wodurch ein angemessenes Datenschutzniveau gewährleistet wird.
            </p>

            <h3 className="text-lg font-semibold mb-3">3.2 Dokumentenspeicherung (IONOS S3)</h3>
            <p className="text-muted-foreground mb-4">
              Hochgeladene Dokumente und Scans werden ausschließlich auf Servern der <strong>IONOS SE (Deutschland)</strong> gespeichert.
              Diese Server befinden sich innerhalb der Europäischen Union (Deutschland).
              Mit IONOS besteht ein Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO.
            </p>
            <p className="text-muted-foreground">
              Die Verarbeitung personenbezogener Daten erfolgt somit DSGVO-konform auf Grundlage von Art. 6 Abs. 1 lit. b (Vertragserfüllung) und lit. f DSGVO (berechtigtes Interesse an einer sicheren Speicherung).
            </p>
          </section>

          {/* 4. Erhebung und Speicherung */}
          <section>
            <h2 className="text-xl font-semibold mb-4">4. Erhebung und Speicherung personenbezogener Daten</h2>
            
            <h3 className="text-lg font-semibold mb-3">4.1 Registrierung und Nutzerkonto</h3>
            <p className="text-muted-foreground mb-4">
              Für die Nutzung der App ist eine Registrierung erforderlich. Hierbei werden folgende Daten erhoben und verarbeitet:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
              <li>Vorname, Nachname (optional)</li>
              <li>E-Mail-Adresse</li>
              <li>Passwort (verschlüsselt)</li>
              <li>Zeitpunkt der Registrierung und Login-Vorgänge</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
              Nach erfolgter Registrierung erhält der Nutzer eine Bestätigungs-E-Mail (Double-Opt-In).
            </p>

            <h3 className="text-lg font-semibold mb-3">4.2 Dokumentenupload</h3>
            <p className="text-muted-foreground mb-4">
              Beim Hochladen von Dokumenten oder Scans werden folgende Daten verarbeitet:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
              <li>Dateiname und -inhalt (personenbezogene Dokumente, z. B. Rechnungen)</li>
              <li>Uploadzeitpunkt</li>
              <li>zugeordnete Metadaten (z. B. Kategorie, Titel, Betrag)</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Die Verarbeitung dient der Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).
              Alle Daten werden ausschließlich auf IONOS-Servern in Deutschland gespeichert.
            </p>

            <h3 className="text-lg font-semibold mb-3">4.3 Kontaktformular</h3>
            <p className="text-muted-foreground mb-4">
              Bei Kontaktaufnahme per Formular oder E-Mail werden die übermittelten Angaben verarbeitet, um die Anfrage zu bearbeiten.
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung bzw. vorvertragliche Maßnahmen).
            </p>

            <h3 className="text-lg font-semibold mb-3">4.4 KI-gestützte Dokumentenanalyse (Azure OpenAI)</h3>
            <p className="text-muted-foreground mb-4">
              Zur automatischen Texterkennung (OCR) und intelligenten Kategorisierung Ihrer Dokumente nutzen wir den Azure OpenAI Service der Microsoft Corporation.
            </p>
            <p className="text-muted-foreground mb-4">
              Folgende Daten werden dabei verarbeitet:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
              <li>Inhalte hochgeladener Dokumente (Bilder, PDFs)</li>
              <li>Extrahierte Textinformationen (Titel, Datum, Beträge, Absender)</li>
              <li>Automatisch zugewiesene Kategorien und Schlagwörter</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              <strong>Wichtig:</strong> Die Dokumenteninhalte werden ausschließlich zur einmaligen Analyse übermittelt und nicht von Microsoft gespeichert oder für Trainingszwecke verwendet.
              Azure OpenAI unterliegt den strengen Datenschutzrichtlinien von Microsoft und kann auf EU-Servern betrieben werden.
            </p>
            <p className="text-muted-foreground mb-4">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung – die KI-Analyse ist Kernbestandteil unseres Dienstes).
            </p>
            <p className="text-muted-foreground">
              Weitere Informationen finden Sie in der{" "}
              <a href="https://learn.microsoft.com/de-de/legal/cognitive-services/openai/data-privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Azure OpenAI Datenschutzerklärung
              </a>.
            </p>
          </section>

          {/* 5. E-Mail */}
          <section>
            <h2 className="text-xl font-semibold mb-4">5. E-Mail-Kommunikation</h2>
            <p className="text-muted-foreground">
              Für den Versand von System- und Bestätigungs-E-Mails verwenden wir Mailgun Technologies, Inc.
              Mailgun ist nach dem EU-U.S. Data Privacy Framework zertifiziert, wodurch ein angemessenes Datenschutzniveau gewährleistet ist.
              Mit Mailgun besteht ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO.
            </p>
          </section>

          {/* 6. Tracking */}
          <section>
            <h2 className="text-xl font-semibold mb-4">6. Tracking & Marketing</h2>
            
            <h3 className="text-lg font-semibold mb-3">6.1 Google Ads Conversion Tracking</h3>
            <p className="text-muted-foreground mb-4">
              Unsere Website nutzt den Dienst Google Ads Conversion Tracking der Google Ireland Limited.
              Hierbei wird ein Cookie gesetzt, sobald der Nutzer über eine Google-Anzeige auf unsere Website gelangt.
              Cookies dienen der Reichweitenmessung und Erfolgsauswertung unserer Werbung.
            </p>
            <p className="text-muted-foreground mb-4">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
              Die Einwilligung erfolgt über den Cookie-Banner und kann jederzeit widerrufen werden.
            </p>

            <h3 className="text-lg font-semibold mb-3">6.2 Meta Pixel (Facebook & Instagram Ads)</h3>
            <p className="text-muted-foreground mb-4">
              Wir nutzen den „Meta Pixel" der Meta Platforms Ireland Ltd.
              Hierdurch kann das Verhalten von Besuchern nachverfolgt werden, nachdem diese eine Anzeige gesehen oder angeklickt haben.
            </p>
            <p className="text-muted-foreground mb-4">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
              Auch hier erfolgt die Steuerung über unseren Cookie-Banner.
            </p>
            <p className="text-muted-foreground mb-4">
              Daten können in die USA übermittelt werden; Meta ist nach dem EU-U.S. Data Privacy Framework zertifiziert.
            </p>

            <h3 className="text-lg font-semibold mb-3">6.3 Microsoft Clarity</h3>
            <p className="text-muted-foreground mb-4">
              Wir nutzen Microsoft Clarity, einen Webanalyse-Dienst der Microsoft Corporation.
              Clarity erstellt Heatmaps und anonymisierte Session-Aufzeichnungen, um das Nutzerverhalten auf unserer Website zu analysieren und die Benutzerfreundlichkeit zu verbessern.
            </p>
            <p className="text-muted-foreground mb-4">
              Folgende Daten werden dabei verarbeitet:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
              <li>Mausbewegungen und Klicks</li>
              <li>Scroll-Verhalten</li>
              <li>Besuchte Seiten und Verweildauer</li>
              <li>Geräteinformationen (Browser, Bildschirmgröße)</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
              Die Einwilligung erfolgt über unseren Cookie-Banner unter „Analyse Cookies" und kann jederzeit widerrufen werden.
            </p>
            <p className="text-muted-foreground">
              Daten können in die USA übermittelt werden. Microsoft ist nach dem EU-U.S. Data Privacy Framework zertifiziert.
              Weitere Informationen finden Sie in der{" "}
              <a href="https://privacy.microsoft.com/de-de/privacystatement" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Datenschutzerklärung von Microsoft
              </a>.
            </p>
          </section>

          {/* 7. Cookies */}
          <section>
            <h2 className="text-xl font-semibold mb-4">7. Cookies und Einwilligung</h2>
            <p className="text-muted-foreground mb-4">
              Beim Besuch der Website wird ein Cookie-Banner angezeigt, über das Nutzer ihre Einwilligung für Marketing-, Statistik- und Funktions-Cookies erteilen oder ablehnen können.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO.
              Die Einwilligung kann jederzeit widerrufen werden.
            </p>
          </section>

          {/* 8. Rechte */}
          <section>
            <h2 className="text-xl font-semibold mb-4">8. Rechte der betroffenen Personen</h2>
            <p className="text-muted-foreground mb-4">
              Nutzer haben jederzeit das Recht auf:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
              <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung personenbezogener Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
            </ul>
            <p className="text-muted-foreground">
              Zur Ausübung der Rechte genügt eine E-Mail an:{" "}
              <a href="mailto:service@meinedokbox.de" className="text-primary hover:underline">service@meinedokbox.de</a>
            </p>
          </section>

          {/* 9. Sicherheit */}
          <section>
            <h2 className="text-xl font-semibold mb-4">9. Sicherheit der Datenverarbeitung</h2>
            <p className="text-muted-foreground mb-4">
              Wir verwenden SSL-Verschlüsselung (HTTPS) und rollenbasierte Zugriffskontrollen.
              Passwörter werden ausschließlich gehasht gespeichert (bcrypt).
              Backups erfolgen täglich verschlüsselt auf EU-Servern.
            </p>
          </section>

          {/* 10. Änderungen */}
          <section>
            <h2 className="text-xl font-semibold mb-4">10. Änderungen dieser Datenschutzerklärung</h2>
            <p className="text-muted-foreground">
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen oder neue Funktionen anzupassen.
              Die jeweils aktuelle Version ist jederzeit unter{" "}
              <a href="https://meinedokbox.de/datenschutz" className="text-primary hover:underline">
                https://meinedokbox.de/datenschutz
              </a>{" "}
              abrufbar.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
