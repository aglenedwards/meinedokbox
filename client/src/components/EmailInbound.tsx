import { useState } from "react";
import { Mail, Copy, Check, Info, RefreshCw, Shield, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import type { User } from "@shared/schema";

interface EmailInboundProps {
  user: User;
}

export function EmailInbound({ user }: EmailInboundProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const regenerateEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/regenerate-email');
      return await response.json();
    },
    onSuccess: (data: { inboundEmail: string }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "E-Mail-Adresse aktualisiert",
        description: `Ihre neue Adresse: ${data.inboundEmail}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: "Die E-Mail-Adresse konnte nicht aktualisiert werden. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
    },
  });

  const handleCopy = async () => {
    if (!user.inboundEmail) return;

    try {
      await navigator.clipboard.writeText(user.inboundEmail);
      setCopied(true);
      toast({
        title: "E-Mail-Adresse kopiert",
        description: "Die Adresse wurde in die Zwischenablage kopiert.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die E-Mail-Adresse konnte nicht kopiert werden.",
        variant: "destructive",
      });
    }
  };

  if (!user.inboundEmail) {
    return null;
  }

  return (
    <Card data-testid="card-email-inbound">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary shrink-0" />
          <CardTitle className="text-base sm:text-lg">Dokumente per E-Mail senden</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Leiten Sie E-Mails mit Anhängen an Ihre persönliche Adresse weiter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Ihre persönliche E-Mail-Adresse:
          </label>
          <div className="flex gap-2">
            <div 
              className="flex-1 min-w-0 px-3 py-2 bg-muted rounded-md font-mono text-xs sm:text-sm break-all overflow-wrap-anywhere"
              data-testid="text-inbound-email"
            >
              {user.inboundEmail}
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={handleCopy}
              data-testid="button-copy-email"
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
              <p className="font-medium">So funktioniert's:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>Leiten Sie E-Mails mit PDF- oder Bild-Anhängen an diese Adresse weiter</li>
                <li>Anhänge werden automatisch erkannt und kategorisiert</li>
                <li>Dokumente erscheinen sofort in Ihrer Übersicht</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Whitelist Security Reminder */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-900 dark:text-amber-100 space-y-2">
              <p className="font-medium">Sicherheitshinweis: E-Mail Whitelist</p>
              <p className="text-amber-800 dark:text-amber-200">
                Nur E-Mails von erlaubten Absendern werden akzeptiert. Verwalten Sie Ihre Whitelist in den Einstellungen.
              </p>
              <Link href="/settings">
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 bg-white dark:bg-gray-800"
                  data-testid="link-whitelist-settings"
                >
                  <Settings className="h-3 w-3 mr-1.5" />
                  Whitelist verwalten
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {user.emailWhitelist && user.emailWhitelist.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Erlaubte Absender:
            </p>
            <div className="flex flex-wrap gap-2">
              {user.emailWhitelist.map((email, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-mono"
                  data-testid={`badge-whitelist-${index}`}
                >
                  {email}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
