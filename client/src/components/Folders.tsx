import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Folder as FolderIcon, Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DocumentCard } from "./DocumentCard";
import type { Document } from "@shared/schema";

interface Folder {
  id: string;
  name: string;
  icon: string;
  isShared: boolean;
  userId: string;
  createdAt: string;
  documentCount: number;
}

export function Folders() {
  const { toast } = useToast();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");

  // Fetch all folders
  const { data: folders = [], isLoading: isLoadingFolders } = useQuery<Folder[]>({
    queryKey: ['/api/folders'],
  });

  // Fetch documents for selected folder
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ['/api/folders', selectedFolder, 'documents'],
    enabled: !!selectedFolder,
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string }) => {
      const res = await apiRequest('POST', '/api/folders', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      setCreateDialogOpen(false);
      setNewFolderName("");
      setNewFolderIcon("📁");
      toast({
        title: "Erfolg",
        description: "Ordner erstellt",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Ordner konnte nicht erstellt werden",
      });
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const res = await apiRequest('DELETE', `/api/folders/${folderId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setSelectedFolder(null);
      toast({
        title: "Erfolg",
        description: "Ordner gelöscht",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Ordner konnte nicht gelöscht werden",
      });
    },
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate({
        name: newFolderName.trim(),
        icon: newFolderIcon,
      });
    }
  };


  if (isLoadingFolders) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Lädt Ordner...</div>
      </div>
    );
  }

  // If no folder is selected, show folder list
  if (!selectedFolder) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Meine Ordner</h2>
            <p className="text-muted-foreground">Organisieren Sie Ihre Dokumente in Ordnern</p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            data-testid="button-create-folder"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Ordner
          </Button>
        </div>

        {folders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Noch keine Ordner</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Erstellen Sie Ihren ersten Ordner, um Dokumente zu organisieren
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Ordner erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => {
              return (
                <Card
                  key={folder.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setSelectedFolder(folder.id)}
                  data-testid={`card-folder-${folder.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{folder.icon}</div>
                        <div>
                          <CardTitle className="text-lg">{folder.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {folder.documentCount} {folder.documentCount === 1 ? 'Dokument' : 'Dokumente'}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFolderMutation.mutate(folder.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Folder Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Ordner erstellen</DialogTitle>
              <DialogDescription>
                Geben Sie einen Namen und ein Icon für den neuen Ordner an
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ordnername</label>
                <Input
                  placeholder="z.B. Wichtig, Archiv, 2024..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  data-testid="input-folder-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Icon (Emoji)</label>
                <Input
                  placeholder="📁"
                  value={newFolderIcon}
                  onChange={(e) => setNewFolderIcon(e.target.value)}
                  maxLength={2}
                  data-testid="input-folder-icon"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
                data-testid="button-confirm-create-folder"
              >
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Show documents in selected folder
  const selectedFolderData = folders.find(f => f.id === selectedFolder);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedFolder(null)}
          data-testid="button-back-to-folders"
        >
          ← Zurück zu Ordnern
        </Button>
        <div className="flex items-center gap-3">
          <div className="text-4xl">{selectedFolderData?.icon}</div>
          <div>
            <h2 className="text-2xl font-bold">{selectedFolderData?.name}</h2>
            <p className="text-muted-foreground">
              {documents.length} {documents.length === 1 ? 'Dokument' : 'Dokumente'}
            </p>
          </div>
        </div>
      </div>

      {isLoadingDocuments ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Lädt Dokumente...</div>
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Keine Dokumente in diesem Ordner</h3>
            <p className="text-sm text-muted-foreground">
              Verschieben Sie Dokumente in diesen Ordner, um sie hier anzuzeigen
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              id={doc.id}
              title={doc.title}
              category={doc.category}
              date={new Date(doc.uploadedAt).toLocaleDateString('de-DE')}
              thumbnailUrl={doc.thumbnailUrl || undefined}
              confidence={doc.confidence}
              extractedDate={doc.extractedDate ? new Date(doc.extractedDate).toISOString() : undefined}
              amount={doc.amount || undefined}
              sender={doc.sender || undefined}
              isShared={doc.isShared}
            />
          ))}
        </div>
      )}
    </div>
  );
}
