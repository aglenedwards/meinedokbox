import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift, Copy, Check, Users, TrendingUp, Award, Share2, Clock, CheckCircle, XCircle, PartyPopper } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardFooter } from "@/components/DashboardFooter";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  bonusStorageGB: number;
  isFreeFromReferrals: boolean;
  currentPlan: string;
  requiredReferrals: number;
  referrals: {
    id: number;
    status: string;
    createdAt: string;
    activatedAt: string | null;
  }[];
}

const getPlanDisplayName = (plan: string): string => {
  switch (plan) {
    case 'family-plus': return 'Family-Plus-Plan';
    case 'family': return 'Family-Plan';
    case 'solo': return 'Solo-Plan';
    default: return 'Plan';
  }
};

export default function Referral() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: referralData, isLoading } = useQuery<ReferralData>({
    queryKey: ["/api/referral"],
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Link kopiert",
        description: "Der Empfehlungslink wurde in die Zwischenablage kopiert.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Link konnte nicht kopiert werden.",
        variant: "destructive",
      });
    }
  };

  const shareLink = async () => {
    if (!referralData?.referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "MeineDokBox - Dokumente einfach digitalisieren",
          text: "Ich nutze MeineDokBox, um meine Dokumente zu digitalisieren. Probiere es auch aus!",
          url: referralData.referralLink,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          copyToClipboard(referralData.referralLink);
        }
      }
    } else {
      copyToClipboard(referralData.referralLink);
    }
  };

  const requiredReferrals = referralData?.requiredReferrals || 5;
  const progressToFree = referralData ? Math.min((referralData.activeReferrals / requiredReferrals) * 100, 100) : 0;
  const remainingForFree = referralData ? Math.max(requiredReferrals - referralData.activeReferrals, 0) : requiredReferrals;
  const planName = referralData ? getPlanDisplayName(referralData.currentPlan) : 'Plan';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Zahlender Kunde
          </Badge>
        );
      case "churned":
        return (
          <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Abo beendet
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Noch nicht bezahlt
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-48 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3" data-testid="text-referral-title">
                <Gift className="h-7 w-7 text-primary" />
                Freunde einladen
              </h1>
              <p className="text-muted-foreground mt-2">
                Empfiehl MeineDokBox weiter und erhalte Bonusspeicher sowie kostenlose Premium-Vorteile!
              </p>
            </div>

            {!referralData?.isFreeFromReferrals && (
              <Card className="mb-6 border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                <CardContent className="pt-6 pb-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/20 shrink-0">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">MeineDokBox dauerhaft kostenlos nutzen!</h3>
                      <p className="text-muted-foreground">
                        Empfiehl {requiredReferrals} Freunde, die zahlende Kunden werden - und dein {planName} wird <span className="font-semibold text-primary">dauerhaft kostenlos</span>.
                        Aktuell: <span className="font-bold">{referralData?.activeReferrals || 0}/{requiredReferrals}</span> aktive Empfehlungen.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {referralData?.isFreeFromReferrals && (
              <Card className="mb-6 border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <PartyPopper className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Glückwunsch! Du nutzt MeineDokBox kostenlos</h3>
                      <p className="text-muted-foreground">
                        Dank deiner {referralData.activeReferrals} aktiven Empfehlungen ist dein {planName} dauerhaft kostenlos!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-500/10">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Empfehlungen</p>
                      <p className="text-2xl font-bold" data-testid="text-total-referrals">
                        {referralData?.totalReferrals || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Aktive Kunden</p>
                      <p className="text-2xl font-bold" data-testid="text-active-referrals">
                        {referralData?.activeReferrals || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-500/10">
                      <Award className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bonus-Speicher</p>
                      <p className="text-2xl font-bold" data-testid="text-bonus-storage">
                        +{referralData?.bonusStorageGB || 0} GB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Dein persönlicher Empfehlungslink
                </CardTitle>
                <CardDescription>
                  Teile diesen Link mit Freunden und Familie. Für jeden zahlenden Kunden erhältst du +1 GB Speicher!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={referralData?.referralLink || ""}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="input-referral-link"
                  />
                  <Button
                    onClick={() => referralData?.referralLink && copyToClipboard(referralData.referralLink)}
                    variant="outline"
                    size="icon"
                    data-testid="button-copy-link"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button onClick={shareLink} data-testid="button-share-link">
                    <Share2 className="h-4 w-4 mr-2" />
                    Teilen
                  </Button>
                </div>

                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-1">So funktioniert es:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>1. Teile deinen Link mit Freunden und Familie</li>
                    <li>2. Sobald jemand zahlender Kunde wird: +1 GB Bonus-Speicher für dich!</li>
                    <li>3. Bei {requiredReferrals} zahlenden Kunden: Dein {planName} wird dauerhaft kostenlos!</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {!referralData?.isFreeFromReferrals && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Fortschritt zum kostenlosen {planName}
                  </CardTitle>
                  <CardDescription>
                    Noch {remainingForFree} zahlende{remainingForFree === 1 ? "r" : ""} Kunde{remainingForFree === 1 ? "" : "n"} bis zum dauerhaft kostenlosen {planName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{referralData?.activeReferrals || 0} von {requiredReferrals} aktiven Kunden</span>
                      <span className="text-muted-foreground">{Math.round(progressToFree)}%</span>
                    </div>
                    <Progress value={progressToFree} className="h-3" />
                  </div>

                  <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(requiredReferrals, 5)}, 1fr)` }}>
                    {Array.from({ length: requiredReferrals }).map((_, index) => {
                      const referral = referralData?.referrals[index];
                      let bgClass = "bg-muted text-muted-foreground";
                      let statusText = "Frei";
                      
                      if (referral) {
                        if (referral.status === "active") {
                          bgClass = "bg-green-500 text-white";
                          statusText = "Aktiv";
                        } else if (referral.status === "churned") {
                          bgClass = "bg-gray-400 text-white";
                          statusText = "Beendet";
                        } else {
                          bgClass = "bg-amber-500 text-white";
                          statusText = "Test";
                        }
                      }
                      
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg text-center transition-all ${bgClass}`}
                          title={referral ? `Registriert: ${new Date(referral.createdAt).toLocaleDateString("de-DE")}` : "Noch frei"}
                        >
                          <Users className="h-5 w-5 mx-auto mb-1" />
                          <span className="text-xs font-medium">{statusText}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {referralData && referralData.referrals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Deine Empfehlungen</CardTitle>
                  <CardDescription>
                    Übersicht über alle Nutzer, die sich über deinen Link registriert haben
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {referralData.referrals.map((referral, index) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        data-testid={`row-referral-${referral.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Empfehlung #{referral.id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Registriert am {new Date(referral.createdAt).toLocaleDateString("de-DE")}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(referral.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {referralData && referralData.referrals.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="font-medium text-lg mb-2">Noch keine Empfehlungen</h3>
                    <p className="text-muted-foreground mb-4">
                      Teile deinen persönlichen Link, um Bonus-Speicher zu sammeln!
                    </p>
                    <Button onClick={shareLink} data-testid="button-share-empty">
                      <Share2 className="h-4 w-4 mr-2" />
                      Jetzt teilen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator className="my-8" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Deine Vorteile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-green-500/10 mt-0.5">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">+1 GB pro zahlenden Kunden</p>
                      <p className="text-sm text-muted-foreground">
                        Sobald eine Empfehlung zahlender Kunde wird
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-green-500/10 mt-0.5">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Kostenloser Family-Plan</p>
                      <p className="text-sm text-muted-foreground">
                        Bei 5 aktiven zahlenden Kunden
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-green-500/10 mt-0.5">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Keine Obergrenze</p>
                      <p className="text-sm text-muted-foreground">
                        Sammle unbegrenzt Bonus-Speicher
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vorteile für Eingeladene</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-blue-500/10 mt-0.5">
                      <Check className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Einfache Einrichtung</p>
                      <p className="text-sm text-muted-foreground">
                        In wenigen Minuten startklar
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-blue-500/10 mt-0.5">
                      <Check className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">DSGVO-konform</p>
                      <p className="text-sm text-muted-foreground">
                        Alle Daten bleiben in Deutschland
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <DashboardFooter />
      </div>
    </DashboardLayout>
  );
}
