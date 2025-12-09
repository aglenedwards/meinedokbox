import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Mail, UserPlus, X, Crown, Calendar, FileText, Settings as SettingsIcon, TrendingUp, HardDrive, ExternalLink, Download, Trash2 } from "lucide-react";
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
                          variant={getPlanBadgeVariant(subscriptionStatus.plan)}
                          data-testid="badge-plan-status"
                        >
                          {subscriptionStatus.plan === "family" ? "Family" : 
                           subscriptionStatus.plan === "family-plus" ? "Family Plus" : 
                           subscriptionStatus.plan === "solo" ? "Solo" :
                           subscriptionStatus.plan === "trial" ? "Trial" : "Free"}
                        </Badge>
                      </div>
                      {!['family', 'family-plus', 'solo'].includes(subscriptionStatus.plan) ? (
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

                    {/* Trial Days (if applicable) */}
                    {subscriptionStatus.plan === "trial" && subscriptionStatus.daysRemaining !== null && (
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
    </DashboardLayout>
  );
}
