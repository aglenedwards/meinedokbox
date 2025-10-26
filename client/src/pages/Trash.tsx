import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { Document } from "@shared/schema";
import { getTrashedDocuments, restoreDocument, permanentlyDeleteDocument, permanentlyDeleteAllDocuments } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { DashboardLayout } from "@/components/DashboardLayout";
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
        description: "Das Dokument konnte nicht wiederhergestellt werden. Bitte versuchen Sie es erneut.",
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
        description: "Das Dokument konnte nicht endgültig gelöscht werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  // Bulk delete all mutation
  const deleteAllMutation = useMutation({
    mutationFn: permanentlyDeleteAllDocuments,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trash"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/stats"] });
      toast({
        title: "Alle Dokumente gelöscht",
        description: `${data.count} Dokument${data.count !== 1 ? "e" : ""} wurde${data.count !== 1 ? "n" : ""} endgültig gelöscht.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Löschen",
        description: "Die Dokumente konnten nicht gelöscht werden. Bitte versuchen Sie es erneut.",
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

  const handleDeleteAll = () => {
    deleteAllMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Trash2 className="h-6 w-6" />
          Papierkorb
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gelöschte Dokumente</p>
      </div>

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
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-muted-foreground" data-testid="text-trash-count">
                {documents.length} Dokument{documents.length !== 1 ? "e" : ""} im Papierkorb
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={deleteAllMutation.isPending}
                    data-testid="button-delete-all"
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Alle endgültig löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Alle Dokumente endgültig löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Sie sind dabei, <strong>{documents.length} Dokument{documents.length !== 1 ? "e" : ""}</strong> endgültig zu löschen. 
                      Diese Aktion kann nicht rückgängig gemacht werden. Die Dokumente werden unwiderruflich aus dem System entfernt.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-delete-all">Abbrechen</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-testid="button-confirm-delete-all"
                    >
                      Alle löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <div className="grid gap-3 sm:gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover-elevate active-elevate-2 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 min-w-0">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg break-words line-clamp-2">{doc.title}</CardTitle>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 text-xs sm:text-sm text-muted-foreground">
                          <span className="px-2 py-0.5 sm:py-1 bg-muted rounded text-xs shrink-0">
                            {doc.category}
                          </span>
                          <span className="hidden sm:inline shrink-0">
                            Hochgeladen: {format(new Date(doc.uploadedAt), "d. MMM yyyy", { locale: de })}
                          </span>
                          <span className="sm:hidden shrink-0">
                            {format(new Date(doc.uploadedAt), "d. MMM yy", { locale: de })}
                          </span>
                          {doc.deletedAt && (
                            <>
                              <span className="hidden sm:inline shrink-0">
                                Gelöscht: {format(new Date(doc.deletedAt), "d. MMM yyyy", { locale: de })}
                              </span>
                              <span className="sm:hidden shrink-0">
                                Gelöscht: {format(new Date(doc.deletedAt), "d. MMM yy", { locale: de })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(doc.id)}
                          disabled={restoreMutation.isPending}
                          data-testid={`button-restore-${doc.id}`}
                          className="w-full sm:w-auto shrink-0"
                        >
                          <RotateCcw className="h-4 w-4 mr-2 shrink-0" />
                          <span className="truncate">Wiederherstellen</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handlePermanentDelete(doc.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-permanent-delete-${doc.id}`}
                          className="w-full sm:w-auto shrink-0"
                        >
                          <Trash2 className="h-4 w-4 mr-2 shrink-0" />
                          <span className="truncate">Endgültig löschen</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {doc.extractedText && (
                    <CardContent className="pt-0 min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words">
                        {doc.extractedText}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
      )}
    </DashboardLayout>
  );
}
