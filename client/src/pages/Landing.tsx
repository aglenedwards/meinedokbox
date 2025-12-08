import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { login, register, getCurrentUser, type LoginData, type RegisterData } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { FileText, Zap, Users, Shield, Sparkles, Check, ArrowRight, Camera, Scan, FolderOpen, X, TrendingUp, Clock, Brain, Search, Mail, Home, Briefcase, Heart, Eye, EyeOff, MapPin, Menu, Euro, Info, Lock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "wouter";
import logoImage from "@assets/meinedokbox_1760966015056.png";
import { Footer } from "@/components/Footer";

const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort erforderlich"),
});

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const registerSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string()
    .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
    .regex(passwordRegex, "Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben, eine Zahl und ein Sonderzeichen enthalten"),
  passwordConfirm: z.string(),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  acceptPrivacy: z.boolean().refine(val => val === true, {
    message: "Sie müssen den Datenschutzbestimmungen zustimmen"
  }),
}).refine(data => data.password === data.passwordConfirm, {
  message: "Passwörter stimmen nicht überein",
  path: ["passwordConfirm"],
});

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupPasswordConfirm, setShowSignupPasswordConfirm] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Scroll effect for progress bar
  useEffect(() => {
    const handleScroll = () => {
      if (!progressBarRef.current) return;

      const element = progressBarRef.current;
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Start when element enters viewport (bottom of element visible)
      // Complete at 50% of screen (middle)
      const elementTop = rect.top;
      const elementHeight = rect.height;
      
      // Calculate when element is visible
      if (elementTop < viewportHeight && elementTop + elementHeight > 0) {
        // Element is in viewport
        // Progress from viewport bottom to 50% of screen
        const start = viewportHeight; // Element just entered
        const end = viewportHeight / 2; // Middle of screen
        
        // Calculate progress (0 to 1)
        let progress = 0;
        if (elementTop <= start) {
          progress = Math.min(1, (start - elementTop) / (start - end));
        }
        
        // Apply to width (0% to 98%)
        const targetWidth = 98; // Target percentage
        setProgressBarWidth(progress * targetWidth);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    defaultValues: { 
      email: "", 
      password: "", 
      passwordConfirm: "",
      firstName: "", 
      lastName: "",
      acceptPrivacy: false
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      // Refetch user data and wait for it to complete
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      setAuthModalOpen(false);
      toast({
        title: "Willkommen zurück!",
        description: "Sie wurden erfolgreich angemeldet.",
      });
      // Redirect to dashboard after user data is loaded
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      // Check if error is due to unverified email
      if (error.message?.includes("E-Mail-Adresse")) {
        const email = loginForm.getValues("email");
        toast({
          title: "E-Mail-Adresse nicht bestätigt",
          description: "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.",
          variant: "destructive",
          action: (
            <ToastAction
              altText="E-Mail erneut senden"
              onClick={async () => {
                try {
                  const res = await fetch("/api/auth/resend-verification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                    credentials: "include",
                  });
                  const data = await res.json();
                  toast({
                    title: "E-Mail gesendet",
                    description: "Bitte überprüfen Sie Ihr Postfach.",
                  });
                } catch (err) {
                  toast({
                    title: "Fehler",
                    description: "E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Erneut senden
            </ToastAction>
          ),
        });
      } else {
        toast({
          title: "Anmeldung fehlgeschlagen",
          description: "E-Mail-Adresse oder Passwort ist falsch. Bitte überprüfen Sie Ihre Eingaben.",
          variant: "destructive",
        });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      // Don't redirect - show email verification message
      toast({
        title: "Registrierung erfolgreich!",
        description: "Bitte bestätigen Sie Ihre E-Mail-Adresse. Wir haben Ihnen einen Bestätigungslink gesendet.",
        duration: 10000,
      });
      registerForm.reset();
      setAuthTab("login");
    },
    onError: (error: Error) => {
      // Extract user-friendly message
      let userMessage = "Die Registrierung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.";
      
      if (error.message?.includes("bereits registriert")) {
        userMessage = "Diese E-Mail-Adresse wird bereits verwendet. Bitte melden Sie sich an oder verwenden Sie eine andere E-Mail-Adresse.";
      }
      
      toast({
        title: "Registrierung fehlgeschlagen",
        description: userMessage,
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-6 py-4 md:py-5 flex items-center justify-between gap-6">
          <div className="flex items-center flex-shrink-0 hover-elevate active-elevate-2 px-3 py-2 rounded-lg transition-all">
            <img src={logoImage} alt="MeineDokBox" className="h-12 md:h-14 lg:h-16 w-auto" data-testid="img-logo" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/funktionen">
              <Button variant="ghost" size="default" className="text-base font-medium px-5" data-testid="nav-funktionen">
                Funktionen
              </Button>
            </Link>
            <Link href="/sicherheit">
              <Button variant="ghost" size="default" className="text-base font-medium px-5" data-testid="nav-sicherheit">
                Sicherheit
              </Button>
            </Link>
            <Link href="/preise">
              <Button variant="ghost" size="default" className="text-base font-medium px-5" data-testid="nav-preise">
                Preise
              </Button>
            </Link>
            <Link href="/ueber-uns">
              <Button variant="ghost" size="default" className="text-base font-medium px-5" data-testid="nav-ueber-uns">
                Über uns
              </Button>
            </Link>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {user ? (
              <Button
                size="default"
                className="text-base font-semibold px-6 shadow-lg hover:shadow-xl transition-shadow"
                onClick={() => setLocation("/dashboard")}
                data-testid="button-header-dashboard"
              >
                Zum Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="default"
                  className="text-base font-medium px-5"
                  onClick={() => {
                    setAuthTab("login");
                    setAuthModalOpen(true);
                  }}
                  data-testid="button-header-login"
                >
                  Anmelden
                </Button>
                <Button
                  size="default"
                  className="text-base font-semibold px-6 shadow-lg hover:shadow-xl transition-shadow"
                  onClick={() => {
                    setAuthTab("signup");
                    setAuthModalOpen(true);
                  }}
                  data-testid="button-header-signup"
                >
                  Kostenlos testen
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11" data-testid="button-mobile-menu">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Menü öffnen</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[90vw] max-w-[340px] flex flex-col">
                <nav className="flex flex-col gap-2 flex-1 pt-6">
                  <Link href="/funktionen">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base font-medium h-14 px-4 gap-3"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="nav-mobile-funktionen"
                    >
                      <Zap className="h-5 w-5 text-primary" />
                      Funktionen
                    </Button>
                  </Link>
                  <Link href="/sicherheit">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base font-medium h-14 px-4 gap-3"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="nav-mobile-sicherheit"
                    >
                      <Shield className="h-5 w-5 text-primary" />
                      Sicherheit
                    </Button>
                  </Link>
                  <Link href="/preise">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base font-medium h-14 px-4 gap-3"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="nav-mobile-preise"
                    >
                      <Euro className="h-5 w-5 text-primary" />
                      Preise
                    </Button>
                  </Link>
                  <Link href="/ueber-uns">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base font-medium h-14 px-4 gap-3"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="nav-mobile-ueber-uns"
                    >
                      <Info className="h-5 w-5 text-primary" />
                      Über uns
                    </Button>
                  </Link>
                  
                  <div className="pt-3 border-t mt-auto space-y-4">
                    {user ? (
                      <Button
                        className="w-full text-base font-semibold h-14 gap-2"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setLocation("/dashboard");
                        }}
                        data-testid="button-mobile-dashboard"
                      >
                        Zum Dashboard
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="w-full text-base font-medium h-14"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setAuthTab("login");
                            setAuthModalOpen(true);
                          }}
                          data-testid="button-mobile-login"
                        >
                          Anmelden
                        </Button>
                        <Button
                          className="w-full text-base font-semibold h-14 gap-2"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setAuthTab("signup");
                            setAuthModalOpen(true);
                          }}
                          data-testid="button-mobile-signup"
                        >
                          Kostenlos testen
                          <ArrowRight className="h-5 w-5" />
                        </Button>
                        
                        {/* USPs */}
                        <div className="pt-4 space-y-2.5 pb-2">
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>7 Tage kostenlos testen</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>GDPR-konform in Deutschland</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Verschlüsselte Speicherung</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 hero-premium-bg">
        {/* Premium Mesh Gradient Background */}
        <div className="absolute inset-0 hero-mesh-gradient" />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/80 backdrop-blur-sm mb-8 shadow-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Jetzt 7 Tage kostenlos testen – keine Kreditkarte nötig</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight" data-testid="text-hero-title">
              Dokumente digitalisieren privat
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Intelligent organisiert.
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed" data-testid="text-hero-subtitle">
              Private Dokumente digitalisieren leicht gemacht: Einfach fotografieren, per E-Mail weiterleiten oder hochladen. 
              Automatisch kategorisiert und sicher in Deutschland archiviert.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button
                size="lg"
                className="text-lg px-8 py-6"
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
                className="text-lg px-8 py-6 bg-background/50 backdrop-blur-sm"
                onClick={() => {
                  setAuthTab("login");
                  setAuthModalOpen(true);
                }}
                data-testid="button-hero-login"
              >
                Anmelden
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">100% Deutschland</div>
                  <div className="text-sm text-muted-foreground">Daten auf deutschen Servern</div>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">DSGVO-konform</div>
                  <div className="text-sm text-muted-foreground">EU-Speicherung mit DPF-Absicherung</div>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">KI-Kategorisierung</div>
                  <div className="text-sm text-muted-foreground">Automatisch sortiert in Sekunden</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16" data-testid="text-features-title">
            Private Dokumente digitalisieren – alles was Sie brauchen
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-feature-ai">
              <CardHeader>
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">KI-Kategorisierung</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Dokumente werden automatisch erkannt und der richtigen Kategorie zugeordnet.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-feature-camera">
              <CardHeader>
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Smartphone-Scan</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Fotografieren Sie Dokumente direkt mit Ihrem Handy – automatische Optimierung inklusive.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-feature-email">
              <CardHeader>
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">E-Mail-Eingang</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Ihre persönliche E-Mail-Adresse zum Weiterleiten von Rechnungen – automatische Verarbeitung inklusive.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-feature-family">
              <CardHeader>
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Familien-Account</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Teilen Sie Ihren Account mit einem Partner. Jeder hat private und gemeinsame Dokumente.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-feature-security">
              <CardHeader>
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Sicher & Privat</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Ihre Dokumente sind verschlüsselt gespeichert. Standardmäßig privat, optional teilbar.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - 3-Step Process */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-howitworks-title">
              Digitalisierung von Dokumenten – so einfach geht's
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              In nur 3 Schritten vom Papierstapel zum organisierten Archiv – vollautomatisch dank KI
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="text-center space-y-6" data-testid="card-step-1">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-2">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                1
              </div>
              <h3 className="text-2xl font-semibold">Upload, Foto oder E-Mail</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Datei hochladen, mit dem Smartphone fotografieren oder an Ihre persönliche E-Mail weiterleiten. Die KI erkennt automatisch den Dokumententyp.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-6" data-testid="card-step-2">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-2">
                <Brain className="h-10 w-10 text-primary" />
              </div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                2
              </div>
              <h3 className="text-2xl font-semibold">KI analysiert</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Unsere KI extrahiert automatisch Datum, Betrag und Absender. Kein manuelles Eintippen mehr – alles wird intelligent erfasst.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-6" data-testid="card-step-3">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-2">
                <FolderOpen className="h-10 w-10 text-primary" />
              </div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                3
              </div>
              <h3 className="text-2xl font-semibold">Automatisch sortiert</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Das Dokument landet automatisch in der richtigen Kategorie. Finden Sie alles sofort wieder – keine Suche mehr nötig.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/5 border border-primary/20">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-semibold">Spart durchschnittlich 5 Stunden pro Monat</span>
            </div>
          </div>
        </div>
      </section>

      {/* Email Magic Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-primary/5 mb-6">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Einzigartiges Feature</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-email-magic-title">
                Ihre persönliche Dokumenten-E-Mail
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Jeder Nutzer erhält eine einzigartige E-Mail-Adresse. Einfach Rechnungen weiterleiten – automatisch verarbeitet und archiviert.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-8 pb-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">So funktioniert's</h3>
                      <p className="text-muted-foreground text-base leading-relaxed mb-3">
                        Sie erhalten eine E-Mail wie <span className="font-mono text-sm bg-muted px-2 py-1 rounded">ihre-dokumente@meinedokbox.de</span>. Leiten Sie einfach Rechnungen von Online-Shops, Versicherungen oder Ärzten weiter.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Pro-Tipp:</strong> Richten Sie in Ihrem E-Mail-Postfach eine automatische Weiterleitung ein – z.B. für alle Amazon-Bestellbestätigungen. So landet jede Rechnung automatisch in MeineDokBox.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="pt-8 pb-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Automatische Verarbeitung</h3>
                      <p className="text-muted-foreground text-base leading-relaxed">
                        PDF-Anhänge werden automatisch extrahiert, kategorisiert und in Ihrem Account gespeichert. Keine manuelle Arbeit mehr nötig.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg md:col-span-2">
                <CardContent className="pt-8 pb-8">
                  <h3 className="text-lg font-semibold mb-4">Perfekt für:</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Online-Bestellungen</p>
                        <p className="text-sm text-muted-foreground">Amazon, Zalando & Co.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Versicherungen</p>
                        <p className="text-sm text-muted-foreground">Policen & Abrechnungen</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Arzt & Apotheke</p>
                        <p className="text-sm text-muted-foreground">Rezepte & Befunde</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Problems We Solve */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-problems-title">
              Digitalisieren von Dokumenten – Schluss mit Papierchaos
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Diese alltäglichen Probleme gehören der Vergangenheit an
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Problem 1 */}
            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-problem-1">
              <CardContent className="pt-8 pb-8">
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
            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-problem-2">
              <CardContent className="pt-8 pb-8">
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
            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-problem-3">
              <CardContent className="pt-8 pb-8">
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
            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-problem-4">
              <CardContent className="pt-8 pb-8">
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
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Powered by AI</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-ai-title">
              KI-Magie im Detail
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Modernste Künstliche Intelligenz macht die Arbeit für Sie
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* AI Feature 1 */}
            <div className="space-y-6" data-testid="card-ai-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
                <Scan className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Intelligente Erkennung</h3>
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
            <div className="space-y-6" data-testid="card-ai-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Automatische Extraktion</h3>
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
            <div className="space-y-6" data-testid="card-ai-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Wird immer besser</h3>
              <p className="text-muted-foreground">
                Die KI lernt kontinuierlich dazu und wird mit jedem verarbeiteten Dokument präziser und schneller.
              </p>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10" ref={progressBarRef}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Genauigkeit</span>
                  <span className="text-sm font-bold text-primary">{Math.round(progressBarWidth)}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 ease-out" 
                    style={{ width: `${progressBarWidth}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-usecases-title">
              Für wen ist MeineDokBox?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Perfekt geeignet für alle, die Ordnung in ihre Dokumente bringen wollen
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Use Case 1 */}
            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-usecase-1">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                  <Home className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Junge Familien</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Kinderarzt-Rechnungen einfach weiterleiten, Kita-Verträge fotografieren, Nebenkostenabrechnungen hochladen – alles zentral organisiert. Beide Partner haben Zugriff.
                </CardDescription>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Gemeinsamer Familien-Account</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>E-Mail-Weiterleitung für Rechnungen</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Private & geteilte Ordner</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Use Case 2 */}
            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-usecase-2">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Selbstständige</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Online-Bestellungen automatisch archivieren durch E-Mail-Weiterleitung. Alle Belege perfekt vorbereitet für den Steuerberater.
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
            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-usecase-3">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Paare</CardTitle>
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

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-testimonials-title">
              Das sagen unsere Nutzer
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Vertrauen Sie auf sichere, DSGVO-konforme Dokumentenverwaltung
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <Card className="border-0 shadow-lg" data-testid="card-testimonial-1">
              <CardContent className="pt-8 pb-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} className="h-5 w-5 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-lg mb-6 leading-relaxed">
                  "Endlich habe ich all meine Dokumente im Griff. Die KI kategorisiert perfekt – ich spare mindestens 2 Stunden pro Woche!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Sarah M.</p>
                    <p className="text-sm text-muted-foreground">Mutter von 2 Kindern</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-0 shadow-lg" data-testid="card-testimonial-2">
              <CardContent className="pt-8 pb-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} className="h-5 w-5 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-lg mb-6 leading-relaxed">
                  "Für die Steuererklärung ist das ein Segen! Alle Belege automatisch erfasst und sortiert. Mein Steuerberater ist begeistert."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Thomas K.</p>
                    <p className="text-sm text-muted-foreground">Selbstständiger Designer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-0 shadow-lg" data-testid="card-testimonial-3">
              <CardContent className="pt-8 pb-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} className="h-5 w-5 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-lg mb-6 leading-relaxed">
                  "Mein Partner und ich haben endlich ein System! Keine 'Wo ist das Dokument?'-Fragen mehr. Einfach perfekt."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Julia & Marc</p>
                    <p className="text-sm text-muted-foreground">Paar, seit 2024 dabei</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6" data-testid="text-pricing-title">
            Digitalisierung Dokumente – einfache, transparente Preise
          </h2>
          <p className="text-xl text-center text-muted-foreground mb-8 leading-relaxed">
            7 Tage kostenlos testen. Keine Kreditkarte erforderlich.
          </p>

          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover-elevate"
              }`}
              data-testid="button-billing-monthly"
            >
              Monatlich
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover-elevate"
              }`}
              data-testid="button-billing-yearly"
            >
              Jährlich
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary-foreground/20">
                Spare 20%
              </span>
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Solo Plan */}
            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-pricing-solo">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl">Solo</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    €{billingPeriod === "monthly" ? "4,99" : "4,17"}
                  </span>
                  <span className="text-muted-foreground ml-2">/Monat</span>
                </div>
                {billingPeriod === "yearly" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Jährlich abgerechnet (€49,99/Jahr)
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>1 Benutzer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>50 Uploads/Monat</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>2 GB Speicherplatz</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>KI-Kategorisierung & mehr</span>
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
            <Card className="border-2 border-primary shadow-2xl relative md:scale-105 hover-elevate" data-testid="card-pricing-family">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Empfohlen
                </span>
              </div>
              <CardHeader className="text-center pb-6 pt-8">
                <CardTitle className="text-2xl">Family</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold">
                    €{billingPeriod === "monthly" ? "7,99" : "7,08"}
                  </span>
                  <span className="text-muted-foreground ml-2">/Monat</span>
                </div>
                {billingPeriod === "yearly" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Jährlich abgerechnet (€84,99/Jahr)
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>2 Benutzer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>200 Uploads/Monat</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>10 GB Speicherplatz</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Private & geteilte Ordner</span>
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
                  Jetzt 7 Tage kostenlos testen
                </Button>
              </CardContent>
            </Card>

            {/* Family Plus Plan */}
            <Card className="border-0 shadow-lg hover-elevate" data-testid="card-pricing-family-plus">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl">Family Plus</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    €{billingPeriod === "monthly" ? "11,99" : "10,00"}
                  </span>
                  <span className="text-muted-foreground ml-2">/Monat</span>
                </div>
                {billingPeriod === "yearly" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Jährlich abgerechnet (€119,99/Jahr)
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>4 Benutzer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>500 Uploads/Monat</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>25 GB Speicherplatz</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Prioritäts-Support & mehr</span>
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

          {/* Link to detailed pricing page */}
          <div className="text-center mt-12">
            <Link href="/preise">
              <Button variant="ghost" size="lg" className="text-base" data-testid="link-pricing-details">
                Alle Preisdetails & Features ansehen
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-faq-title">
                Häufig gestellte Fragen
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Alles Wichtige zur Digitalisierung Ihrer privaten Dokumente
              </p>
            </div>

            <div className="space-y-4">
              {/* FAQ Item 1 */}
              <Card className="border-0 shadow-lg overflow-hidden" data-testid="faq-item-1">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-muted/50 transition-colors">
                    <h3 className="font-semibold text-lg text-left pr-4">
                      Was kostet es, private Dokumente zu digitalisieren?
                    </h3>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-open:rotate-180 transition-transform">
                      <ArrowRight className="h-4 w-4 text-primary rotate-90" />
                    </div>
                  </summary>
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                    Mit MeineDokBox können Sie Ihre privaten Dokumente bereits ab 4,17 Euro pro Monat digitalisieren (bei jährlicher Zahlung). 
                    Sie starten mit einer kostenlosen 7-Tage-Testphase ohne Kreditkarte. Im Solo-Tarif erhalten Sie 50 Dokumente pro Monat 
                    und 5 GB Speicherplatz – perfekt für den Einstieg in die Digitalisierung Ihrer Dokumente.
                  </div>
                </details>
              </Card>

              {/* FAQ Item 2 */}
              <Card className="border-0 shadow-lg overflow-hidden" data-testid="faq-item-2">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-muted/50 transition-colors">
                    <h3 className="font-semibold text-lg text-left pr-4">
                      Wie sicher ist die Digitalisierung von Dokumenten bei MeineDokBox?
                    </h3>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-open:rotate-180 transition-transform">
                      <ArrowRight className="h-4 w-4 text-primary rotate-90" />
                    </div>
                  </summary>
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                    Ihre digitalisierten Dokumente werden ausschließlich auf deutschen Servern gespeichert und sind vollständig DSGVO-konform. 
                    Die Übertragung erfolgt verschlüsselt und Ihre Daten werden niemals an Dritte weitergegeben. 
                    Zusätzlich schützt das EU-US Data Privacy Framework Ihre Dokumente bei der KI-Verarbeitung.
                  </div>
                </details>
              </Card>

              {/* FAQ Item 3 */}
              <Card className="border-0 shadow-lg overflow-hidden" data-testid="faq-item-3">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-muted/50 transition-colors">
                    <h3 className="font-semibold text-lg text-left pr-4">
                      Welche Dokumente kann ich digitalisieren?
                    </h3>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-open:rotate-180 transition-transform">
                      <ArrowRight className="h-4 w-4 text-primary rotate-90" />
                    </div>
                  </summary>
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                    Sie können alle privaten Dokumente digitalisieren: Rechnungen, Verträge, Versicherungspolicen, Arztbriefe, 
                    Gehaltsabrechnungen, Steuerbescheide, Kontoauszüge und vieles mehr. Unsere KI erkennt automatisch 15 verschiedene 
                    Kategorien und sortiert Ihre Dokumente intelligent ein – vom Mietvertrag bis zur Online-Bestellung.
                  </div>
                </details>
              </Card>

              {/* FAQ Item 4 */}
              <Card className="border-0 shadow-lg overflow-hidden" data-testid="faq-item-4">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-muted/50 transition-colors">
                    <h3 className="font-semibold text-lg text-left pr-4">
                      Wie funktioniert das Digitalisieren von Dokumenten mit dem Smartphone?
                    </h3>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-open:rotate-180 transition-transform">
                      <ArrowRight className="h-4 w-4 text-primary rotate-90" />
                    </div>
                  </summary>
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                    Öffnen Sie einfach MeineDokBox auf Ihrem Smartphone und fotografieren Sie das Dokument. 
                    Die App optimiert das Bild automatisch für beste Lesbarkeit. Unsere KI analysiert den Inhalt, 
                    extrahiert wichtige Daten wie Datum, Betrag und Absender und ordnet das Dokument der passenden Kategorie zu. 
                    Der gesamte Vorgang dauert nur wenige Sekunden.
                  </div>
                </details>
              </Card>

              {/* FAQ Item 5 */}
              <Card className="border-0 shadow-lg overflow-hidden" data-testid="faq-item-5">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-muted/50 transition-colors">
                    <h3 className="font-semibold text-lg text-left pr-4">
                      Kann ich meine digitalisierten Dokumente mit meinem Partner teilen?
                    </h3>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-open:rotate-180 transition-transform">
                      <ArrowRight className="h-4 w-4 text-primary rotate-90" />
                    </div>
                  </summary>
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                    Ja! Mit dem Family-Tarif können Sie einen Partner einladen und gemeinsam Dokumente verwalten. 
                    Jeder Partner hat seinen eigenen privaten Bereich und zusätzlich einen gemeinsamen Bereich für geteilte Dokumente. 
                    So behalten Sie die Kontrolle über persönliche Unterlagen und haben gleichzeitig alle Haushaltsdokumente gemeinsam im Blick.
                  </div>
                </details>
              </Card>

              {/* FAQ Item 6 */}
              <Card className="border-0 shadow-lg overflow-hidden" data-testid="faq-item-6">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-muted/50 transition-colors">
                    <h3 className="font-semibold text-lg text-left pr-4">
                      Was passiert mit meinen Dokumenten, wenn ich kündige?
                    </h3>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-open:rotate-180 transition-transform">
                      <ArrowRight className="h-4 w-4 text-primary rotate-90" />
                    </div>
                  </summary>
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                    Vor einer Kündigung können Sie alle Ihre digitalisierten Dokumente als ZIP-Datei herunterladen. 
                    Nach der Kündigung haben Sie noch 30 Tage Lesezugriff auf Ihre Dokumente. 
                    Ihre Daten gehören Ihnen – wir machen den Export so einfach wie möglich.
                  </div>
                </details>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />

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
                : "Starten Sie Ihre 7-tägige kostenlose Testphase."}
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
                          <div className="flex gap-2">
                            <Input
                              type={showLoginPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                              data-testid="input-login-password"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              data-testid="button-toggle-login-password"
                            >
                              {showLoginPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalOpen(false);
                        setForgotPasswordOpen(true);
                      }}
                      className="text-sm text-primary hover:underline"
                      data-testid="link-forgot-password"
                    >
                      Passwort vergessen?
                    </button>
                  </div>

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
                          <FormLabel>Vorname *</FormLabel>
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
                          <FormLabel>Nachname *</FormLabel>
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
                        <FormLabel>E-Mail *</FormLabel>
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
                        <FormLabel>Passwort *</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              type={showSignupPassword ? "text" : "password"}
                              placeholder="Min. 8 Zeichen, Großbuchstabe, Zahl, Sonderzeichen"
                              {...field}
                              data-testid="input-signup-password"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setShowSignupPassword(!showSignupPassword)}
                              data-testid="button-toggle-signup-password"
                            >
                              {showSignupPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="passwordConfirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passwort wiederholen *</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              type={showSignupPasswordConfirm ? "text" : "password"}
                              placeholder="Passwort erneut eingeben"
                              {...field}
                              data-testid="input-signup-password-confirm"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setShowSignupPasswordConfirm(!showSignupPasswordConfirm)}
                              data-testid="button-toggle-signup-password-confirm"
                            >
                              {showSignupPasswordConfirm ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="acceptPrivacy"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-signup-privacy"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            Ich habe die{" "}
                            <a 
                              href="/datenschutz" 
                              target="_blank" 
                              className="text-primary underline"
                              data-testid="link-privacy-policy"
                            >
                              Datenschutzerklärung
                            </a>{" "}
                            gelesen und akzeptiere diese. *
                          </FormLabel>
                          <FormMessage />
                        </div>
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

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passwort zurücksetzen</DialogTitle>
            <DialogDescription>
              Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">E-Mail-Adresse</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="ihre@email.de"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                data-testid="input-forgot-password-email"
              />
            </div>
            <Button
              className="w-full"
              onClick={async () => {
                try {
                  const res = await fetch("/api/auth/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: forgotPasswordEmail }),
                    credentials: "include",
                  });
                  const data = await res.json();
                  toast({
                    title: "E-Mail gesendet",
                    description: data.message,
                  });
                  setForgotPasswordOpen(false);
                  setForgotPasswordEmail("");
                } catch (err) {
                  toast({
                    title: "Fehler",
                    description: "E-Mail konnte nicht gesendet werden",
                    variant: "destructive",
                  });
                }
              }}
              data-testid="button-forgot-password-submit"
            >
              Zurücksetzen-Link senden
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
