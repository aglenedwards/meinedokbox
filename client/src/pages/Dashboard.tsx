import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, HardDrive, TrendingUp, Plus } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { Document } from "@shared/schema";
import { UploadZone } from "@/components/UploadZone";
import { DocumentCard } from "@/components/DocumentCard";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { StatsCard } from "@/components/StatsCard";
import { EmptyState } from "@/components/EmptyState";
import { ProcessingModal } from "@/components/ProcessingModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { uploadDocument, getDocuments, deleteDocument } from "@/lib/api";
import { DocumentViewer } from "@/components/DocumentViewer";
import { MultiPageUpload } from "@/components/MultiPageUpload";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoImage from "@assets/meinedokbox_1760966015056.png";

const categories = ["Alle", "Rechnung", "Vertrag", "Versicherung", "Brief", "Sonstiges"];

export default function Dashboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Alle"]);
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
    queryKey: ["/api/documents", searchQuery, selectedCategories],
    queryFn: () => getDocuments(searchQuery, selectedCategories),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: (document) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
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
      toast({
        title: "Dokument gelöscht",
        description: "Das Dokument wurde erfolgreich gelöscht.",
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex items-center justify-between md:justify-start gap-3">
              <img src={logoImage} alt="MeineDokBox" className="h-10 md:h-14" data-testid="img-logo" />
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
            value="2.4 GB"
            icon={HardDrive}
            description="von 10 GB"
          />
          <StatsCard
            title="Diesen Monat"
            value={thisMonthCount}
            icon={TrendingUp}
            description="hochgeladen"
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Meine Dokumente</h2>
          <CategoryFilter
            categories={categories}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
          />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {formattedDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                {...doc}
                onView={() => handleView(doc.id)}
                onDelete={() => handleDelete(doc.id)}
              />
            ))}
          </div>
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
