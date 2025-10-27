# Stripe Webhook Einrichtung

## Webhook im Stripe Dashboard konfigurieren

### Schritt 1: Webhook-Endpunkt hinzufügen

1. Gehe zu [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Klicke auf "Add endpoint"
3. Gib die Webhook-URL ein:
   - **Development (Replit)**: `https://[deine-replit-url].replit.dev/api/stripe/webhook`
   - **Production**: `https://[deine-domain]/api/stripe/webhook`

### Schritt 2: Events auswählen

Wähle folgende Events aus (oder "Select all" für Checkout und Subscription):

**Erforderliche Events:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Schritt 3: Webhook-Secret kopieren

1. Nach dem Erstellen des Webhooks, klicke auf den Webhook
2. Klicke auf "Signing secret" → "Reveal"
3. Kopiere den Webhook-Secret (beginnt mit `whsec_...`)

### Schritt 4: Webhook-Secret als Environment Variable speichern

1. In Replit:
   - Öffne Secrets (Schloss-Icon in der Sidebar)
   - Füge neuen Secret hinzu:
     - Key: `STRIPE_WEBHOOK_SECRET`
     - Value: `whsec_...` (der kopierte Secret)

2. Starte den Server neu (er lädt automatisch den neuen Secret)

## Testen der Webhook-Integration

### Lokales Testen mit Stripe CLI (Optional)

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:5000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

### Test mit echten Stripe-Testzahlungen

**Testkreditkarte:**
- Nummer: `4242 4242 4242 4242`
- Ablaufdatum: Beliebiges zukünftiges Datum
- CVC: Beliebige 3 Ziffern
- PLZ: Beliebige 5 Ziffern

**SEPA-Lastschrift (Test):**
- IBAN: `DE89370400440532013000`

**Testablauf:**
1. Öffne die App und gehe zu Settings
2. Klicke auf "Upgraden"
3. Wähle einen Plan (z.B. Family, jährlich)
4. Klicke auf "Weiter zur Zahlung"
5. Verwende die Testkreditkarte oben
6. Schließe den Checkout ab
7. Du wirst zurück zur App weitergeleitet
8. Prüfe in Settings, ob der Plan aktualisiert wurde

## Webhook-Logs prüfen

### In Stripe Dashboard:
1. Gehe zu [Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Klicke auf deinen Webhook
3. Scroll zu "Recent deliveries"
4. Prüfe Status (✓ Success oder ✗ Failed)
5. Klicke auf einzelne Events für Details

### In Replit Logs:
Suche nach Log-Einträgen wie:
```
[StripeWebhook] Event received: checkout.session.completed
[StripeWebhook] Event received: customer.subscription.updated
```

## Fehlerbehandlung

### Webhook schlägt fehl (Status 400/500)
1. Prüfe, ob `STRIPE_WEBHOOK_SECRET` korrekt gesetzt ist
2. Prüfe Replit Logs auf Fehler
3. Stelle sicher, dass der Webhook-Endpunkt erreichbar ist

### Subscription wird nicht aktualisiert
1. Prüfe, ob `checkout.session.completed` Event empfangen wurde
2. Prüfe, ob `metadata.userId` im Event vorhanden ist
3. Prüfe Datenbank: `stripeCustomerId`, `stripeSubscriptionId` sollten gesetzt sein

### Test-Zahlung funktioniert nicht
- Stelle sicher, dass du Stripe Test Mode verwendest (oben links im Dashboard)
- Verwende nur Stripe Testkarten
- Prüfe, ob Stripe Tax aktiviert ist (Settings → Tax)

## Production Deployment

Vor dem Go-Live:
1. ✅ Webhook-URL auf Production-Domain setzen
2. ✅ `STRIPE_WEBHOOK_SECRET` für Production setzen
3. ✅ Von Test Mode zu Live Mode wechseln
4. ✅ Echte Stripe API Keys verwenden (`pk_live_...` / `sk_live_...`)
5. ✅ Stripe Tax für Deutschland konfigurieren
6. ✅ Alle Events testen

## Weitere Informationen

- [Stripe Webhooks Docs](https://stripe.com/docs/webhooks)
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Tax Docs](https://stripe.com/docs/tax)
