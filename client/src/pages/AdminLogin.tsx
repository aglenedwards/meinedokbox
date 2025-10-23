import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Shield, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Fehler bei der Authentifizierung");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Authentifizierung erfolgreich",
        description: "Sie werden zum Admin-Bereich weitergeleitet...",
      });
      setTimeout(() => {
        setLocation("/admin");
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Authentifizierung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie das Admin-Passwort ein.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(password);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logoImage} alt="MeineDokBox" className="h-20" data-testid="img-logo" />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Admin-Bereich</CardTitle>
            <CardDescription className="text-center">
              Zusätzliche Authentifizierung erforderlich
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password">Admin-Passwort</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Geben Sie Ihr Admin-Passwort ein"
                    className="pl-9"
                    disabled={loginMutation.isPending}
                    data-testid="input-admin-password"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-submit-admin-login"
              >
                {loginMutation.isPending ? "Authentifiziere..." : "Anmelden"}
              </Button>

              <div className="text-center text-sm text-muted-foreground mt-4">
                Sie sind bereits als <strong>service@meinedokbox.de</strong> angemeldet.
                <br />
                Geben Sie Ihr Admin-Passwort ein, um fortzufahren.
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/")}
                data-testid="button-back-to-dashboard"
              >
                Zurück zum Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
