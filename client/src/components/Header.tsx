import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Menu, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { login, register, getCurrentUser, type LoginData, type RegisterData } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import type { User } from "@shared/schema";
import logoImage from "@assets/meinedokbox_1760966015056.png";

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

export function Header() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupPasswordConfirm, setShowSignupPasswordConfirm] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  
  const navItems = [
    { href: "/funktionen", label: "Funktionen" },
    { href: "/sicherheit", label: "Sicherheit" },
    { href: "/preise", label: "Preise" },
    { href: "/ueber-uns", label: "Über uns" },
  ];

  const isActive = (path: string) => location === path;

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
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      setAuthModalOpen(false);
      toast({
        title: "Willkommen zurück!",
        description: "Sie wurden erfolgreich angemeldet.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
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
                  await fetch("/api/auth/resend-verification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                    credentials: "include",
                  });
                  toast({
                    title: "E-Mail gesendet",
                    description: "Bitte überprüfen Sie Ihr Postfach.",
                  });
                } catch (err) {
                  toast({
                    title: "Fehler",
                    description: "E-Mail konnte nicht gesendet werden.",
                    variant: "destructive",
                  });
                }
              }}
            >
              E-Mail erneut senden
            </ToastAction>
          ),
        });
      } else {
        toast({
          title: "Anmeldung fehlgeschlagen",
          description: error.message || "Bitte überprüfen Sie Ihre Zugangsdaten.",
          variant: "destructive",
        });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      setAuthModalOpen(false);
      toast({
        title: "Registrierung erfolgreich!",
        description: "Bitte bestätigen Sie Ihre E-Mail-Adresse. Wir haben Ihnen eine Bestätigungs-E-Mail gesendet.",
      });
    },
    onError: (error: any) => {
      let userMessage = "Ein Fehler ist aufgetreten.";
      
      if (error.message?.includes("bereits registriert")) {
        userMessage = "Diese E-Mail-Adresse wird bereits verwendet. Bitte melden Sie sich an oder verwenden Sie eine andere E-Mail-Adresse.";
      } else if (error.message) {
        userMessage = error.message;
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Fehler beim Senden der E-Mail");
      
      toast({
        title: "E-Mail gesendet",
        description: "Wenn ein Account mit dieser E-Mail-Adresse existiert, erhalten Sie eine E-Mail zum Zurücksetzen Ihres Passworts.",
      });
      setForgotPasswordOpen(false);
      setForgotPasswordEmail("");
    } catch (error) {
      toast({
        title: "Fehler",
        description: "E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-6 py-4 md:py-5 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" data-testid="link-home">
            <div className="hover-elevate active-elevate-2 px-3 py-2 rounded-lg transition-all cursor-pointer">
              <img 
                src={logoImage} 
                alt="MeineDokBox Logo" 
                className="h-12 md:h-14 lg:h-16 w-auto" 
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  size="default"
                  className="text-base font-medium px-5"
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="default"
              className="text-base font-medium px-5"
              data-testid="button-header-login"
              onClick={() => {
                setAuthTab("login");
                setAuthModalOpen(true);
              }}
            >
              Anmelden
            </Button>
            <Button 
              size="default"
              className="text-base font-semibold px-6 shadow-lg hover:shadow-xl transition-shadow"
              data-testid="button-header-cta"
              onClick={() => {
                setAuthTab("signup");
                setAuthModalOpen(true);
              }}
            >
              Kostenlos testen
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
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
              <SheetContent side="right" className="w-[320px]">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-xl">Navigation</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-3">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive(item.href) ? "secondary" : "ghost"}
                        className="w-full justify-start text-base font-medium h-12"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid={`nav-mobile-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                  
                  <div className="pt-6 border-t mt-4 space-y-3">
                    <Button 
                      variant="outline"
                      className="w-full text-base font-medium h-12" 
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
                      className="w-full text-base font-semibold h-12" 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setAuthTab("signup");
                        setAuthModalOpen(true);
                      }}
                      data-testid="button-mobile-cta"
                    >
                      Kostenlos testen
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

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
                            data-testid="checkbox-accept-privacy"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            Ich akzeptiere die{" "}
                            <Link href="/datenschutz">
                              <span className="text-primary hover:underline">
                                Datenschutzbestimmungen
                              </span>
                            </Link>
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
                    {registerMutation.isPending ? "Registrieren..." : "Account erstellen"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Passwort zurücksetzen</DialogTitle>
            <DialogDescription>
              Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen Ihres Passworts zu erhalten.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="ihre@email.de"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                data-testid="input-forgot-password-email"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotPasswordOpen(false)}
                data-testid="button-forgot-password-cancel"
              >
                Abbrechen
              </Button>
              <Button type="submit" data-testid="button-forgot-password-submit">
                Link senden
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
