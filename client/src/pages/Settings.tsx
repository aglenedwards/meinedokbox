import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Mail, UserPlus, X, Crown, Calendar, FileText, LogOut, Home, Trash2, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getCurrentUser, getSubscriptionStatus, logout, type SubscriptionStatus } from "@/lib/api";
import type { User as UserType, SharedAccess } from "@shared/schema";
import { UpgradeModal } from "@/components/UpgradeModal";
import { CheckoutDialog } from "@/components/CheckoutDialog";
import { Footer } from "@/components/Footer";
import { EmailWhitelistSettings } from "@/components/EmailWhitelistSettings";
import logoImage from "@assets/meinedokbox_1760966015056.png";
import { Link } from "wouter";

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
        description: error.message,
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
        description: error.message,
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
        description: error.message,
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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/";
      toast({
        title: "Abgemeldet",
        description: "Sie wurden erfolgreich abgemeldet.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Abmeldung fehlgeschlagen",
        description: error.message,
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex items-center justify-between md:justify-start gap-3">
              <img src={logoImage} alt="MeineDokBox" className="h-12 md:h-16" data-testid="img-logo" />
              <div className="flex items-center gap-2 md:hidden">
                <Link href="/">
                  <Button variant="ghost" size="sm" data-testid="button-dashboard-mobile">
                    <Home className="h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout-mobile"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <Link href="/trash">
                <Button variant="outline" size="sm" data-testid="button-trash">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Papierkorb
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              {user?.email === "service@meinedokbox.de" && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" data-testid="button-admin">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="mb-4 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Einstellungen</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Verwalten Sie Ihr Abonnement und Ihre Kontoeinstellungen
          </p>
        </div>

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

          {/* Subscription Card */}
          <Card data-testid="card-subscription">
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
                      {!['family', 'family-plus'].includes(subscriptionStatus.plan) && (
                        <Button
                          onClick={() => setCheckoutDialogOpen(true)}
                          data-testid="button-upgrade"
                          size="sm"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Upgraden
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Dokumente
                      </p>
                      <p className="text-lg font-medium mt-1" data-testid="text-document-count">
                        {subscriptionStatus.currentDocuments} / {subscriptionStatus.maxDocuments === -1 ? "∞" : subscriptionStatus.maxDocuments}
                      </p>
                    </div>

                    {subscriptionStatus.plan === "trial" && subscriptionStatus.daysRemaining !== null && (
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Verbleibende Tage
                        </p>
                        <p className="text-lg font-medium mt-1" data-testid="text-trial-days">
                          {subscriptionStatus.daysRemaining} Tage
                        </p>
                      </div>
                    )}

                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Email Whitelist (Security Feature) */}
          <EmailWhitelistSettings />

          {/* Shared Access Card (Family & Family Plus) */}
          <Card data-testid="card-shared-access">
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
                  {allSharedAccess && allSharedAccess.length > 0 ? (
                    <div className="space-y-4">
                      {allSharedAccess.map((access) => {
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
                                    <Mail className="h-4 w-4 mr-2" />
                                    Erneut senden
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
                                    <Mail className="h-4 w-4 mr-2" />
                                    Neu einladen
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
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Löschen
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
                                    <X className="h-4 w-4 mr-2" />
                                    Widerrufen
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Show invitation form only if no active invitation exists */}
                      {!sharedAccess && (
                        <form onSubmit={handleInvite} className="space-y-4">
                          <Separator />
                          <div>
                            <Label htmlFor="invite-email">Weitere Person einladen</Label>
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
                            {inviteMutation.isPending ? "Wird gesendet..." : "Einladung senden"}
                          </Button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleInvite} className="space-y-4">
                      <div>
                        <Label htmlFor="invite-email">E-Mail-Adresse</Label>
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
                        <UserPlus className="h-4 w-4 mr-2" />
                        Einladung senden
                      </Button>
                    </form>
                  )}
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
      </main>

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

      <Footer />
    </div>
  );
}
