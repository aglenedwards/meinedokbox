import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff, ArrowLeft, FileText, Fingerprint } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { login, register, type LoginData, type RegisterData } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import logoImage from "@assets/doklify_logo_transparent.png";

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

function PasswordInput({
  placeholder,
  autoComplete,
  testId,
  field,
}: {
  placeholder: string;
  autoComplete: string;
  testId: string;
  field: any;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        data-testid={testId}
        className="pr-10"
        {...field}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(s => !s)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
        data-testid={`${testId}-toggle`}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

type Screen = "login" | "register" | "forgot";

export function PWALoginScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [screen, setScreen] = useState<Screen>("login");
  const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);
  const [webAuthnEmail, setWebAuthnEmail] = useState<string | null>(null);
  const [webAuthnPending, setWebAuthnPending] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const { browserSupportsWebAuthn } = await import('@simplewebauthn/browser');
        const supported = browserSupportsWebAuthn();
        const storedEmail = localStorage.getItem('webauthn_email');
        const registered = localStorage.getItem('webauthn_registered') === 'true';
        if (supported && registered && storedEmail) {
          setWebAuthnAvailable(true);
          setWebAuthnEmail(storedEmail);
        }
      } catch {
        // WebAuthn not supported
      }
    };
    check();
  }, []);

  const handleFaceIDLogin = async () => {
    if (!webAuthnEmail) return;
    setWebAuthnPending(true);
    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const startRes = await fetch('/api/auth/webauthn/login/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: webAuthnEmail }),
      });
      if (!startRes.ok) {
        const err = await startRes.json();
        throw new Error(err.message || 'Fehler beim Starten');
      }
      const options = await startRes.json();
      const assertionResponse = await startAuthentication({ optionsJSON: options });
      const verifyRes = await fetch('/api/auth/webauthn/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(assertionResponse),
      });
      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.message || 'Verifizierung fehlgeschlagen');
      }
      await queryClient.refetchQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: 'Willkommen zurück!', description: 'Biometrische Anmeldung erfolgreich.' });
      setLocation('/dashboard');
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError') {
        toast({
          title: 'Face ID fehlgeschlagen',
          description: err.message || 'Bitte melden Sie sich mit E-Mail und Passwort an.',
          variant: 'destructive',
        });
      }
    } finally {
      setWebAuthnPending(false);
    }
  };

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

  const [forgotEmail, setForgotEmail] = useState("");

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Willkommen zurück!", description: "Sie wurden erfolgreich angemeldet." });
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
                  toast({ title: "E-Mail gesendet", description: "Bitte überprüfen Sie Ihr Postfach." });
                } catch {
                  toast({ title: "Fehler", description: "E-Mail konnte nicht gesendet werden.", variant: "destructive" });
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
      setScreen("login");
      registerForm.reset();
    },
    onError: (error: any) => {
      let msg = "Ein Fehler ist aufgetreten.";
      if (error.message?.includes("bereits registriert")) {
        msg = "Diese E-Mail-Adresse wird bereits verwendet.";
      } else if (error.message) {
        msg = error.message;
      }
      toast({ title: "Registrierung fehlgeschlagen", description: msg, variant: "destructive" });
    },
  });

  const onLogin = (data: LoginData) => loginMutation.mutate(data);

  const onRegister = (data: RegisterData) => {
    const p = new URLSearchParams(window.location.search);
    registerMutation.mutate({
      ...data,
      utmSource: p.get('utm_source') || undefined,
      utmMedium: p.get('utm_medium') || undefined,
      utmCampaign: p.get('utm_campaign') || undefined,
    });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      toast({
        title: "E-Mail gesendet",
        description: "Falls ein Konto existiert, erhalten Sie einen Link zum Zurücksetzen.",
      });
      setScreen("login");
      setForgotEmail("");
    } catch {
      toast({ title: "Fehler", description: "Bitte versuchen Sie es später erneut.", variant: "destructive" });
    }
  };

  return (
    <div
      className="flex flex-col bg-background"
      style={{ position: "fixed", inset: 0, overflow: "hidden" }}
    >
      {/* Top brand area */}
      <div
        className="flex-none flex flex-col items-center justify-end pb-6 px-6"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)",
          background: "linear-gradient(160deg, hsl(var(--primary) / 0.08) 0%, transparent 100%)",
          minHeight: "220px",
        }}
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <img src={logoImage} alt="Doklify" className="h-10 mb-1" data-testid="img-pwa-logo" />
        <p className="text-sm text-muted-foreground">Ihr digitales Dokumentenarchiv</p>
      </div>

      {/* Form area – scrollable internally */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {screen === "forgot" && (
          <div className="max-w-sm mx-auto">
            <button
              className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
              onClick={() => setScreen("login")}
              data-testid="button-forgot-back-pwa"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Anmeldung
            </button>
            <h2 className="text-xl font-semibold mb-1">Passwort zurücksetzen</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Geben Sie Ihre E-Mail-Adresse ein – wir senden Ihnen einen Link.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                type="email"
                placeholder="ihre@email.de"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
                data-testid="input-forgot-email-pwa"
              />
              <Button type="submit" className="w-full" data-testid="button-forgot-submit-pwa">
                Link senden
              </Button>
            </form>
          </div>
        )}

        {screen === "login" && (
          <div className="max-w-sm mx-auto">
            <h2 className="text-2xl font-semibold mb-1">Willkommen zurück</h2>
            <p className="text-sm text-muted-foreground mb-6">Melden Sie sich an, um fortzufahren.</p>

            {webAuthnAvailable && (
              <div className="mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-3 py-6 text-base"
                  onClick={handleFaceIDLogin}
                  disabled={webAuthnPending}
                  data-testid="button-pwa-faceid-login"
                >
                  <Fingerprint className="h-6 w-6 text-primary" />
                  {webAuthnPending ? "Warte auf Bestätigung..." : "Mit Face ID / Fingerabdruck anmelden"}
                </Button>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-3 text-muted-foreground">oder mit E-Mail anmelden</span>
                  </div>
                </div>
              </div>
            )}

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
                        <PasswordInput
                          placeholder="Ihr Passwort"
                          autoComplete="current-password"
                          testId="input-pwa-login-password"
                          field={field}
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
                  data-testid="button-pwa-login-submit"
                >
                  {loginMutation.isPending ? "Anmelden..." : "Anmelden"}
                </Button>
              </form>
            </Form>

            <button
              type="button"
              className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setScreen("forgot")}
              data-testid="button-pwa-forgot-password"
            >
              Passwort vergessen?
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">Noch kein Konto?</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setScreen("register")}
              data-testid="button-pwa-goto-register"
            >
              Kostenlos registrieren
            </Button>
          </div>
        )}

        {screen === "register" && (
          <div className="max-w-sm mx-auto">
            <button
              className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
              onClick={() => setScreen("login")}
              data-testid="button-register-back-pwa"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Anmeldung
            </button>
            <h2 className="text-2xl font-semibold mb-1">Konto erstellen</h2>
            <p className="text-sm text-muted-foreground mb-6">7 Tage kostenlos – keine Kreditkarte nötig.</p>

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
                          <Input placeholder="Max" autoComplete="given-name" data-testid="input-pwa-register-firstname" {...field} />
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
                          <Input placeholder="Mustermann" autoComplete="family-name" data-testid="input-pwa-register-lastname" {...field} />
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
                        <Input type="email" placeholder="ihre@email.de" autoComplete="email" data-testid="input-pwa-register-email" {...field} />
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
                        <PasswordInput
                          placeholder="Mind. 8 Zeichen"
                          autoComplete="new-password"
                          testId="input-pwa-register-password"
                          field={field}
                        />
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
                        <PasswordInput
                          placeholder="Passwort bestätigen"
                          autoComplete="new-password"
                          testId="input-pwa-register-password-confirm"
                          field={field}
                        />
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
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-pwa-accept-privacy" />
                      </FormControl>
                      <div className="leading-none pt-0.5">
                        <FormLabel className="text-sm font-normal leading-relaxed">
                          Ich akzeptiere die{" "}
                          <a href="/datenschutz" className="text-primary underline underline-offset-2" target="_blank">
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
                  {registerMutation.isPending ? "Registrieren..." : "Konto erstellen"}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex-none py-4 px-6 text-center"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <p className="text-xs text-muted-foreground">
          <a href="/datenschutz" className="hover:underline">Datenschutz</a>
          {" · "}
          <a href="/impressum" className="hover:underline">Impressum</a>
        </p>
      </div>
    </div>
  );
}
