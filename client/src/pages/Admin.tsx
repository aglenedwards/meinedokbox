import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User, Trash2, Search, Home, LogOut, Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import logoImage from "@assets/meinedokbox_1760966015056.png";
import type { User as UserType } from "@shared/schema";

interface UserWithStats extends UserType {
  documentCount: number;
  storageUsed: number;
}

export default function Admin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: UserWithStats | null }>({
    open: false,
    user: null,
  });

  // Check admin authentication status
  const { data: adminStatus, isLoading: checkingAuth } = useQuery<{
    isAdminEmail: boolean;
    isAdminAuthenticated: boolean;
    requiresLogin: boolean;
  }>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  // Redirect to admin login if not authenticated
  useEffect(() => {
    if (!checkingAuth && adminStatus?.requiresLogin) {
      setLocation("/admin/login");
    }
  }, [adminStatus, checkingAuth, setLocation]);

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<UserWithStats[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
    enabled: adminStatus?.isAdminAuthenticated === true,
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Fehler beim Löschen des Users");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeleteDialog({ open: false, user: null });
      toast({
        title: "User gelöscht",
        description: "Der User wurde erfolgreich entfernt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: "Der Benutzer konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query)
    );
  });

  const getPlanBadgeVariant = (plan: string) => {
    if (plan === "premium") return "default";
    if (plan === "trial") return "secondary";
    return "outline";
  };

  const handleDeleteClick = (user: UserWithStats) => {
    setDeleteDialog({ open: true, user });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.user) {
      deleteMutation.mutate(deleteDialog.user.id);
    }
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Authentifizierung wird überprüft...</p>
      </div>
    );
  }

  // Don't render if user needs to login (will redirect)
  if (adminStatus?.requiresLogin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logoImage} alt="MeineDokBox" className="h-12 md:h-16" data-testid="img-logo" />
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="text-xl md:text-2xl font-bold">Admin-Bereich</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Benutzerverwaltung
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suche nach Name, E-Mail oder ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-users"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Lädt Benutzer...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "Keine Benutzer gefunden" : "Keine Benutzer vorhanden"}
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Dokumente</TableHead>
                      <TableHead className="text-right">Speicher</TableHead>
                      <TableHead>Registriert</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono text-sm">{user.email}</span>
                            {!user.isVerified && (
                              <Badge variant="outline" className="w-fit mt-1 text-xs">
                                Unverifiziert
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPlanBadgeVariant(user.subscriptionPlan || "free")}>
                            {user.subscriptionPlan === "premium"
                              ? "Premium"
                              : user.subscriptionPlan === "trial"
                              ? "Trial"
                              : "Free"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{user.documentCount}</TableCell>
                        <TableCell className="text-right">{user.storageUsed.toFixed(2)} MB</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.createdAt ? format(new Date(user.createdAt), "dd.MM.yyyy", { locale: de }) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
                            data-testid={`button-delete-${user.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-4 text-sm text-muted-foreground">
              Gesamt: {filteredUsers.length} {filteredUsers.length === 1 ? "Benutzer" : "Benutzer"}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Benutzer löschen?
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Möchten Sie den Benutzer <strong>{deleteDialog.user?.email}</strong> wirklich löschen?
              </p>
              <p className="text-destructive font-medium">
                Diese Aktion löscht unwiderruflich:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Den Benutzer-Account</li>
                <li>Alle Dokumente ({deleteDialog.user?.documentCount} Dokumente)</li>
                <li>Alle E-Mail-Whitelist-Einträge</li>
                <li>Alle Ordner und Einstellungen</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, user: null })}
              disabled={deleteMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Wird gelöscht..." : "Ja, löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
