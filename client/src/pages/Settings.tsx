import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Mail, UserPlus, X, Crown, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getCurrentUser, getSubscriptionStatus, type SubscriptionStatus } from "@/lib/api";
import type { User as UserType, SharedAccess } from "@shared/schema";
import { UpgradeModal } from "@/components/UpgradeModal";
import logoImage from "@assets/meinedokbox_1760966015056.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";

export default function Settings() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

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

  // Fetch shared access status
  const { data: sharedAccess } = useQuery<SharedAccess | null>({
    queryKey: ["/api/shared-access"],
    queryFn: async () => {
      const response = await fetch("/api/shared-access", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch shared access");
      }
      return response.json();
    },
    enabled: subscriptionStatus?.plan === "premium",
  });

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

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    if (subscriptionStatus?.plan !== "premium") {
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
    if (plan === "premium") return "default";
    if (plan === "trial") return "secondary";
    return "outline";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" data-testid="link-dashboard">
            <div className="flex items-center gap-3 cursor-pointer hover-elevate active-elevate-2 rounded-md px-3 py-2 -ml-3">
              <img src={logoImage} alt="MeineDokBox" className="h-10 w-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                MeineDokBox
              </h1>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Einstellungen</h2>
          <p className="text-muted-foreground">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Aktueller Plan</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-2xl font-bold" data-testid="text-plan-name">
                          {subscriptionStatus.displayName}
                        </p>
                        <Badge
                          variant={getPlanBadgeVariant(subscriptionStatus.plan)}
                          data-testid="badge-plan-status"
                        >
                          {subscriptionStatus.plan === "premium" ? "Premium" : subscriptionStatus.plan === "trial" ? "Trial" : "Free"}
                        </Badge>
                      </div>
                    </div>
                    {subscriptionStatus.plan !== "premium" && (
                      <Button
                        onClick={() => setUpgradeModalOpen(true)}
                        data-testid="button-upgrade"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgraden
                      </Button>
                    )}
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

                    {subscriptionStatus.plan === "premium" && (
                      <div>
                        <p className="text-sm text-muted-foreground">Preis</p>
                        <p className="text-lg font-medium mt-1" data-testid="text-price">
                          €{subscriptionStatus.price.toFixed(2)} / Monat
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Shared Access Card (Premium only) */}
          <Card data-testid="card-shared-access">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Zweite Person einladen
              </CardTitle>
              <CardDescription>
                {subscriptionStatus?.plan === "premium"
                  ? "Laden Sie eine weitere Person ein, um gemeinsam auf alle Dokumente zuzugreifen"
                  : "Verfügbar im Premium-Plan"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionStatus?.plan === "premium" ? (
                <>
                  {sharedAccess?.status === "active" || sharedAccess?.status === "pending" ? (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium" data-testid="text-shared-email">
                              {sharedAccess.sharedWithEmail}
                            </p>
                            <Badge
                              variant={sharedAccess.status === "active" ? "default" : "secondary"}
                              className="mt-2"
                              data-testid="badge-shared-status"
                            >
                              {sharedAccess.status === "active" ? "Aktiv" : "Ausstehend"}
                            </Badge>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleRevoke}
                            disabled={revokeMutation.isPending}
                            data-testid="button-revoke-access"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Widerrufen
                          </Button>
                        </div>
                      </div>
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
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Upgraden Sie auf Premium, um eine zweite Person einzuladen
                  </p>
                  <Button onClick={() => setUpgradeModalOpen(true)} data-testid="button-upgrade-for-share">
                    <Crown className="h-4 w-4 mr-2" />
                    Jetzt upgraden
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
    </div>
  );
}
