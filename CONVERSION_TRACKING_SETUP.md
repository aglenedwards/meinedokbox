# Conversion Tracking Setup Guide

## Übersicht

Das Conversion Tracking ist jetzt vollständig implementiert. Nach einem erfolgreichen Stripe-Checkout werden automatisch Events an Google Ads und Facebook Pixel gesendet.

## Was wurde implementiert?

1. **Neue Danke-Seite**: `/checkout/erfolg`
   - Wird nach erfolgreichem Stripe-Checkout angezeigt
   - Zeigt Erfolgsbestätigung mit Countdown
   - Leitet nach 5 Sekunden automatisch zum Dashboard weiter

2. **Google Ads Conversion Tracking**
   - Event: `conversion`
   - Sendet Conversion-Wert und Währung
   - Bereit für Google Ads Tag Manager

3. **Facebook Pixel Purchase Event**
   - Event: `Purchase`
   - Sendet Produktwert, Währung und Plan-Details
   - Bereit für Facebook Business Manager

## Setup-Schritte

### 1. Google Ads Conversion Tracking einrichten

#### Schritt 1: Google Ads Conversion ID erstellen
1. Gehe zu [Google Ads](https://ads.google.com)
2. Navigiere zu **Tools & Einstellungen** → **Conversions**
3. Klicke auf **+ Neue Conversion-Aktion**
4. Wähle **Website** als Conversion-Quelle
5. Wähle **Kauf** als Conversion-Kategorie
6. Notiere dir die **Conversion-ID** (Format: `AW-XXXXXXXXX`) und das **Conversion-Label**

#### Schritt 2: Google Tag in index.html einbinden

Füge diesen Code in `index.html` im `<head>`-Bereich ein:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-XXXXXXXXX');
</script>
```

**Ersetze `AW-XXXXXXXXX` mit deiner echten Conversion-ID!**

#### Schritt 3: Conversion-Label in CheckoutSuccess.tsx eintragen

Öffne `client/src/pages/CheckoutSuccess.tsx` und ersetze in Zeile 30:

```typescript
// VORHER:
send_to: "AW-CONVERSION_ID/CONVERSION_LABEL",

// NACHHER (Beispiel):
send_to: "AW-123456789/AbC-dEfGhIjKlMnOp",
```

### 2. Facebook Pixel einrichten

#### Schritt 1: Facebook Pixel ID erstellen
1. Gehe zu [Facebook Business Manager](https://business.facebook.com)
2. Navigiere zu **Events Manager** → **Datenquellen**
3. Wähle dein Pixel aus oder erstelle ein neues
4. Notiere dir die **Pixel-ID** (Format: `1234567890123456`)

#### Schritt 2: Facebook Pixel in index.html einbinden

Füge diesen Code in `index.html` im `<head>`-Bereich ein:

```html
<!-- Facebook Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'DEINE_PIXEL_ID');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id=DEINE_PIXEL_ID&ev=PageView&noscript=1"/>
</noscript>
<!-- End Facebook Pixel Code -->
```

**Ersetze `DEINE_PIXEL_ID` mit deiner echten Pixel-ID!**

Das war's! Der Purchase-Event wird automatisch in `CheckoutSuccess.tsx` gefeuert - keine weitere Anpassung nötig.

## Testen

### Google Ads Conversion Tracking testen

1. Öffne Chrome DevTools (F12)
2. Gehe zum **Network**-Tab
3. Filter nach `collect` oder `google-analytics`
4. Führe einen Test-Checkout durch (Stripe Test-Karte: `4242 4242 4242 4242`)
5. Prüfe, ob ein Request an Google mit `conversion` Event gesendet wurde

### Facebook Pixel testen

1. Installiere die [Facebook Pixel Helper Chrome Extension](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Führe einen Test-Checkout durch
3. Die Extension sollte ein grünes Checkmark mit "Purchase" Event anzeigen

## Conversion-Werte

Die folgenden Werte werden automatisch an Google Ads und Facebook gesendet:

| Plan        | Monatlich | Jährlich  |
|-------------|-----------|-----------|
| Solo        | €4,99     | €49,99    |
| Family      | €7,99     | €84,99    |
| Family Plus | €11,99    | €119,99   |

## Wichtige Hinweise

- Die Tracking-Scripte sollten **nur in Production** aktiv sein
- Test-Conversions können in Google Ads und Facebook gefiltert werden
- Datenschutzerklärung muss Tracking-Tools erwähnen (Cookie-Banner!)
- GDPR-Compliance: Nutzer sollten Tracking zustimmen können

## Nächste Schritte

1. **Cookie-Banner implementieren** (z.B. mit CookieBot, OneTrust)
2. **Datenschutzerklärung aktualisieren** mit Google Ads und Facebook Pixel
3. **Google Tag Manager** optional verwenden für einfacheres Tag-Management
4. **Server-Side Tracking** für bessere Datenqualität (Facebook Conversions API)
