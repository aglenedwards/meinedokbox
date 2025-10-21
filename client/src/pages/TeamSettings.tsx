import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UserPlus, Trash2, Crown, User, Mail, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AccountMember {
  id: string;
  userId: string;
  role: string;
  canUpload: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface PendingInvite {
  id: string;
  email: string;
  status: string;
  createdAt: string;
}

interface AccountDetails {
  id: string;
  name: string | null;
  baseSeats: number;
  totalSeats: number;
  usedSeats: number;
  availableSeats: number;
  members: AccountMember[];
  pendingInvites: PendingInvite[];
}

export default function TeamSettings() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");

  // Fetch account details
  const { data: account, isLoading } = useQuery<AccountDetails>({
    queryKey: ["/api/account"],
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("/api/account/invites", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Einladung versendet",
        description: "Die Einladung wurde erfolgreich per E-Mail versendet.",
      });
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return await apiRequest(`/api/account/members/${memberId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Mitglied entfernt",
        description: "Das Mitglied wurde erfolgreich entfernt.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail && inviteEmail.includes("@")) {
      inviteMutation.mutate(inviteEmail);
    }
  };

  const getInitials = (member: AccountMember) => {
    if (member.firstName && member.lastName) {
      return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
    }
    if (member.email) {
      return member.email[0].toUpperCase();
    }
    return "?";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Account nicht gefunden</p>
      </div>
    );
  }

  const isOwner = account.members.some(m => m.role === "owner");

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team-Verwaltung</h1>
        <p className="text-muted-foreground mt-2">
          Verwalten Sie die Mitglieder Ihres Teams und deren Zugriffsrechte.
        </p>
      </div>

      {/* Seats Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Platz-Übersicht</CardTitle>
          <CardDescription>
            {account.usedSeats} von {account.totalSeats} Plätzen belegt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Basis-Plätze (Plan)</span>
              <span className="font-medium">{account.baseSeats}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Genutzte Plätze</span>
              <span className="font-medium">{account.usedSeats}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Verfügbare Plätze</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {account.availableSeats}
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(account.usedSeats / account.totalSeats) * 100}%` }}
            />
          </div>

          {account.availableSeats === 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-4">
              Keine freien Plätze mehr. Upgraden Sie für +2,50€/Monat pro zusätzlichem Platz.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Invite new member */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Mitglied einladen</CardTitle>
            <CardDescription>
              Laden Sie jemanden ein, Teil Ihres Teams zu werden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="invite-email" className="sr-only">
                  E-Mail-Adresse
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="partner@beispiel.de"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviteMutation.isPending || account.availableSeats === 0}
                  data-testid="input-invite-email"
                />
              </div>
              <Button
                type="submit"
                disabled={
                  inviteMutation.isPending ||
                  !inviteEmail ||
                  account.availableSeats === 0
                }
                data-testid="button-send-invite"
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Einladen
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending invites */}
      {isOwner && account.pendingInvites && account.pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ausstehende Einladungen</CardTitle>
            <CardDescription>
              {account.pendingInvites.length} Einladung(en) noch nicht angenommen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {account.pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`invite-pending-${invite.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Eingeladen am {new Date(invite.createdAt).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-amber-600 dark:text-amber-400">
                    Ausstehend
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team members */}
      <Card>
        <CardHeader>
          <CardTitle>Team-Mitglieder</CardTitle>
          <CardDescription>
            {account.members.length} Mitglied(er) in diesem Team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {account.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg"
                data-testid={`member-${member.id}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.profileImageUrl} />
                    <AvatarFallback>{getInitials(member)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {member.firstName && member.lastName
                          ? `${member.firstName} ${member.lastName}`
                          : member.email}
                      </p>
                      {member.role === "owner" && (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground capitalize">
                    {member.role === "owner" ? "Inhaber" : "Mitglied"}
                  </span>

                  {isOwner && member.role !== "owner" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          data-testid={`button-remove-member-${member.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Mitglied entfernen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Möchten Sie {member.email} wirklich aus dem Team entfernen? 
                            Diese Aktion kann nicht rückgängig gemacht werden.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeMutation.mutate(member.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Entfernen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
