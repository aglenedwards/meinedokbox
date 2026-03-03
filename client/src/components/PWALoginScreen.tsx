import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { login, register, type LoginData, type RegisterData } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
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

export function PWALoginScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupPasswordConfirm, setShowSignupPasswordConfirm] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

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
      acceptPrivacy: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
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
                } catch {
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
      toast({
        title: "Registrierung erfolgreich!",
        description: "Bitte bestätigen Sie Ihre E-Mail-Adresse. Wir haben Ihnen eine Bestätigungs-E-Mail gesendet.",
      });
      setActiveTab("login");
      registerForm.reset();
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
    const urlParams = new URLSearchParams(window.location.search);
    registerMutation.mutate({
      ...data,
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined,
    });
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
      if (!res.ok) throw new Error("Fehler");
      toast({
        title: "E-Mail gesendet",
        description: "Wenn ein Account mit dieser E-Mail-Adresse existiert, erhalten Sie eine E-Mail zum Zurücksetzen Ihres Passworts.",
      });
      setForgotPasswordOpen(false);
      setForgotPasswordEmail("");
    } catch {
      toast({
        title: "Fehler",
        description: "E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
    }
  };

  if (forgotPasswordOpen) {
    return (
      <div className="min-h-screen bg-background flex flex-col pwa-safe-top">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <img src={logoImage} alt="MeineDokBox" className="h-16 mb-8" />
          <div className="w-full max-w-sm">
            <h2 className="text-xl font-semibold text-center mb-2">Passwort zurücksetzen</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                type="email"
                placeholder="ihre@email.de"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                data-testid="input-forgot-email-pwa"
              />
              <Button type="submit" className="w-full" data-testid="button-forgot-submit-pwa">
                Link senden
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setForgotPasswordOpen(false)}
                data-testid="button-forgot-back-pwa"
              >
                Zurück zur Anmeldung
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pwa-safe-top">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <img src={logoImage} alt="MeineDokBox" className="h-16 mb-8" data-testid="img-pwa-logo" />

        <div className="w-full max-w-sm">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
            <TabsList className="w-full mb-6" data-testid="tabs-pwa-auth">
              <TabsTrigger value="login" className="flex-1" data-testid="tab-pwa-login">
                Anmelden
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1" data-testid="tab-pwa-signup">
                Registrieren
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail-Adresse</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="ihre@email.de"
                            autoComplete="email"
                            data-testid="input-pwa-login-email"
                            {...field}
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
                          <div className="relative">
                            <Input
                              type={showLoginPassword ? "text" : "password"}
                              placeholder="Ihr Passwort"
                              autoComplete="current-password"
                              data-testid="input-pwa-login-password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              data-testid="button-pwa-toggle-login-password"
                            >
                              {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-pwa-login-submit"
                  >
                    {loginMutation.isPending ? "Anmelden..." : "Anmelden"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm text-muted-foreground"
                    onClick={() => setForgotPasswordOpen(true)}
                    data-testid="button-pwa-forgot-password"
                  >
                    Passwort vergessen?
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="signup">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vorname</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Max"
                              autoComplete="given-name"
                              data-testid="input-pwa-register-firstname"
                              {...field}
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
                          <FormLabel>Nachname</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Mustermann"
                              autoComplete="family-name"
                              data-testid="input-pwa-register-lastname"
                              {...field}
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
                        <FormLabel>E-Mail-Adresse</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="ihre@email.de"
                            autoComplete="email"
                            data-testid="input-pwa-register-email"
                            {...field}
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
                          <div className="relative">
                            <Input
                              type={showSignupPassword ? "text" : "password"}
                              placeholder="Sicheres Passwort"
                              autoComplete="new-password"
                              data-testid="input-pwa-register-password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setShowSignupPassword(!showSignupPassword)}
                              data-testid="button-pwa-toggle-register-password"
                            >
                              {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        <FormLabel>Passwort wiederholen</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showSignupPasswordConfirm ? "text" : "password"}
                              placeholder="Passwort bestätigen"
                              autoComplete="new-password"
                              data-testid="input-pwa-register-password-confirm"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setShowSignupPasswordConfirm(!showSignupPasswordConfirm)}
                              data-testid="button-pwa-toggle-register-password-confirm"
                            >
                              {showSignupPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                      <FormItem className="flex flex-row items-start gap-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-pwa-accept-privacy"
                          />
                        </FormControl>
                        <div className="leading-none">
                          <FormLabel className="text-sm font-normal leading-relaxed">
                            Ich akzeptiere die{" "}
                            <a href="/datenschutz" className="text-primary underline" target="_blank">
                              Datenschutzbestimmungen
                            </a>
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
                    data-testid="button-pwa-register-submit"
                  >
                    {registerMutation.isPending ? "Registrieren..." : "Kostenlos registrieren"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground text-center mt-6">
            7 Tage kostenlos testen – keine Kreditkarte nötig
          </p>
        </div>
      </div>

      <div className="pb-6 pwa-safe-bottom text-center">
        <p className="text-xs text-muted-foreground">
          <a href="/datenschutz" className="hover:underline">Datenschutz</a>
          {" · "}
          <a href="/impressum" className="hover:underline">Impressum</a>
        </p>
      </div>
    </div>
  );
}
