import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { login, register, getCurrentUser, type LoginData, type RegisterData } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { FileText, Zap, Users, Shield, Sparkles, Check, ArrowRight, Camera, Scan, FolderOpen, X, TrendingUp, Clock, Brain, Search, Mail, Home, Briefcase, Heart } from "lucide-react";
import logoImage from "@assets/meinedokbox_1760966015056.png";

const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort erforderlich"),
});

const registerSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");

  // Check if user is already logged in
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getCurrentUser,
    retry: false,
  });

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", firstName: "", lastName: "" },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setAuthModalOpen(false);
      setLocation("/dashboard");
      toast({
        title: "Willkommen zurück!",
        description: "Sie wurden erfolgreich angemeldet.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setAuthModalOpen(false);
      setLocation("/dashboard");
      toast({
        title: "Willkommen bei MeineDokBox!",
        description: "Ihr Account wurde erfolgreich erstellt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registrierung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="MeineDokBox" className="h-12 md:h-16 dark:invert dark:brightness-0 dark:contrast-200" data-testid="img-logo" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={() => {
                setAuthTab("login");
                setAuthModalOpen(true);
              }}
              data-testid="button-header-login"
            >
              Anmelden
            </Button>
            <Button
              onClick={() => {
                setAuthTab("signup");
                setAuthModalOpen(true);
              }}
              data-testid="button-header-signup"
            >
              Kostenlos testen
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 dark:from-primary/10 dark:via-background dark:to-primary/5" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Jetzt 14 Tage kostenlos testen</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight" data-testid="text-hero-title">
              Ihre Dokumente.<br />Intelligent organisiert.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-subtitle">
              KI-gestützte Dokumentenverwaltung für Familien. Einfach fotografieren, automatisch kategorisieren, gemeinsam organisieren.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => {
                  setAuthTab("signup");
                  setAuthModalOpen(true);
                }}
                data-testid="button-hero-cta"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setAuthTab("login");
                  setAuthModalOpen(true);
                }}
                data-testid="button-hero-login"
              >
                Anmelden
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12" data-testid="text-features-title">
            Alles, was Sie brauchen
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="card-feature-ai">
              <CardHeader>
                <Sparkles className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>KI-Kategorisierung</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Dokumente werden automatisch erkannt und der richtigen Kategorie zugeordnet.
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-camera">
              <CardHeader>
                <FileText className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Smartphone-Scan</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Fotografieren Sie Dokumente direkt mit Ihrem Handy – automatische Optimierung inklusive.
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-family">
              <CardHeader>
                <Users className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Familien-Account</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Teilen Sie Ihren Account mit einem Partner. Jeder hat private und gemeinsame Dokumente.
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-security">
              <CardHeader>
                <Shield className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Sicher & Privat</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Ihre Dokumente sind verschlüsselt gespeichert. Standardmäßig privat, optional teilbar.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - 3-Step Process */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-howitworks-title">
              So einfach geht's
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              In nur 3 Schritten vom Papierstapel zum organisierten Archiv – vollautomatisch dank KI
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center space-y-4" data-testid="card-step-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold mb-2">
                1
              </div>
              <h3 className="text-xl font-semibold">Foto machen</h3>
              <p className="text-muted-foreground">
                Fotografieren Sie Ihr Dokument mit dem Smartphone. Die KI erkennt automatisch den Dokumententyp – ob Rechnung, Vertrag oder Brief.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4" data-testid="card-step-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold mb-2">
                2
              </div>
              <h3 className="text-xl font-semibold">KI analysiert</h3>
              <p className="text-muted-foreground">
                Unsere KI extrahiert automatisch Datum, Betrag und Absender. Kein manuelles Eintippen mehr – alles wird intelligent erfasst.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4" data-testid="card-step-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <FolderOpen className="h-8 w-8 text-primary" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold mb-2">
                3
              </div>
              <h3 className="text-xl font-semibold">Automatisch sortiert</h3>
              <p className="text-muted-foreground">
                Das Dokument landet automatisch in der richtigen Kategorie. Finden Sie alles sofort wieder – keine Suche mehr nötig.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/5 border border-primary/20">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-semibold">Spart durchschnittlich 10+ Stunden pro Monat</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problems We Solve */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-problems-title">
              Schluss mit Papierchaos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Diese alltäglichen Probleme gehören der Vergangenheit an
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Problem 1 */}
            <Card className="hover-elevate" data-testid="card-problem-1">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <X className="h-6 w-6 text-destructive" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-destructive">Verlorene Rechnungen</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      "Wo ist nochmal die Rechnung vom letzten Monat?"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 mt-4 pt-4 border-t">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Alles sofort findbar</h3>
                    <p className="text-sm text-muted-foreground">
                      Durchsuchen Sie alle Dokumente in Sekunden. Die KI findet jede Rechnung blitzschnell.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problem 2 */}
            <Card className="hover-elevate" data-testid="card-problem-2">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <X className="h-6 w-6 text-destructive" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-destructive">Papierstapel überall</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Schreibtisch voller Post, Ordner quellen über
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 mt-4 pt-4 border-t">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Digital & aufgeräumt</h3>
                    <p className="text-sm text-muted-foreground">
                      Alle Dokumente zentral gespeichert, jederzeit von überall abrufbar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problem 3 */}
            <Card className="hover-elevate" data-testid="card-problem-3">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <X className="h-6 w-6 text-destructive" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-destructive">Partner fragt ständig</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      "Wo hast du die Versicherungspolice abgelegt?"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 mt-4 pt-4 border-t">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Gemeinsam zugreifen</h3>
                    <p className="text-sm text-muted-foreground">
                      Beide Partner haben Zugriff auf alle wichtigen Dokumente. Keine Rückfragen mehr.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problem 4 */}
            <Card className="hover-elevate" data-testid="card-problem-4">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <X className="h-6 w-6 text-destructive" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-destructive">Steuerzeit = Chaos</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Stundenlang alle Belege zusammensuchen
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 mt-4 pt-4 border-t">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Alle Belege an einem Ort</h3>
                    <p className="text-sm text-muted-foreground">
                      Exportieren Sie alle Belege eines Jahres mit einem Klick. Steuer wird zum Kinderspiel.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Magic Details */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-primary/5 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Powered by AI</span>
            </div>
            <h2 className="text-3xl font-bold mb-4" data-testid="text-ai-title">
              KI-Magie im Detail
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Modernste Künstliche Intelligenz macht die Arbeit für Sie
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* AI Feature 1 */}
            <div className="space-y-4" data-testid="card-ai-1">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                <Scan className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Intelligente Erkennung</h3>
              <p className="text-muted-foreground">
                Die KI erkennt automatisch ob es sich um eine Rechnung, einen Vertrag, eine Versicherungspolice oder einen Brief handelt.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-muted">Rechnungen</span>
                <span className="text-xs px-3 py-1 rounded-full bg-muted">Verträge</span>
                <span className="text-xs px-3 py-1 rounded-full bg-muted">Versicherungen</span>
                <span className="text-xs px-3 py-1 rounded-full bg-muted">15+ Kategorien</span>
              </div>
            </div>

            {/* AI Feature 2 */}
            <div className="space-y-4" data-testid="card-ai-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                <Search className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Automatische Extraktion</h3>
              <p className="text-muted-foreground">
                Datum, Betrag und Absender werden automatisch aus dem Dokument extrahiert. Kein manuelles Abtippen mehr nötig.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Rechnungsdatum</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Beträge & Summen</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Absender & Empfänger</span>
                </div>
              </div>
            </div>

            {/* AI Feature 3 */}
            <div className="space-y-4" data-testid="card-ai-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Wird immer besser</h3>
              <p className="text-muted-foreground">
                Die KI lernt kontinuierlich dazu und wird mit jedem verarbeiteten Dokument präziser und schneller.
              </p>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Genauigkeit</span>
                  <span className="text-sm font-bold text-primary">98%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/60" style={{ width: '98%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-usecases-title">
              Für wen ist MeineDokBox?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Perfekt geeignet für alle, die Ordnung in ihre Dokumente bringen wollen
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Use Case 1 */}
            <Card className="hover-elevate" data-testid="card-usecase-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Junge Familien</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Kinderarzt-Befunde, Kita-Verträge, Nebenkostenabrechnungen – alles zentral organisiert. Beide Partner haben Zugriff.
                </CardDescription>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Gemeinsamer Familien-Account</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Private & geteilte Ordner</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Immer griffbereit</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Use Case 2 */}
            <Card className="hover-elevate" data-testid="card-usecase-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Selbstständige</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Alle Belege für die Steuer automatisch erfasst. Rechnungen, Quittungen, Verträge – perfekt vorbereitet für den Steuerberater.
                </CardDescription>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Automatische Beleg-Erfassung</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Export für Steuererklärung</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>E-Mail-Eingang für Belege</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Use Case 3 */}
            <Card className="hover-elevate" data-testid="card-usecase-3">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Paare</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Gemeinsam organisieren ohne Chaos. Beide haben Zugriff auf wichtige Dokumente – keine "Wo hast du...?"-Fragen mehr.
                </CardDescription>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Geteilter Zugriff</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Persönliche Private-Bereiche</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Keine Doppelarbeit</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4" data-testid="text-pricing-title">
            Einfache, transparente Preise
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            14 Tage kostenlos testen. Keine Kreditkarte erforderlich.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Solo Plan */}
            <Card data-testid="card-pricing-solo">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl">Solo</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€3,99</span>
                  <span className="text-muted-foreground ml-2">/Monat</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>1 Benutzer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>2 GB Speicherplatz</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Unbegrenzte Dokumente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>KI-Kategorisierung</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Smartphone-App & PWA</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>E-Mail-Eingang</span>
                  </li>
                </ul>
                <Button
                  className="w-full mt-6"
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setAuthTab("signup");
                    setAuthModalOpen(true);
                  }}
                  data-testid="button-pricing-solo"
                >
                  Kostenlos testen
                </Button>
              </CardContent>
            </Card>

            {/* Family Plan - Hervorgehoben */}
            <Card className="border-primary shadow-lg relative md:scale-105" data-testid="card-pricing-family">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Empfohlen
                </span>
              </div>
              <CardHeader className="text-center pb-6 pt-8">
                <CardTitle className="text-2xl">Family</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold">€6,99</span>
                  <span className="text-muted-foreground ml-2">/Monat</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>2 Benutzer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>5 GB Speicherplatz (geteilt)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Unbegrenzte Dokumente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>KI-Kategorisierung</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Smartphone-App & PWA</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Private & geteilte Ordner</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>E-Mail-Eingang</span>
                  </li>
                </ul>
                <Button
                  className="w-full mt-6"
                  size="lg"
                  onClick={() => {
                    setAuthTab("signup");
                    setAuthModalOpen(true);
                  }}
                  data-testid="button-pricing-family"
                >
                  Jetzt 14 Tage kostenlos testen
                </Button>
              </CardContent>
            </Card>

            {/* Family Plus Plan */}
            <Card data-testid="card-pricing-family-plus">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl">Family Plus</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€9,99</span>
                  <span className="text-muted-foreground ml-2">/Monat</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>4 Benutzer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>15 GB Speicherplatz (geteilt)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Unbegrenzte Dokumente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>KI-Kategorisierung</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Smartphone-App & PWA</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Private & geteilte Ordner</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>E-Mail-Eingang</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Prioritäts-Support</span>
                  </li>
                </ul>
                <Button
                  className="w-full mt-6"
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setAuthTab("signup");
                    setAuthModalOpen(true);
                  }}
                  data-testid="button-pricing-family-plus"
                >
                  Kostenlos testen
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 MeineDokBox. Alle Rechte vorbehalten.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-auth">
          <DialogHeader>
            <DialogTitle>
              {authTab === "login" ? "Anmelden" : "Account erstellen"}
            </DialogTitle>
            <DialogDescription>
              {authTab === "login"
                ? "Melden Sie sich bei Ihrem Account an."
                : "Starten Sie Ihre 14-tägige kostenlose Testphase."}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Anmelden</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">Registrieren</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="ihre@email.de"
                            {...field}
                            data-testid="input-login-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passwort</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            data-testid="input-login-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-login-submit"
                  >
                    {loginMutation.isPending ? "Anmelden..." : "Anmelden"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="signup">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vorname (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Max"
                              {...field}
                              data-testid="input-signup-firstname"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nachname (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Mustermann"
                              {...field}
                              data-testid="input-signup-lastname"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="ihre@email.de"
                            {...field}
                            data-testid="input-signup-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passwort</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Mindestens 8 Zeichen"
                            {...field}
                            data-testid="input-signup-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                    data-testid="button-signup-submit"
                  >
                    {registerMutation.isPending ? "Registrieren..." : "Kostenlos registrieren"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
