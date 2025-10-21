# Mailgun Konfiguration für MeineDokBox

Diese Anleitung erklärt, wie Sie Mailgun einrichten, damit Benutzer Dokumente per E-Mail an ihre persönlichen Adressen senden können.

## Voraussetzungen

- ✅ Mailgun-Account erstellt
- ✅ API-Keys in Replit Secrets gespeichert:
  - `MAILGUN_API_KEY`
  - `MAILGUN_DOMAIN`
  - `MAILGUN_WEBHOOK_SIGNING_KEY`

## Schritt 1: Domain in Mailgun hinzufügen

### Option A: Eigene Domain (Empfohlen)

1. **Domain registrieren** (falls noch nicht vorhanden)
   - Registrieren Sie `meinedokbox.de` bei einem Domain-Registrar

2. **Domain zu Mailgun hinzufügen**
   - Gehen Sie zu Mailgun Dashboard → "Sending" → "Domains"
   - Klicken Sie auf "Add New Domain"
   - Geben Sie `in.meinedokbox.de` ein
   - Wählen Sie die Region (EU für DSGVO-Konformität empfohlen)

3. **DNS-Records konfigurieren**
   
   Mailgun zeigt Ihnen die erforderlichen DNS-Records. Fügen Sie diese in Ihren Domain-Einstellungen hinzu:

   **MX Records** (für eingehende E-Mails):
   ```
   Typ: MX
   Host: in.meinedokbox.de
   Wert: mxa.mailgun.org
   Priorität: 10
   
   Typ: MX
   Host: in.meinedokbox.de
   Wert: mxb.mailgun.org
   Priorität: 10
   ```

   **TXT Records** (für Verifizierung und SPF):
   ```
   Typ: TXT
   Host: in.meinedokbox.de
   Wert: v=spf1 include:mailgun.org ~all
   ```

   **CNAME Records** (für Tracking und DKIM):
   ```
   Mailgun zeigt Ihnen die spezifischen CNAME-Records
   ```

4. **Verifizierung abwarten**
   - DNS-Propagierung kann bis zu 48 Stunden dauern
   - Mailgun zeigt den Status in der Domain-Übersicht an

### Option B: Sandbox-Domain (Nur zum Testen)

1. Mailgun erstellt automatisch eine Sandbox-Domain
2. Format: `sandboxXXXXXXXX.mailgun.org`
3. **Wichtig:** Sandbox erlaubt nur autorisierte E-Mail-Adressen (max. 5)
4. Autorisierte Adressen hinzufügen:
   - Gehen Sie zu "Sending" → "Domain Settings" → Ihre Sandbox-Domain
   - Unter "Authorized Recipients" fügen Sie E-Mail-Adressen hinzu

## Schritt 2: Webhook für eingehende E-Mails konfigurieren

1. **Webhook-Route ermitteln**
   
   Ihre Replit-App läuft unter einer URL wie:
   ```
   https://[your-repl-name].[your-username].repl.co
   ```
   
   Die Webhook-URL ist:
   ```
   https://[your-repl-name].[your-username].repl.co/api/webhook/email
   ```

2. **Webhook in Mailgun einrichten**
   
   - Gehen Sie zu "Sending" → "Webhooks"
   - Wählen Sie Ihre Domain aus
   - Klicken Sie auf "Add webhook"
   - Event Type: **"Incoming Messages"** (nicht "Delivered" oder andere Events!)
   - URL: Ihre Webhook-URL von oben
   - Klicken Sie auf "Create Webhook"

3. **Webhook testen**
   
   Mailgun bietet einen Test-Button. Alternativ:
   ```bash
   # Senden Sie eine Test-E-Mail
   curl -X POST https://[your-repl-name].[your-username].repl.co/api/webhook/email \
     -F "sender=test@example.com" \
     -F "recipient=u_40836242@in.meinedokbox.de" \
     -F "subject=Test"
   ```

## Schritt 3: Routing für eingehende E-Mails

1. **Route erstellen**
   
   - Gehen Sie zu "Receiving" → "Routes"
   - Klicken Sie auf "Create Route"
   - **Expression**: 
     ```
     match_recipient(".*@in.meinedokbox.de")
     ```
   - **Actions**: 
     - Wählen Sie "Forward"
     - URL: `https://[your-repl-name].[your-username].repl.co/api/webhook/email`
   - **Priority**: 0 (höchste Priorität)
   - Klicken Sie auf "Create Route"

2. **Route verifizieren**
   
   Die Route sollte jetzt in der Liste erscheinen und aktiv sein.

## Schritt 4: Testen Sie das System

1. **Benutzer-E-Mail-Adresse finden**
   
   - Melden Sie sich in MeineDokBox an
   - Auf dem Dashboard sehen Sie die Karte "Dokumente per E-Mail senden"
   - Ihre persönliche E-Mail-Adresse wird angezeigt (z.B. `u_40836242@in.meinedokbox.de`)

2. **Test-E-Mail senden**
   
   - Senden Sie eine E-Mail mit einem PDF- oder Bild-Anhang an Ihre persönliche Adresse
   - Anhänge werden automatisch erkannt, kategorisiert und in Ihrem Dashboard angezeigt

3. **Logs überprüfen**
   
   In den Replit-Logs sollten Sie sehen:
   ```
   [Email Webhook] Received email
   [Email Webhook] From: sender@example.com To: u_40836242@in.meinedokbox.de Attachments: 1
   [Email Webhook] Processing 1 supported attachments
   [Email Webhook] Successfully processed: rechnung.pdf
   [Email Webhook] Completed. Processed: 1 Errors: 0
   ```

## Whitelist-Funktion (Optional)

Um nur E-Mails von bestimmten Absendern zu akzeptieren:

1. **Whitelist in der Datenbank setzen**
   
   ```sql
   UPDATE users 
   SET email_whitelist = ARRAY['ihre-email@example.com', '*@firma.de']
   WHERE id = 40836242;
   ```

2. **Wildcard-Unterstützung**
   
   - Einzelne E-Mail: `max@example.com`
   - Ganze Domain: `*@example.com`
   - Mehrere Einträge: `['max@example.com', '*@firma.de']`

## Fehlerbehebung

### E-Mails kommen nicht an

1. **DNS-Records überprüfen**
   ```bash
   nslookup -type=MX in.meinedokbox.de
   ```

2. **Mailgun-Logs checken**
   - Gehen Sie zu "Logs" → "Receiving"
   - Suchen Sie nach Ihrer Test-E-Mail

3. **Webhook-Logs in Replit**
   - Überprüfen Sie die Replit-Logs auf Fehlermeldungen

### Signatur-Fehler

Wenn Sie `Invalid signature` in den Logs sehen:

1. Stellen Sie sicher, dass `MAILGUN_WEBHOOK_SIGNING_KEY` korrekt ist
2. Der Key sollte **nicht** der API-Key sein, sondern der spezielle Webhook-Signing-Key

### Anhänge werden nicht verarbeitet

1. Überprüfen Sie, ob die Dateitypen unterstützt werden:
   - ✅ PDF, JPG, JPEG, PNG, WEBP
   - ❌ DOC, DOCX, XLS, etc.

2. Maximale Dateigröße: 10 MB pro Anhang

## Sicherheit

- ✅ Webhook-Signatur wird automatisch verifiziert
- ✅ Nur autorisierte Absender (falls Whitelist aktiviert)
- ✅ Verschlüsselte Übertragung (HTTPS)
- ✅ API-Keys sicher in Replit Secrets gespeichert

## Kosten

- **Mailgun Flex Plan**: 
  - Erste 1.000 E-Mails/Monat: Kostenlos
  - Danach: $0.80 pro 1.000 E-Mails
  - Keine monatliche Grundgebühr

## Support

Bei Problemen:
1. Überprüfen Sie die Mailgun-Logs
2. Überprüfen Sie die Replit-Logs
3. Testen Sie mit der Mailgun-API direkt
4. Kontaktieren Sie den Mailgun-Support
