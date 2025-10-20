import { useState } from "react";
import { FileText, HardDrive, TrendingUp, Plus } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { DocumentCard } from "@/components/DocumentCard";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { StatsCard } from "@/components/StatsCard";
import { EmptyState } from "@/components/EmptyState";
import { ProcessingModal } from "@/components/ProcessingModal";
import { Button } from "@/components/ui/button";

// todo: remove mock functionality
const mockDocuments = [
  {
    id: "1",
    title: "Versicherungspolice Autoversicherung 2024",
    category: "Versicherung",
    date: "15. Okt 2024",
  },
  {
    id: "2",
    title: "Mietvertrag Wohnung Hauptstraße",
    category: "Vertrag",
    date: "1. Jan 2024",
  },
  {
    id: "3",
    title: "Stromrechnung März 2024",
    category: "Rechnung",
    date: "3. Apr 2024",
  },
  {
    id: "4",
    title: "Brief vom Finanzamt",
    category: "Brief",
    date: "20. Sep 2024",
  },
  {
    id: "5",
    title: "Handyrechnung Februar 2024",
    category: "Rechnung",
    date: "1. Mär 2024",
  },
  {
    id: "6",
    title: "Krankenversicherung Jahrespolice",
    category: "Versicherung",
    date: "10. Jan 2024",
  },
];

const categories = ["Alle", "Rechnung", "Vertrag", "Versicherung", "Brief", "Sonstiges"];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Alle"]);
  const [showUpload, setShowUpload] = useState(false);
  const [processingModal, setProcessingModal] = useState<{
    open: boolean;
    status: 'processing' | 'success' | 'error';
    progress: number;
  }>({
    open: false,
    status: 'processing',
    progress: 0,
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

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name);
    setShowUpload(false);
    
    setProcessingModal({ open: true, status: 'processing', progress: 0 });
    
    // todo: remove mock functionality
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setProcessingModal(prev => ({ ...prev, progress }));
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setProcessingModal({ open: true, status: 'success', progress: 100 });
        }, 500);
      }
    }, 400);
  };

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.includes("Alle") || selectedCategories.includes(doc.category);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">PaperEase</h1>
            </div>
            
            <div className="flex-1 flex items-center gap-3">
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery}
              />
            </div>
            
            <Button 
              onClick={() => setShowUpload(!showUpload)}
              data-testid="button-toggle-upload"
            >
              <Plus className="h-4 w-4 mr-2" />
              Hochladen
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {showUpload && (
          <div className="mb-8">
            <UploadZone onFileSelect={handleFileSelect} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <StatsCard
            title="Gesamt Dokumente"
            value={mockDocuments.length}
            icon={FileText}
            description="+12 diesen Monat"
          />
          <StatsCard
            title="Speicher verwendet"
            value="2.4 GB"
            icon={HardDrive}
            description="von 10 GB"
          />
          <StatsCard
            title="Diesen Monat"
            value={23}
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

        {filteredDocuments.length === 0 ? (
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
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                {...doc}
                onView={() => console.log('View', doc.id)}
                onDelete={() => console.log('Delete', doc.id)}
              />
            ))}
          </div>
        )}
      </main>

      <ProcessingModal
        open={processingModal.open}
        status={processingModal.status}
        progress={processingModal.progress}
        detectedCategory="Rechnung"
        onClose={() => setProcessingModal(prev => ({ ...prev, open: false }))}
        onAddAnother={() => {
          setProcessingModal(prev => ({ ...prev, open: false }));
          setShowUpload(true);
        }}
      />
    </div>
  );
}
