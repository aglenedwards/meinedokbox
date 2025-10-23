import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, Mail, Plus, Trash2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { EmailWhitelist } from "@shared/schema";

export function EmailWhitelistSettings() {
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState("");

  // Fetch whitelist
  const { data: whitelist = [], isLoading } = useQuery<EmailWhitelist[]>({
    queryKey: ["/api/email-whitelist"],
  });

  // Add email mutation
  const addMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/email-whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Fehler beim Hinzufügen");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-whitelist"] });
      setNewEmail("");
      toast({
        title: "E-Mail hinzugefügt",
        description: "Die E-Mail-Adresse wurde zur Whitelist hinzugefügt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove email mutation
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/email-whitelist/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Fehler beim Entfernen");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-whitelist"] });
      toast({
        title: "E-Mail entfernt",
        description: "Die E-Mail-Adresse wurde aus der Whitelist entfernt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    addMutation.mutate(newEmail.trim());
  };

  return (
    <Card data-testid="card-email-whitelist">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>E-Mail Whitelist</CardTitle>
        </div>
        <CardDescription>
          Nur E-Mails von diesen Adressen werden akzeptiert und als Dokumente gespeichert
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Info */}
        <div className="flex gap-2 p-3 bg-muted/50 rounded-md">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <strong>Wichtiger Sicherheitshinweis:</strong> Nur E-Mails von Adressen in dieser Liste können Dokumente an Ihre persönliche Adresse senden. Dies verhindert, dass unbefugte Personen Zugriff auf Ihre Dokumente erhalten.
          </div>
        </div>

        {/* Add Email Form */}
        <form onSubmit={handleAddEmail} className="flex gap-2">
          <div className="flex-1">
            <Input
              type="email"
              placeholder="name@beispiel.de"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={addMutation.isPending}
              data-testid="input-new-email"
            />
          </div>
          <Button
            type="submit"
            disabled={addMutation.isPending || !newEmail.trim()}
            data-testid="button-add-email"
          >
            <Plus className="h-4 w-4 mr-1" />
            Hinzufügen
          </Button>
        </form>

        {/* Whitelist Entries */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Erlaubte Absender ({whitelist.length})</Label>
          
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Lädt...</div>
          ) : whitelist.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 text-center border rounded-md">
              Keine E-Mail-Adressen in der Whitelist. Fügen Sie eine hinzu, um Dokumente per E-Mail zu empfangen.
            </div>
          ) : (
            <div className="space-y-2">
              {whitelist.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                  data-testid={`whitelist-entry-${entry.id}`}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono">{entry.allowedEmail}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMutation.mutate(entry.id)}
                    disabled={removeMutation.isPending}
                    data-testid={`button-remove-${entry.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
