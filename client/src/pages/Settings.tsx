import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Mail, UserPlus, X, Crown, Calendar, FileText, Settings as SettingsIcon, TrendingUp, HardDrive, ExternalLink, Download, Trash2, Fingerprint, ShieldCheck, Smartphone, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getCurrentUser, getSubscriptionStatus, exportDocumentsAsZip, type SubscriptionStatus } from "@/lib/api";
import type { User as UserType, SharedAccess } from "@shared/schema";
import { UpgradeModal } from "@/components/UpgradeModal";
import { CheckoutDialog } from "@/components/CheckoutDialog";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardFooter } from "@/components/DashboardFooter";
import { EmailWhitelistSettings } from "@/components/EmailWhitelistSettings";

function ManageSubscriptionButton() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("POST", "/api/stripe/create-portal-session", {});
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kundenportal konnte nicht geöffnet werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleManageSubscription}
      disabled={loading}
      size="sm"
      variant="outline"
      data-testid="button-manage-subscription"
    >
      <ExternalLink className="h-4 w-4 mr-2" />
      {loading ? "Lädt..." : "Abo verwalten"}
    </Button>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"solo" | "family" | "family-plus">("family");
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "yearly">("yearly");
  const [webAuthnSupported, setWebAuthnSupported] = useState<boolean | null>(null);
  const [webAuthnRegistered, setWebAuthnRegistered] = useState(false);
  const [webAuthnPending, setWebAuthnPending] = useState(false);

  const [isPWA, setIsPWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSChrome, setIsIOSChrome] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [installAccepted, setInstallAccepted] = useState(false);

  const checkWebAuthn = useCallback(async () => {
    try {
      const { browserSupportsWebAuthn } = await import('@simplewebauthn/browser');
      setWebAuthnSupported(browserSupportsWebAuthn());
      setWebAuthnRegistered(localStorage.getItem('webauthn_registered') === 'true');
    } catch {
      setWebAuthnSupported(false);
    }
  }, []);

  useEffect(() => { checkWebAuthn(); }, [checkWebAuthn]);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsPWA(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
    const isIOSDevice = (/iPad|iPhone|iPod/.test(ua) && !('MSStream' in window))
      || (/Mac/.test(ua) && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);
    setIsIOSChrome(/CriOS/.test(ua));
    setIsAndroid(/Android/.test(ua));

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallAccepted(true);
      setDeferredInstallPrompt(null);
    }
  };

  // Listen for checkout events from UpgradeModal
  useEffect(() => {
    const handleOpenCheckout = (e: CustomEvent) => {
      const { plan, period } = e.detail;
      setSelectedPlan(plan);
      setSelectedPeriod(period);
      setCheckoutDialogOpen(true);
    };

    window.addEventListener('openCheckout' as any, handleOpenCheckout);
    return () => window.removeEventListener('openCheckout' as any, handleOpenCheckout);
  }, []);

  const handleSetupBiometric = async () => {
    if (!user) return;
    setWebAuthnPending(true);
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');
      const startRes = await fetch('/api/auth/webauthn/register/start', {
        method: 'POST',
        credentials: 'include',
      });
      if (!startRes.ok) throw new Error((await startRes.json()).message || 'Fehler');
      const options = await startRes.json();
      const attestationResponse = await startRegistration({ optionsJSON: options });
      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(attestationResponse),
      });
      if (!verifyRes.ok) throw new Error((await verifyRes.json()).message || 'Verifizierung fehlgeschlagen');
      localStorage.setItem('webauthn_registered', 'true');
      localStorage.setItem('webauthn_email', user.email || '');
      setWebAuthnRegistered(true);
      toast({ title: 'Biometrische Anmeldung aktiviert', description: 'Sie können sich ab sofort mit Face ID / Fingerabdruck anmelden.' });
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError') {
        toast({ title: 'Einrichtung fehlgeschlagen', description: err.message || 'Bitte versuchen Sie es erneut.', variant: 'destructive' });
      }
    } finally {
      setWebAuthnPending(false);
    }
  };

  const handleRemoveBiometric = async () => {
    setWebAuthnPending(true);
    try {
      await fetch('/api/auth/webauthn/remove', { method: 'DELETE', credentials: 'include' });
    } catch { /* best effort */ }
    localStorage.removeItem('webauthn_registered');
    localStorage.removeItem('webauthn_email');
    setWebAuthnRegistered(false);
    setWebAuthnPending(false);
    toast({ title: 'Biometrische Anmeldung entfernt', description: 'Face ID / Fingerabdruck wurde deaktiviert.' });
  };

  // Fetch user data
  const { data: user } = useQuery<UserType | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getCurrentUser,
    retry: false,
  });

  // Fetch subscription status
  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
    queryFn: getSubscriptionStatus,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch all shared access (with status tracking)
  const { data: allSharedAccess } = useQuery<SharedAccess[]>({
    queryKey: ["/api/shared-access/all"],
    queryFn: async () => {
      const response = await fetch("/api/shared-access/all", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error("Failed to fetch shared access");
      }
      return response.json();
    },
    enabled: ['family', 'family-plus', 'trial'].includes(subscriptionStatus?.plan || ''),
  });

  // For backward compatibility, get the first active invitation
  const sharedAccess = allSharedAccess?.find(a => a.status === 'active' || a.status === 'pending') || null;

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/shared-access/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Fehler beim Senden der Einladung");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared-access/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shared-access"] });
      setInviteEmail("");
      toast({
        title: "Einladung gesendet",
        description: "Die eingeladene Person erhält eine E-Mail mit weiteren Informationen.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: "Die Einladung konnte nicht gesendet werden. Bitte überprüfen Sie die E-Mail-Adresse und versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  // Revoke mutation
  const revokeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/shared-access", {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Fehler beim Widerrufen des Zugriffs");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared-access/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shared-access"] });
      toast({
        title: "Zugriff widerrufen",
        description: "Die Person hat keinen Zugriff mehr auf Ihre Dokumente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: "Der Zugriff konnte nicht widerrufen werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  // Resend invitation mutation
  const resendMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(`/api/shared-access/resend/${invitationId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Fehler beim erneuten Senden der Einladung");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared-access/all"] });
      toast({
        title: "Einladung erneut gesendet",
        description: "Eine neue Einladungs-E-Mail wurde versendet.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: "Die Einladung konnte nicht erneut gesendet werden. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
    },
  });

  // Delete invitation mutation (for revoked slaves without documents)
  const deleteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(`/api/shared-access/${invitationId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Fehler beim Löschen der Einladung");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared-access/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shared-access"] });
      toast({
        title: "Einladung gelöscht",
        description: "Die Einladung und der Nutzer wurden vollständig entfernt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: "Die Einladung konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    const hasMultiUserPlan = ['family', 'family-plus', 'trial'].includes(subscriptionStatus?.plan || '');
    if (!hasMultiUserPlan) {
      setUpgradeModalOpen(true);
      return;
    }

    inviteMutation.mutate(inviteEmail.toLowerCase());
  };

  const handleRevoke = () => {
    if (confirm("Möchten Sie den Zugriff für diese Person wirklich widerrufen?")) {
      revokeMutation.mutate();
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    if (plan === "family" || plan === "family-plus") return "default";
    if (plan === "trial") return "secondary";
    return "outline";
  };

  // Calculate invitation limits based on plan
  const planLimits = {
    'trial': 2,
    'family': 2,
    'family-plus': 4,
  };
  const maxUsers = planLimits[subscriptionStatus?.plan as keyof typeof planLimits] || 1;
  const activeInvitations = allSharedAccess?.filter(a => a.status === 'pending' || a.status === 'active') || [];
  const canInviteMore = activeInvitations.length < (maxUsers - 1);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          Einstellungen
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verwalten Sie Ihr Abonnement und Ihre Kontoeinstellungen
        </p>
      </div>

      <div className="max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* App Install Card — only shown on mobile (iOS or Android) */}
            {(isIOS || isAndroid) && (
              <Card data-testid="section-app-install">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Als App installieren
                  </CardTitle>
                  <CardDescription>
                    Schneller Zugriff direkt vom Home-Bildschirm Ihres Smartphones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isPWA ? (
                    <div className="flex items-center gap-3 text-green-600 dark:text-green-400" data-testid="status-app-installed">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <p className="text-sm font-medium">App ist installiert – Sie nutzen MeineDokBox bereits als App.</p>
                    </div>
                  ) : installAccepted ? (
                    <div className="flex items-center gap-3 text-green-600 dark:text-green-400" data-testid="status-install-accepted">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <p className="text-sm font-medium">App wird installiert – prüfen Sie Ihren Home-Bildschirm.</p>
                    </div>
                  ) : isIOS ? (
                    <div data-testid="guide-ios">
                      {isIOSChrome && (
                        <div className="flex items-start gap-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4" data-testid="notice-ios-chrome">
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Bitte Safari verwenden</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                              iOS erlaubt die App-Installation nur über Safari. Öffnen Sie <strong>meinedokbox.de</strong> in Safari und folgen Sie den Schritten unten.
                            </p>
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mb-4">
                        Folgen Sie diesen 4 Schritten in Safari:
                      </p>
                      <div
                        className="flex gap-3 overflow-x-auto pb-3"
                        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
                      >
                        {[
                          { img: '/install-guide/step1.png', num: 1, label: 'Tippen Sie auf das \u00bb\u00b7\u00b7\u00b7\u00ab\u2011Menü unten rechts in Safari' },
                          { img: '/install-guide/step2.png', num: 2, label: 'Tippen Sie auf \u00bbTeilen\u00ab im Menü' },
                          { img: '/install-guide/step3.png', num: 3, label: 'Tippen Sie auf \u00bbZum Home-Bildschirm\u00ab' },
                          { img: '/install-guide/step4.png', num: 4, label: 'Lassen Sie \u00bbAls Web-App öffnen\u00ab aktiviert und tippen Sie oben rechts auf \u00bbHinzufügen\u00ab' },
                        ].map((step) => (
                          <div
                            key={step.num}
                            className="shrink-0 flex flex-col items-center gap-2"
                            style={{ scrollSnapAlign: 'start', width: '148px' }}
                            data-testid={`card-install-step-${step.num}`}
                          >
                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary-foreground">{step.num}</span>
                            </div>
                            <img
                              src={step.img}
                              alt={`Schritt ${step.num}`}
                              className="rounded-md border border-border"
                              style={{ width: '148px', height: '260px', objectFit: 'cover', objectPosition: 'top' }}
                            />
                            <p className="text-xs text-muted-foreground text-center leading-snug">{step.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div data-testid="guide-android">
                      {deferredInstallPrompt ? (
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div>
                            <p className="text-sm font-medium">App installieren</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Zum Home-Bildschirm hinzufügen für schnellen Zugriff</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={handleAndroidInstall}
                            data-testid="button-android-install"
                          >
                            <Smartphone className="h-4 w-4 mr-2" />
                            Installieren
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Tippen Sie im Browser-Menü (drei Punkte oben rechts) auf <strong>"App installieren"</strong> oder <strong>"Zum Startbildschirm hinzufügen"</strong>.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Profile Card */}
            <Card data-testid="card-profile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {user?.profileImageUrl && (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="h-16 w-16 rounded-full"
                    data-testid="img-profile"
                  />
                )}
                <div>
                  <p className="font-medium" data-testid="text-user-name">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                    {user?.email}
                  </p>
                </div>
              </div>

              {user?.inboundEmail && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4" />
                      E-Mail Postfach
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={user.inboundEmail}
                        readOnly
                        className="font-mono text-sm"
                        data-testid="input-inbound-email"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(user.inboundEmail!);
                          toast({
                            title: "Kopiert",
                            description: "E-Mail-Adresse in Zwischenablage kopiert",
                          });
                        }}
                        data-testid="button-copy-email"
                      >
                        Kopieren
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Leiten Sie Dokumente an diese E-Mail-Adresse weiter, um sie automatisch zu speichern.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Email Whitelist (Security Feature) */}
          <EmailWhitelistSettings />

          {/* Notification Settings Card */}
          <Card data-testid="section-notifications">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Benachrichtigungen
              </CardTitle>
              <CardDescription>
                E-Mail-Benachrichtigungen für Community-Funktionen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-features">Neue Feature-Wünsche</Label>
                  <p className="text-xs text-muted-foreground">
                    Per E-Mail benachrichtigt werden, wenn ein neuer Feature-Wunsch zur Abstimmung freigegeben wird
                  </p>
                </div>
                <Switch
                  id="notify-features"
                  checked={user?.notifyNewFeatures || false}
                  onCheckedChange={async (checked) => {
                    try {
                      await apiRequest("PATCH", "/api/user/notifications", { notifyNewFeatures: checked });
                      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                      toast({
                        title: checked ? "Benachrichtigungen aktiviert" : "Benachrichtigungen deaktiviert",
                        description: checked 
                          ? "Sie werden per E-Mail über neue Feature-Wünsche informiert." 
                          : "Sie erhalten keine E-Mails mehr zu neuen Feature-Wünschen.",
                      });
                    } catch (error) {
                      toast({
                        title: "Fehler",
                        description: "Die Einstellung konnte nicht gespeichert werden.",
                        variant: "destructive",
                      });
                    }
                  }}
                  data-testid="switch-notify-features"
                />
              </div>
            </CardContent>
          </Card>

          {/* Biometric Auth Card */}
          {webAuthnSupported !== null && (
            <Card data-testid="section-biometric">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Biometrische Anmeldung
                </CardTitle>
                <CardDescription>
                  Melden Sie sich mit Face ID, Touch ID oder Fingerabdruck an – ohne Passwort
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!webAuthnSupported ? (
                  <p className="text-sm text-muted-foreground">
                    Ihr Gerät oder Browser unterstützt keine biometrische Anmeldung.
                  </p>
                ) : (
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${webAuthnRegistered ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                        <ShieldCheck className={`h-5 w-5 ${webAuthnRegistered ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" data-testid="text-biometric-status">
                          {webAuthnRegistered ? 'Aktiv' : 'Nicht eingerichtet'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {webAuthnRegistered
                            ? 'Sie können sich mit Face ID / Fingerabdruck anmelden'
                            : 'Richten Sie die biometrische Anmeldung ein'}
                        </p>
                      </div>
                    </div>
                    {webAuthnRegistered ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveBiometric}
                        disabled={webAuthnPending}
                        data-testid="button-biometric-remove"
                      >
                        <Fingerprint className="h-4 w-4 mr-2" />
                        {webAuthnPending ? 'Wird entfernt...' : 'Entfernen'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleSetupBiometric}
                        disabled={webAuthnPending || !user}
                        data-testid="button-biometric-setup"
                      >
                        <Fingerprint className="h-4 w-4 mr-2" />
                        {webAuthnPending ? 'Einrichten...' : 'Face ID einrichten'}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Export Card */}
          <Card data-testid="section-export">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Daten exportieren
              </CardTitle>
              <CardDescription>
                Exportieren Sie alle Ihre Dokumente als ZIP-Archiv
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Laden Sie alle Ihre hochgeladenen Dokumente in einer ZIP-Datei herunter. 
                Das Archiv enthält alle Originaldateien mit ihren Dateinamen.
              </p>
              <Button
                onClick={exportDocumentsAsZip}
                variant="outline"
                data-testid="button-export-zip"
              >
                <Download className="h-4 w-4 mr-2" />
                Alle Dokumente herunterladen (ZIP)
              </Button>
            </CardContent>
          </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
          {/* Subscription Card */}
          <Card data-testid="section-subscription">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Abonnement
              </CardTitle>
              <CardDescription>
                Aktueller Plan und Nutzungsstatistiken
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusLoading ? (
                <div>Laden...</div>
              ) : subscriptionStatus ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Aktueller Plan</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold" data-testid="text-plan-name">
                          {subscriptionStatus.displayName}
                        </p>
                        <Badge
                          variant={subscriptionStatus.hasActiveSubscription ? "default" : getPlanBadgeVariant(subscriptionStatus.plan)}
                          data-testid="badge-plan-status"
                        >
                          {subscriptionStatus.hasActiveSubscription ? "Aktiv" :
                           subscriptionStatus.plan === "family" ? "Family" : 
                           subscriptionStatus.plan === "family-plus" ? "Family Plus" : 
                           subscriptionStatus.plan === "solo" ? "Solo" :
                           subscriptionStatus.plan === "trial" ? "Trial" : "Free"}
                        </Badge>
                      </div>
                      {!['family', 'family-plus', 'solo'].includes(subscriptionStatus.plan) && !subscriptionStatus.hasActiveSubscription ? (
                        <Button
                          onClick={() => setCheckoutDialogOpen(true)}
                          data-testid="button-upgrade"
                          size="sm"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Upgraden
                        </Button>
                      ) : (
                        <ManageSubscriptionButton />
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    {/* Monthly Upload Limit */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Uploads diesen Monat
                        </p>
                        <p className="text-sm font-medium" data-testid="text-upload-count">
                          {subscriptionStatus.uploadsThisMonth} / {subscriptionStatus.maxUploadsPerMonth}
                        </p>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            ((subscriptionStatus.uploadsThisMonth ?? 0) / (subscriptionStatus.maxUploadsPerMonth ?? 1)) >= 0.9 
                              ? 'bg-destructive' 
                              : ((subscriptionStatus.uploadsThisMonth ?? 0) / (subscriptionStatus.maxUploadsPerMonth ?? 1)) >= 0.7 
                                ? 'bg-yellow-500' 
                                : 'bg-primary'
                          }`}
                          style={{ 
                            width: `${Math.min(
                              ((subscriptionStatus.uploadsThisMonth ?? 0) / (subscriptionStatus.maxUploadsPerMonth ?? 1)) * 100,
                              100
                            )}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Storage Limit */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          Speicher verwendet
                        </p>
                        <p className="text-sm font-medium" data-testid="text-storage-used">
                          {subscriptionStatus.storageUsedGB?.toFixed(2)} GB / {subscriptionStatus.maxStorageGB} GB
                        </p>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            ((subscriptionStatus.storageUsedGB ?? 0) / (subscriptionStatus.maxStorageGB ?? 1)) >= 0.9 
                              ? 'bg-destructive' 
                              : ((subscriptionStatus.storageUsedGB ?? 0) / (subscriptionStatus.maxStorageGB ?? 1)) >= 0.7 
                                ? 'bg-yellow-500' 
                                : 'bg-primary'
                          }`}
                          style={{ 
                            width: `${Math.min(
                              ((subscriptionStatus.storageUsedGB ?? 0) / (subscriptionStatus.maxStorageGB ?? 1)) * 100,
                              100
                            )}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* User Count (for Family plans) */}
                    {subscriptionStatus.maxUsers && subscriptionStatus.maxUsers > 1 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Nutzer
                          </p>
                          <p className="text-sm font-medium" data-testid="text-user-count">
                            {subscriptionStatus.currentUsers || 1} von {subscriptionStatus.maxUsers}
                          </p>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              ((subscriptionStatus.currentUsers ?? 1) / (subscriptionStatus.maxUsers ?? 1)) >= 1
                                ? 'bg-primary' 
                                : 'bg-primary'
                            }`}
                            style={{ 
                              width: `${Math.min(
                                ((subscriptionStatus.currentUsers ?? 1) / (subscriptionStatus.maxUsers ?? 1)) * 100,
                                100
                              )}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Trial Days (if applicable) - only show if no active Stripe subscription */}
                    {subscriptionStatus.plan === "trial" && subscriptionStatus.daysRemaining !== null && !subscriptionStatus.hasActiveSubscription && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Verbleibende Tage
                          </p>
                          <p className="text-lg font-medium" data-testid="text-trial-days">
                            {subscriptionStatus.daysRemaining} Tage
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Shared Access Card (Family & Family Plus) */}
          <Card data-testid="section-family">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Weitere Personen einladen
              </CardTitle>
              <CardDescription>
                {['family', 'family-plus', 'trial'].includes(subscriptionStatus?.plan || '')
                  ? "Laden Sie weitere Personen ein, um gemeinsam auf geteilte Ordner zuzugreifen"
                  : "Verfügbar in den Tarifen Family und Family Plus"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {['family', 'family-plus', 'trial'].includes(subscriptionStatus?.plan || '') ? (
                <>
                  <div className="space-y-4">
                        {/* Show existing invitations */}
                        {allSharedAccess && allSharedAccess.length > 0 && allSharedAccess.map((access) => {
                          const statusVariant = access.status === 'active' ? 'default' : 
                                               access.status === 'pending' ? 'secondary' : 
                                               'destructive';
                          const statusText = access.status === 'active' ? 'Aktiv' : 
                                            access.status === 'pending' ? 'Ausstehend' : 
                                            access.status === 'expired' ? 'Abgelaufen' : 
                                            'Widerrufen';
                          
                          return (
                            <div key={access.id} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium" data-testid={`text-shared-email-${access.id}`}>
                                    {access.sharedWithEmail}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge
                                      variant={statusVariant}
                                      data-testid={`badge-shared-status-${access.id}`}
                                    >
                                      {statusText}
                                    </Badge>
                                    {access.invitedAt && (
                                      <span className="text-xs text-muted-foreground">
                                        Eingeladen: {new Date(access.invitedAt).toLocaleDateString('de-DE')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {access.status === 'pending' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => resendMutation.mutate(access.id)}
                                      disabled={resendMutation.isPending}
                                      data-testid={`button-resend-${access.id}`}
                                    >
                                      <Mail className="h-4 w-4 md:mr-2" />
                                      <span className="hidden md:inline">Erneut senden</span>
                                    </Button>
                                  )}
                                  {access.status === 'expired' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => resendMutation.mutate(access.id)}
                                      disabled={resendMutation.isPending}
                                      data-testid={`button-resend-${access.id}`}
                                    >
                                      <Mail className="h-4 w-4 md:mr-2" />
                                      <span className="hidden md:inline">Neu einladen</span>
                                    </Button>
                                  )}
                                  {access.status === 'revoked' && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm("Möchten Sie diese Einladung und den Nutzer wirklich vollständig löschen? Dies kann nicht rückgängig gemacht werden.")) {
                                          deleteMutation.mutate(access.id);
                                        }
                                      }}
                                      disabled={deleteMutation.isPending}
                                      data-testid={`button-delete-${access.id}`}
                                    >
                                      <Trash2 className="h-4 w-4 md:mr-2" />
                                      <span className="hidden md:inline">Löschen</span>
                                    </Button>
                                  )}
                                  {(access.status === 'active' || access.status === 'pending') && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={handleRevoke}
                                      disabled={revokeMutation.isPending}
                                      data-testid={`button-revoke-access-${access.id}`}
                                    >
                                      <X className="h-4 w-4 md:mr-2" />
                                      <span className="hidden md:inline">Widerrufen</span>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Show invitation form if user can invite more people */}
                        {canInviteMore && (
                          <>
                            {allSharedAccess && allSharedAccess.length > 0 && <Separator />}
                            <form onSubmit={handleInvite} className="space-y-4">
                              <div>
                                <Label htmlFor="invite-email">
                                  {allSharedAccess && allSharedAccess.length > 0 ? 'Weitere Person einladen' : 'E-Mail-Adresse'}
                                  {subscriptionStatus?.plan === 'family-plus' && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({activeInvitations.length} von {maxUsers - 1} Plätzen belegt)
                                    </span>
                                  )}
                                </Label>
                                <Input
                                  id="invite-email"
                                  type="email"
                                  placeholder="beispiel@email.de"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  required
                                  data-testid="input-invite-email"
                                />
                              </div>
                              <Button
                                type="submit"
                                disabled={inviteMutation.isPending}
                                data-testid="button-send-invite"
                              >
                                {inviteMutation.isPending ? "Wird gesendet..." : (
                                  <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Einladung senden
                                  </>
                                )}
                              </Button>
                            </form>
                          </>
                        )}
                        
                        {/* Show message when max users reached */}
                        {!canInviteMore && (
                          <>
                            <Separator />
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              Maximale Anzahl an Nutzern erreicht ({maxUsers} Personen). 
                              {subscriptionStatus?.plan === 'family' && (
                                <span> Upgraden Sie auf Family Plus für bis zu 4 Personen.</span>
                              )}
                            </div>
                          </>
                        )}
                  </div>
                </>
              ) : (
                <div className="text-center py-6 md:py-8">
                  <p className="text-sm md:text-base text-muted-foreground mb-4">
                    Upgraden Sie auf Family (2 Personen) oder Family Plus (4 Personen), um weitere Personen einzuladen
                  </p>
                  <Button onClick={() => setUpgradeModalOpen(true)} data-testid="button-upgrade-for-share">
                    <Crown className="h-4 w-4 mr-2" />
                    Tarife vergleichen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </div>

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />

      <CheckoutDialog
        open={checkoutDialogOpen}
        onClose={() => setCheckoutDialogOpen(false)}
        selectedPlan={selectedPlan}
        selectedPeriod={selectedPeriod}
      />
      <DashboardFooter />
    </DashboardLayout>
  );
}
