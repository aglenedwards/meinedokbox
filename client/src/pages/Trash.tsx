import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, RotateCcw, X } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "wouter";
import type { Document } from "@shared/schema";
import { getTrashedDocuments, restoreDocument, permanentlyDeleteDocument } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export default function Trash() {
  const { toast } = useToast();

  // Fetch trashed documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/trash"],
    queryFn: getTrashedDocuments,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: restoreDocument,
    onSuccess: (restored) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trash"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Dokument wiederhergestellt",
        description: `"${restored.title}" wurde wiederhergestellt.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Wiederherstellen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Permanent delete mutation
  const deleteMutation = useMutation({
    mutationFn: permanentlyDeleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trash"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/stats"] });
      toast({
        title: "Dokument endgültig gelöscht",
        description: "Das Dokument wurde endgültig gelöscht.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Löschen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRestore = (id: string) => {
    restoreMutation.mutate(id);
  };

  const handlePermanentDelete = (id: string) => {
    if (window.confirm("Möchten Sie dieses Dokument wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <img 
                  src={logoImage} 
                  alt="MeineDokBox" 
                  className="h-12 md:h-16 dark:invert dark:brightness-0 dark:contrast-200 cursor-pointer" 
                  data-testid="img-logo" 
                />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Papierkorb</h1>
                <p className="text-sm text-muted-foreground">Gelöschte Dokumente</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-back-to-dashboard">
                  <X className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Papierkorb wird geladen...</p>
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            title="Papierkorb ist leer"
            description="Es befinden sich keine gelöschten Dokumente im Papierkorb."
          />
        ) : (
          <div className="space-y-4">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {documents.length} Dokument{documents.length !== 1 ? "e" : ""} im Papierkorb
              </p>
            </div>
            
            <div className="grid gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover-elevate active-elevate-2">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                          <span className="px-2 py-1 bg-muted rounded">
                            {doc.category}
                          </span>
                          <span>
                            Hochgeladen: {format(new Date(doc.uploadedAt), "d. MMM yyyy", { locale: de })}
                          </span>
                          {doc.deletedAt && (
                            <span>
                              Gelöscht: {format(new Date(doc.deletedAt), "d. MMM yyyy", { locale: de })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(doc.id)}
                          disabled={restoreMutation.isPending}
                          data-testid={`button-restore-${doc.id}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Wiederherstellen
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handlePermanentDelete(doc.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-permanent-delete-${doc.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Endgültig löschen
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {doc.extractedText && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {doc.extractedText}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
