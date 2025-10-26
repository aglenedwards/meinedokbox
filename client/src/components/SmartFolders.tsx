import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FolderSearch, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { DocumentCard } from "@/components/DocumentCard";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import type { SmartFolder, Document } from "@shared/schema";

export function SmartFolders() {
  const { toast } = useToast();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [viewerDocument, setViewerDocument] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [yearDrawerOpen, setYearDrawerOpen] = useState(false);

  // Mobile detection (under 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: smartFolders = [], isLoading: foldersLoading } = useQuery<SmartFolder[]>({
    queryKey: ["/api/smart-folders"],
  });

  const selectedFolder = smartFolders.find(f => f.id === selectedFolderId);

  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/smart-folders", selectedFolderId, "documents", selectedYear],
    queryFn: async () => {
      if (!selectedFolderId) return [];
      const url = selectedYear 
        ? `/api/smart-folders/${selectedFolderId}/documents?year=${selectedYear}`
        : `/api/smart-folders/${selectedFolderId}/documents`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Fehler beim Laden der Dokumente');
      return response.json();
    },
    enabled: !!selectedFolderId,
  });

  // Extract available years from documents
  const availableYears = Array.from(
    new Set(documents.map(doc => doc.year).filter((year): year is number => year !== null))
  ).sort((a, b) => b - a);

  const handleDownloadAll = async () => {
    if (!selectedFolder) return;
    
    try {
      toast({
        title: "Download wird vorbereitet...",
        description: `Alle ${documents.length} Dokumente werden als ZIP heruntergeladen.`,
      });

      const url = selectedYear 
        ? `/api/smart-folders/${selectedFolderId}/documents/export?year=${selectedYear}`
        : `/api/smart-folders/${selectedFolderId}/documents/export`;

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Download fehlgeschlagen');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${selectedFolder.name}${selectedYear ? `_${selectedYear}` : ''}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast({
        title: "Download erfolgreich",
        description: "Alle Dokumente wurden heruntergeladen.",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download fehlgeschlagen",
        description: "Die Dokumente konnten nicht heruntergeladen werden.",
        variant: "destructive",
      });
    }
  };

  if (foldersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Smart-Ordner werden geladen...</div>
      </div>
    );
  }

  if (smartFolders.length === 0) {
    return (
      <EmptyState
        title="Keine Smart-Ordner gefunden"
        description="Smart-Ordner werden automatisch erstellt, wenn Sie Dokumente hochladen."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Smart Folder Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderSearch className="w-5 h-5" />
            Smart-Ordner auswählen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {smartFolders.map((folder) => (
              <Button
                key={folder.id}
                variant={selectedFolderId === folder.id ? "default" : "outline"}
                className="h-auto flex-col items-start p-4 gap-2"
                onClick={() => {
                  setSelectedFolderId(folder.id);
                  setSelectedYear(undefined);
                }}
                data-testid={`button-smart-folder-${folder.id}`}
              >
                <div className="text-2xl">{folder.icon}</div>
                <div className="text-sm font-medium text-left">{folder.name}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents View */}
      {selectedFolder && (
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl">{selectedFolder.icon}</span>
                <span>{selectedFolder.name}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({documents.length} {documents.length === 1 ? 'Dokument' : 'Dokumente'})
                </span>
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {availableYears.length > 0 && (
                  isMobile ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setYearDrawerOpen(true)}
                      className="w-full sm:w-auto"
                      data-testid="button-year-filter-mobile"
                    >
                      {selectedYear ? selectedYear : "Alle Jahre"}
                    </Button>
                  ) : (
                    <Select
                      value={selectedYear?.toString() || "all"}
                      onValueChange={(value) => setSelectedYear(value === "all" ? undefined : parseInt(value))}
                    >
                      <SelectTrigger className="w-[140px]" data-testid="select-year-filter">
                        <SelectValue placeholder="Alle Jahre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Jahre</SelectItem>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                )}
                {selectedFolder.downloadEnabled && documents.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAll}
                    className="w-full sm:w-auto"
                    data-testid="button-download-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Alle herunterladen
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Dokumente werden geladen...</div>
              </div>
            ) : documents.length === 0 ? (
              <EmptyState
                title={selectedYear ? `Keine Dokumente für ${selectedYear}` : "Keine Dokumente"}
                description={selectedYear 
                  ? `In diesem Smart-Ordner wurden noch keine Dokumente für das Jahr ${selectedYear} gefunden.`
                  : "In diesem Smart-Ordner wurden noch keine Dokumente gefunden."
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    id={doc.id}
                    title={doc.title}
                    category={doc.category}
                    date={new Date(doc.uploadedAt).toISOString()}
                    thumbnailUrl={doc.thumbnailUrl || undefined}
                    isShared={doc.isShared}
                    confidence={doc.confidence || undefined}
                    extractedDate={doc.extractedDate ? new Date(doc.extractedDate).toISOString() : undefined}
                    amount={doc.amount || undefined}
                    sender={doc.sender || undefined}
                    onView={() => {
                      setViewerDocument(doc);
                      setViewerOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mobile Year Selection Drawer */}
      {isMobile && availableYears.length > 0 && (
        <Drawer open={yearDrawerOpen} onOpenChange={setYearDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Jahr auswählen</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Button
                  variant={!selectedYear ? "default" : "outline"}
                  className="h-auto py-4 px-4 justify-between text-left"
                  onClick={() => {
                    setSelectedYear(undefined);
                    setYearDrawerOpen(false);
                  }}
                  data-testid="drawer-year-all"
                >
                  <span className="font-medium">Alle Jahre</span>
                  {!selectedYear && <Check className="h-5 w-5 flex-shrink-0" />}
                </Button>
                {availableYears.map((year) => (
                  <Button
                    key={year}
                    variant={selectedYear === year ? "default" : "outline"}
                    className="h-auto py-4 px-4 justify-between text-left"
                    onClick={() => {
                      setSelectedYear(year);
                      setYearDrawerOpen(false);
                    }}
                    data-testid={`drawer-year-${year}`}
                  >
                    <span className="font-medium">{year}</span>
                    {selectedYear === year && <Check className="h-5 w-5 flex-shrink-0" />}
                  </Button>
                ))}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
