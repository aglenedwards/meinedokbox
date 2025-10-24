import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import logoImage from "@assets/meinedokbox_1760966015056.png";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
    .regex(passwordRegex, "Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben, eine Zahl und ein Sonderzeichen enthalten"),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwörter stimmen nicht überein",
  path: ["passwordConfirm"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      passwordConfirm: "",
    },
  });

  // Extract token from URL and validate
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (!tokenParam) {
      setValidating(false);
      setErrorMessage("Kein Reset-Token gefunden. Bitte verwenden Sie den Link aus der E-Mail.");
      return;
    }

    setToken(tokenParam);

    // Validate token with backend
    fetch(`/api/auth/validate-reset-token?token=${tokenParam}`, {
      credentials: "include",
    })
      .then(async (res) => {
        const data = await res.json();
        
        if (res.ok && data.valid) {
          setTokenValid(true);
        } else {
          setErrorMessage(data.message || "Ungültiger oder abgelaufener Reset-Link");
        }
      })
      .catch(() => {
        setErrorMessage("Fehler beim Validieren des Reset-Links");
      })
      .finally(() => {
        setValidating(false);
      });
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsResetting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
          passwordConfirm: data.passwordConfirm,
        }),
        credentials: "include",
      });

      const result = await res.json();

      if (res.ok) {
        setResetSuccess(true);
        toast({
          title: "Passwort zurückgesetzt",
          description: result.message,
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        toast({
          title: "Fehler",
          description: result.message || "Passwort konnte nicht zurückgesetzt werden",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Passwort konnte nicht zurückgesetzt werden",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <img src={logoImage} alt="MeineDokBox" className="h-12 md:h-16 w-auto" data-testid="img-logo" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            data-testid="button-back-to-home"
          >
            Zurück zur Startseite
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Passwort zurücksetzen</CardTitle>
            <CardDescription>
              Geben Sie Ihr neues Passwort ein
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Validating State */}
            {validating && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Reset-Link wird überprüft...</p>
              </div>
            )}

            {/* Error State */}
            {!validating && !tokenValid && (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <p className="text-lg font-semibold mb-2">Ungültiger Link</p>
                <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
                <Button onClick={() => navigate("/")} data-testid="button-go-home">
                  Zur Startseite
                </Button>
              </div>
            )}

            {/* Success State */}
            {resetSuccess && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-semibold mb-2">Passwort erfolgreich zurückgesetzt!</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Sie werden in Kürze zur Login-Seite weitergeleitet...
                </p>
              </div>
            )}

            {/* Reset Form */}
            {!validating && tokenValid && !resetSuccess && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Neues Passwort</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Min. 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen"
                              data-testid="input-new-password"
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passwordConfirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passwort bestätigen</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPasswordConfirm ? "text" : "password"}
                              placeholder="Passwort wiederholen"
                              data-testid="input-confirm-password"
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                              data-testid="button-toggle-confirm-password"
                            >
                              {showPasswordConfirm ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
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
                    disabled={isResetting}
                    data-testid="button-reset-password-submit"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Passwort wird zurückgesetzt...
                      </>
                    ) : (
                      "Passwort zurücksetzen"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
