import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, HardDrive, TrendingUp, Plus, Trash2, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "wouter";
import type { Document } from "@shared/schema";
import { UploadZone } from "@/components/UploadZone";
import { DocumentCard } from "@/components/DocumentCard";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { StatsCard } from "@/components/StatsCard";
import { EmptyState } from "@/components/EmptyState";
import { ProcessingModal } from "@/components/ProcessingModal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { uploadDocument, getDocuments, deleteDocument, updateDocumentCategory, getStorageStats, bulkDeleteDocuments, type StorageStats, type SortOption } from "@/lib/api";
import { DocumentViewer } from "@/components/DocumentViewer";
import { MultiPageUpload } from "@/components/MultiPageUpload";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoImage from "@assets/meinedokbox_1760966015056.png";

const categories = [
  "Alle",
  "Finanzen & Banken",
  "Versicherungen",
  "Steuern & Buchhaltung",
  "Arbeit & Gehalt",
  "Verträge & Abos",
  "Behörden & Amtliches",
  "Gesundheit & Arzt",
  "Wohnen & Immobilien",
  "Auto & Mobilität",
  "Schule & Ausbildung",
  "Familie & Kinder",
  "Rente & Vorsorge",
  "Einkäufe & Online-Bestellungen",
  "Reisen & Freizeit",
  "Sonstiges / Privat"
];

export default function Dashboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Alle"]);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const [processingModal, setProcessingModal] = useState<{
    open: boolean;
    status: 'processing' | 'success' | 'error';
    progress: number;
    detectedCategory?: string;
  }>({
    open: false,
    status: 'processing',
    progress: 0,
  });
  const [viewerDocument, setViewerDocument] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Fetch documents with React Query
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", searchQuery, selectedCategories, sortBy],
    queryFn: () => getDocuments(searchQuery, selectedCategories, sortBy),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch storage statistics
  const { data: storageStats } = useQuery<StorageStats>({
    queryKey: ["/api/storage/stats"],
    queryFn: getStorageStats,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: (document) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/stats"] });
      setProcessingModal({
        open: true,
        status: 'success',
        progress: 100,
        detectedCategory: document.category,
      });
      toast({
        title: "Dokument erfolgreich hochgeladen",
        description: `"${document.title}" wurde als ${document.category} klassifiziert.`,
      });
    },
    onError: (error: Error) => {
      setProcessingModal({
        open: true,
        status: 'error',
        progress: 0,
      });
      toast({
        title: "Fehler beim Hochladen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/stats"] });
      setSelectedDocuments(new Set());
      toast({
        title: "Dokument in den Papierkorb verschoben",
        description: "Das Dokument wurde in den Papierkorb verschoben.",
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

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteDocuments,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/stats"] });
      setSelectedDocuments(new Set());
      toast({
        title: `${data.count} Dokument(e) in den Papierkorb verschoben`,
        description: "Die ausgewählten Dokumente wurden in den Papierkorb verschoben.",
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

  // Update category mutation with optimistic updates
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, category }: { id: string; category: string }) => 
      updateDocumentCategory(id, category),
    onMutate: async ({ id, category }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/documents"] });

      // Snapshot previous value
      const previousDocuments = queryClient.getQueryData(["/api/documents"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["/api/documents", searchQuery, selectedCategories], (old: Document[] | undefined) =>
        old?.map(doc => doc.id === id ? { ...doc, category } : doc)
      );

      return { previousDocuments };
    },
    onError: (error: Error, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousDocuments) {
        queryClient.setQueryData(["/api/documents"], context.previousDocuments);
      }
      toast({
        title: "Fehler beim Aktualisieren",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (updatedDoc) => {
      toast({
        title: "Kategorie aktualisiert",
        description: `"${updatedDoc.title}" wurde zu ${updatedDoc.category} verschoben.`,
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  const handleCategoryToggle = (category: string) => {
    if (category === "Alle") {
      setSelectedCategories(["Alle"]);
    } else {
      const newCategories = selectedCategories.includes(category)
        ? selectedCategories.filter(c => c !== category)
        : [...selectedCategories.filter(c => c !== "Alle"), category];
      
      setSelectedCategories(newCategories.length === 0 ? ["Alle"] : newCategories);
    }
  };

  const handleFileSelect = async (files: File | File[]) => {
    setShowUpload(false);
    setProcessingModal({ open: true, status: 'processing', progress: 0 });

    // Simulate progress stages while upload is happening
    const progressInterval = setInterval(() => {
      setProcessingModal(prev => {
        if (prev.progress >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return { ...prev, progress: prev.progress + 10 };
      });
    }, 300);

    try {
      await uploadMutation.mutateAsync(files);
      clearInterval(progressInterval);
    } catch (error) {
      clearInterval(progressInterval);
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCategoryChange = (id: string, category: string) => {
    updateCategoryMutation.mutate({ id, category });
  };

  const handleView = (id: string) => {
    const document = documents.find(doc => doc.id === id);
    if (document) {
      setViewerDocument(document);
      setViewerOpen(true);
    }
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setTimeout(() => setViewerDocument(null), 300);
  };

  // Selection handlers
  const handleSelectDocument = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedDocuments);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedDocuments(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(new Set(documents.map(doc => doc.id)));
    } else {
      setSelectedDocuments(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedDocuments.size > 0) {
      bulkDeleteMutation.mutate(Array.from(selectedDocuments));
    }
  };

  const allSelected = documents.length > 0 && selectedDocuments.size === documents.length;
  const someSelected = selectedDocuments.size > 0 && !allSelected;

  // Format documents for display
  const formattedDocuments = documents.map(doc => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    date: format(new Date(doc.uploadedAt), "d. MMM yyyy", { locale: de }),
    thumbnailUrl: doc.thumbnailUrl ?? undefined,
  }));

  // Calculate stats
  const totalDocuments = documents.length;
  const thisMonthCount = documents.filter(doc => {
    const uploadDate = new Date(doc.uploadedAt);
    const now = new Date();
    return uploadDate.getMonth() === now.getMonth() && 
           uploadDate.getFullYear() === now.getFullYear();
  }).length;

  // Format storage display
  const storageDisplay = storageStats 
    ? `${storageStats.usedGB.toFixed(2)} GB`
    : "...";
  const storageTotalDisplay = storageStats
    ? `von ${storageStats.totalGB} GB`
    : "von 5 GB";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex items-center justify-between md:justify-start gap-3">
              <img src={logoImage} alt="MeineDokBox" className="h-12 md:h-16 dark:invert dark:brightness-0 dark:contrast-200" data-testid="img-logo" />
              <div className="flex items-center gap-2 md:hidden">
                <ThemeToggle />
                <Button 
                  onClick={() => setShowUpload(!showUpload)}
                  data-testid="button-toggle-upload"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery}
              />
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <Link href="/trash">
                <Button variant="outline" size="sm" data-testid="button-trash">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Papierkorb
                </Button>
              </Link>
              <Button 
                onClick={() => setShowUpload(!showUpload)}
                data-testid="button-toggle-upload"
              >
                <Plus className="h-4 w-4 mr-2" />
                Hochladen
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {showUpload && (
          <div className="mb-8">
            <MultiPageUpload 
              onComplete={handleFileSelect}
              onCancel={() => setShowUpload(false)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <StatsCard
            title="Gesamt Dokumente"
            value={totalDocuments}
            icon={FileText}
            description={`+${thisMonthCount} diesen Monat`}
          />
          <StatsCard
            title="Speicher verwendet"
            value={storageDisplay}
            icon={HardDrive}
            description={storageTotalDisplay}
          />
          <StatsCard
            title="Diesen Monat"
            value={thisMonthCount}
            icon={TrendingUp}
            description="hochgeladen"
          />
        </div>

        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold">Meine Dokumente</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-[180px]" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Neueste zuerst</SelectItem>
                    <SelectItem value="date-asc">Älteste zuerst</SelectItem>
                    <SelectItem value="title-asc">Titel A-Z</SelectItem>
                    <SelectItem value="title-desc">Titel Z-A</SelectItem>
                    <SelectItem value="category-asc">Nach Kategorie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CategoryFilter
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoryToggle={handleCategoryToggle}
              />
            </div>
          </div>

          {selectedDocuments.size > 0 && (
            <div className="mt-4 flex items-center gap-4 p-4 bg-accent rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  data-testid="checkbox-select-all"
                />
                <span className="text-sm font-medium">
                  {selectedDocuments.size} ausgewählt
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                data-testid="button-bulk-delete"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {bulkDeleteMutation.isPending ? "Wird gelöscht..." : "Löschen"}
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Dokumente werden geladen...</p>
          </div>
        ) : formattedDocuments.length === 0 ? (
          <EmptyState
            title="Keine Dokumente gefunden"
            description={
              searchQuery 
                ? `Keine Dokumente für "${searchQuery}" gefunden.`
                : "Laden Sie Ihr erstes Dokument hoch, um loszulegen."
            }
            actionLabel={!searchQuery ? "Dokument hochladen" : undefined}
            onAction={!searchQuery ? () => setShowUpload(true) : undefined}
          />
        ) : (
          <>
            {documents.length > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  data-testid="checkbox-select-all-header"
                />
                <span className="text-sm text-muted-foreground">
                  {someSelected ? `${selectedDocuments.size} ausgewählt` : (allSelected ? "Alle auswählen" : "Alle abwählen")}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {formattedDocuments.map((doc) => (
                <div key={doc.id} className="relative">
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedDocuments.has(doc.id)}
                      onCheckedChange={(checked) => handleSelectDocument(doc.id, checked as boolean)}
                      data-testid={`checkbox-document-${doc.id}`}
                      className="bg-background"
                    />
                  </div>
                  <DocumentCard
                    {...doc}
                    onView={() => handleView(doc.id)}
                    onDelete={() => handleDelete(doc.id)}
                    onCategoryChange={(category) => handleCategoryChange(doc.id, category)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <ProcessingModal
        open={processingModal.open}
        status={processingModal.status}
        progress={processingModal.progress}
        detectedCategory={processingModal.detectedCategory}
        onClose={() => setProcessingModal(prev => ({ ...prev, open: false }))}
        onAddAnother={() => {
          setProcessingModal(prev => ({ ...prev, open: false }));
          setShowUpload(true);
        }}
      />

      <DocumentViewer
        document={viewerDocument}
        open={viewerOpen}
        onClose={handleCloseViewer}
      />
    </div>
  );
}
