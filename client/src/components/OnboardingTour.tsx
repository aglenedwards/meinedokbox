import { useCallback, useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from "react-joyride";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingTourProps {
  run: boolean;
  onFinish: () => void;
}

export function OnboardingTour({ run, onFinish }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [runTour, setRunTour] = useState(run);

  useEffect(() => {
    console.log('[OnboardingTour] Component mounted, run prop:', run);
    setRunTour(run);
  }, [run]);

  useEffect(() => {
    console.log('[OnboardingTour] runTour state changed to:', runTour);
  }, [runTour]);

  // Mark onboarding as completed in database and localStorage
  const markOnboardingCompleted = useCallback(async () => {
    try {
      // Save to database
      await apiRequest("POST", "/api/user/onboarding-seen", {});
      // Save to localStorage as backup
      localStorage.setItem('onboarding-completed', 'true');
      console.log('[OnboardingTour] Marked as completed');
    } catch (error) {
      console.error('[OnboardingTour] Error marking as completed:', error);
      // Still save to localStorage even if API fails
      localStorage.setItem('onboarding-completed', 'true');
    }
  }, []);

  const steps: Step[] = [
    // Step 1: Upload Button (works on both desktop and mobile)
    {
      target: '[data-testid="button-upload-menu"], [data-testid="button-upload-menu-mobile"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">📸 Dokument hochladen</h3>
          <p className="text-sm">
            Hier oben rechts kannst du Dokumente hochladen oder direkt mit dem Handy scannen. 
            <strong className="block mt-2">Lade jetzt dein erstes Dokument hoch!</strong>
          </p>
        </div>
      ),
      disableBeacon: true,
      placement: 'bottom',
      spotlightClicks: true,
    },
    // Step 2: Drag & Drop
    {
      target: '[data-testid="dialog-upload"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">📂 Drag & Drop</h3>
          <p className="text-sm">
            Du kannst auch per Drag & Drop Dokumente hierher ziehen – maximal 10 pro Upload. 
            Mehrere Dateien lassen sich auch zu einem PDF zusammenführen.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    // Step 3: KI-Analyse
    {
      target: '[data-testid="button-finish-upload"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">🤖 KI-Analyse</h3>
          <p className="text-sm">
            Mit „Fertig und analysieren" startet der Upload. Unsere KI:
          </p>
          <ul className="text-sm list-disc list-inside space-y-1 mt-2">
            <li>Prüft Inhalte & vergibt Titel</li>
            <li>Extrahiert Metadaten (Datum, Betrag, Absender)</li>
            <li>Kategorisiert automatisch</li>
            <li>Erkennt steuerrelevante Dokumente</li>
            <li>Korrigiert Ausrichtung</li>
            <li>Verhindert Duplikate</li>
          </ul>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    // Step 4: Alle Dokumente Tab
    {
      target: '[data-testid="tab-alle-dokumente"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">📋 Alle Dokumente</h3>
          <p className="text-sm">
            Hier findest du alle hochgeladenen Dokumente – bereits kategorisiert und durchsuchbar.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    // Step 5: Statistiken
    {
      target: '[data-testid="section-statistics"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">📊 Statistiken</h3>
          <p className="text-sm">
            Hier siehst du eine Übersicht über:
          </p>
          <ul className="text-sm list-disc list-inside mt-1">
            <li>Uploads diesen Monat</li>
            <li>Verbrauchter Speicher</li>
            <li>Gesamtanzahl Dokumente</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    // Step 6: Kategorien-Übersicht
    {
      target: '[data-testid="section-categories"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">📂 Kategorien-Übersicht</h3>
          <p className="text-sm">
            Diese Karten zeigen dir, wie viele Dokumente sich in den jeweiligen Kategorien befinden.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    // Step 7: Email-Postfach
    {
      target: '[data-testid="card-email-inbound"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">📧 Deine MeineDokBox-Email</h3>
          <p className="text-sm">
            Du hast eine eigene Email-Adresse! Rechnungen oder Dokumente können direkt hierhin weitergeleitet werden.
            Alle eingehenden Emails werden automatisch hochgeladen und kategorisiert.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    // Step 8: Whitelist-Schutz
    {
      target: '[data-testid="card-email-whitelist"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">🔒 Whitelist-Schutz</h3>
          <p className="text-sm">
            Aus Sicherheitsgründen können nur hinterlegte Email-Adressen als Absender akzeptiert werden.
            Deine registrierte Email ist automatisch freigeschaltet – so schützen wir deine Dokumente!
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    // Step 9: Kategorie-Filter
    {
      target: '[data-testid="button-filter-categories"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">🔍 Kategorie-Filter</h3>
          <p className="text-sm">
            Wähle eine oder mehrere Kategorien aus, um nur Dokumente aus bestimmten Kategorien anzuzeigen.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    // Step 10: Dokumentenkarte
    {
      target: '[data-testid^="card-document-"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">📄 Dokumentenkarte</h3>
          <p className="text-sm">
            So sieht eine Dokumentenkarte aus: Mit Titel, Vorschaubild und allen relevanten Metadaten 
            (Datum, Betrag, Absender, Kategorie).
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    // Step 11: 3-Punkte-Menü
    {
      target: '[data-testid^="button-menu-"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">⚙️ Dokumenten-Optionen</h3>
          <p className="text-sm">
            Über die 3 Punkte findest du Einstellungen für jedes Dokument:
          </p>
          <ul className="text-sm list-disc list-inside mt-1 space-y-0.5">
            <li>Ansehen & Bearbeiten</li>
            <li>Kategorie ändern</li>
            <li>Ordner zuweisen</li>
            <li>Als "Steuerrelevant" markieren</li>
          </ul>
          <p className="text-xs mt-2 text-muted-foreground">
            💡 Die KI kategorisiert bereits automatisch die meisten steuerrelevanten Dokumente – 
            du kannst aber jederzeit manuell nachtaggen.
          </p>
        </div>
      ),
      placement: 'left',
      disableBeacon: true,
    },
    // Step 12: Steuererklärung Tab
    {
      target: '[data-testid="tab-steuererklarung"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">📊 Steuererklärung</h3>
          <p className="text-sm">
            Im Tab „Steuererklärung" landen alle steuerrelevanten Dokumente automatisch. 
            Wähle das gewünschte Jahr aus und lade alle Dokumente herunter – 
            z.B. zur Weiterleitung an deinen Steuerberater.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    // Step 13: Meine Ordner Tab
    {
      target: '[data-testid="tab-meine-ordner"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">📁 Meine Ordner</h3>
          <p className="text-sm">
            Im Tab „Meine Ordner" kannst du eigene Ordner erstellen und Dokumente manuell zuweisen – 
            z.B. „Wichtige Verträge" oder „Zu bezahlen".
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    // Step 14: Papierkorb
    {
      target: '[data-testid="button-trash"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">🗑️ Papierkorb</h3>
          <p className="text-sm">
            Im Papierkorb können einzelne oder alle Dokumente unwiderruflich gelöscht werden.
            <strong className="block mt-1">Wichtig:</strong> Erst nach der endgültigen Löschung werden 
            deine Dokumenten-Kontingente wieder freigegeben.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    // Step 15: Einstellungen
    {
      target: '[data-testid="button-settings"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">⚙️ Einstellungen</h3>
          <p className="text-sm">
            Unter Einstellungen findest du deine Account-Daten und weitere wichtige Funktionen.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    // Step 16: Abonnementsverwaltung
    {
      target: '[data-testid="section-subscription"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">💳 Abonnementsverwaltung</h3>
          <p className="text-sm">
            Hier verwaltest du dein Abonnement, kannst upgraden oder deine Zahlungsdaten ändern.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    // Step 17: Whitelist-Einstellungen
    {
      target: '[data-testid="card-email-whitelist"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">✉️ Email-Whitelist</h3>
          <p className="text-sm">
            Hier kannst du weitere Email-Adressen freischalten, von denen du Dokumente empfangen möchtest.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    // Step 18: Daten exportieren
    {
      target: '[data-testid="section-export"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">📥 Daten exportieren</h3>
          <p className="text-sm">
            Du kannst jederzeit alle deine Daten als ZIP-Archiv exportieren – 
            für Backups oder zum Wechsel zu einem anderen System.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    // Step 19: Personen einladen
    {
      target: '[data-testid="section-family"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base">👨‍👩‍👧‍👦 Personen einladen</h3>
          <p className="text-sm">
            Bei Family-Plänen kannst du hier Personen einladen und bestimmte Bereiche teilen.
          </p>
          <p className="text-xs mt-2 text-muted-foreground font-semibold">
            🎉 Fertig! Du kennst jetzt alle wichtigen Funktionen von MeineDokBox.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
  ];

  const handleJoyrideCallback = useCallback(async (data: CallBackProps) => {
    const { status, type, action, index } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Move to next step
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // Tour finished or skipped - mark as completed
      await markOnboardingCompleted();
      setRunTour(false);
      onFinish();
    }
  }, [onFinish, markOnboardingCompleted]);

  return (
    <Joyride
      steps={steps}
      run={runTour}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      locale={{
        back: 'Zurück',
        close: 'Schließen',
        last: 'Fertig',
        next: 'Weiter',
        skip: 'Überspringen',
      }}
      styles={{
        options: {
          arrowColor: 'hsl(var(--popover))',
          backgroundColor: 'hsl(var(--popover))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--popover-foreground))',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          fontSize: window.innerWidth < 640 ? 13 : 14,
          padding: window.innerWidth < 640 ? 12 : 20,
          maxWidth: window.innerWidth < 640 ? '90vw' : 420,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          fontSize: window.innerWidth < 640 ? 13 : 14,
          padding: window.innerWidth < 640 ? '6px 12px' : '8px 16px',
          borderRadius: 6,
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: window.innerWidth < 640 ? 13 : 14,
          marginRight: 8,
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: window.innerWidth < 640 ? 12 : 13,
        },
      }}
    />
  );
}
