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
import { FileText, Zap, Users, Shield, Sparkles, Check, ArrowRight } from "lucide-react";
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
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
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
              14 Tage kostenlos testen
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

      {/* Pricing */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4" data-testid="text-pricing-title">
            Einfache, transparente Preise
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            14 Tage kostenlos testen. Keine Kreditkarte erforderlich.
          </p>
          
          <div className="max-w-lg mx-auto">
            <Card className="border-primary shadow-lg" data-testid="card-pricing">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">Premium Family</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold">€4,99</span>
                  <span className="text-muted-foreground ml-2">/Monat</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>2 Benutzer pro Account</span>
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
                    <span>KI-gestützte Kategorisierung</span>
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
                    <span>E-Mail-Dokumenteneingang</span>
                  </li>
                </ul>
                <Button
                  className="w-full mt-6"
                  size="lg"
                  onClick={() => {
                    setAuthTab("signup");
                    setAuthModalOpen(true);
                  }}
                  data-testid="button-pricing-cta"
                >
                  Jetzt 14 Tage kostenlos testen
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
