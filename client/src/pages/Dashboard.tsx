import { useState, useEffect, useRef } from "react";
import { useQuery, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { FileText, HardDrive, TrendingUp, Plus, Trash2, ArrowUpDown, Download, Camera, ChevronDown, Settings, MoreVertical, LogOut, Shield } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "wouter";
import type { Document, User } from "@shared/schema";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { uploadDocument, getDocuments, deleteDocument, updateDocumentCategory, updateDocumentSharing, getStorageStats, bulkDeleteDocuments, exportDocumentsAsZip, getCurrentUser, getSubscriptionStatus, logout, type StorageStats, type SortOption, type SubscriptionStatus, type PaginatedDocuments } from "@/lib/api";
import { DocumentViewer } from "@/components/DocumentViewer";
import { MultiPageUpload } from "@/components/MultiPageUpload";
import { CameraMultiShot } from "@/components/CameraMultiShot";
import { EmailInbound } from "@/components/EmailInbound";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { UpgradeModal } from "@/components/UpgradeModal";
import { CheckoutDialog } from "@/components/CheckoutDialog";
import { TrialBanner } from "@/components/TrialBanner";
import { GracePeriodBanner } from "@/components/GracePeriodBanner";
import { ReadOnlyBanner } from "@/components/ReadOnlyBanner";
import { FreeBanner } from "@/components/FreeBanner";
import { Footer } from "@/components/Footer";
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
  const [showCameraMultiShot, setShowCameraMultiShot] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"solo" | "family" | "family-plus">("family");
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "yearly">("yearly");
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  // Listen for checkout events from UpgradeModal
  useEffect(() => {
    const handleOpenCheckout = (e: CustomEvent) => {
      const { plan, period } = e.detail;
      setSelectedPlan(plan);
      setSelectedPeriod(period);
      setCheckoutDialogOpen(true);
    };

    window.addEventListener('openCheckout' as any, handleOpenCheckout);
    return () => window.removeEventListener('openCheckout' as any, handleOpenCheckout);
  }, []);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/";
      toast({
        title: "Abgemeldet",
        description: "Sie wurden erfolgreich abgemeldet.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Abmeldung fehlgeschlagen",
        description: "Die Abmeldung konnte nicht durchgeführt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });
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
  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean;
    reason?: "document_limit" | "email_feature" | "trial_expired";
  }>({ open: false });
  const [updatingSharing, setUpdatingSharing] = useState<string | null>(null);

  // Fetch documents with React Query using infinite query for pagination
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedDocuments>({
    queryKey: ["/api/documents", searchQuery, selectedCategories, sortBy],
    queryFn: ({ pageParam }) => 
      getDocuments(searchQuery, selectedCategories, sortBy, undefined, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 0, // Always refetch when invalidated
  });

  // Flatten pages to get all documents
  const documents = data?.pages.flatMap(page => page.documents) || [];
  const totalDocuments = data?.pages[0]?.total || 0;

  // Fetch storage statistics
  const { data: storageStats } = useQuery<StorageStats>({
    queryKey: ["/api/storage/stats"],
    queryFn: getStorageStats,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch user data for email inbound
  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getCurrentUser,
    retry: false,
  });

  // Fetch subscription status
  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
    queryFn: getSubscriptionStatus,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60, // 1 minute
  });

  // Check if uploads/edits should be disabled (grace period or read-only mode)
  const isUploadDisabled = subscriptionStatus?.gracePeriod || subscriptionStatus?.isReadOnly;
  const isReadOnly = subscriptionStatus?.isReadOnly;

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
      // Check if it's a 403 error (limit reached)
      if (error.message.includes("403")) {
        setUpgradeModal({
          open: true,
          reason: "document_limit",
        });
        return;
      }
      
      setProcessingModal({
        open: true,
        status: 'error',
        progress: 0,
      });
      toast({
        title: "Fehler beim Hochladen",
        description: "Das Dokument konnte nicht hochgeladen werden. Bitte überprüfen Sie die Datei und versuchen Sie es erneut.",
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
        description: "Das Dokument konnte nicht in den Papierkorb verschoben werden. Bitte versuchen Sie es erneut.",
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
        description: "Die ausgewählten Dokumente konnten nicht in den Papierkorb verschoben werden. Bitte versuchen Sie es erneut.",
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
      const previousData = queryClient.getQueryData(["/api/documents", searchQuery, selectedCategories, sortBy]);

      // Optimistically update to the new value for infinite query
      queryClient.setQueryData(
        ["/api/documents", searchQuery, selectedCategories, sortBy],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: PaginatedDocuments) => ({
              ...page,
              documents: page.documents.map((doc: Document) =>
                doc.id === id ? { ...doc, category } : doc
              ),
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (error: Error, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ["/api/documents", searchQuery, selectedCategories, sortBy],
          context.previousData
        );
      }
      toast({
        title: "Fehler beim Aktualisieren",
        description: "Die Kategorie konnte nicht geändert werden. Bitte versuchen Sie es erneut.",
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

  // Update sharing mutation
  const updateSharingMutation = useMutation({
    mutationFn: async ({ id, isShared }: { id: string; isShared: boolean }) => {
      const result = await updateDocumentSharing(id, isShared);
      return result;
    },
    onMutate: async ({ id, isShared }) => {
      setUpdatingSharing(id);
      
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: ["/api/documents", searchQuery, selectedCategories, sortBy] 
      });

      // Get current data for infinite query
      const previousData = queryClient.getQueryData([
        "/api/documents", 
        searchQuery, 
        selectedCategories, 
        sortBy
      ]);

      // Optimistically update for infinite query
      queryClient.setQueryData(
        ["/api/documents", searchQuery, selectedCategories, sortBy],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: PaginatedDocuments) => ({
              ...page,
              documents: page.documents.map((doc: Document) =>
                doc.id === id ? { ...doc, isShared } : doc
              ),
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (error: Error, variables, context) => {
      setUpdatingSharing(null);
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ["/api/documents", searchQuery, selectedCategories, sortBy],
          context.previousData
        );
      }
      toast({
        title: "Fehler",
        description: "Der Freigabe-Status konnte nicht geändert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      setUpdatingSharing(null);
    },
    onSettled: () => {
      // Always refetch to ensure UI shows the correct sharing state
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  const scrollToUpload = () => {
    // Use setTimeout to ensure DOM has been updated after state changes
    setTimeout(() => {
      if (uploadSectionRef.current) {
        // Get the element's position
        const elementPosition = uploadSectionRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset from top
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 150);
  };

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
    setShowCameraMultiShot(false);
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
    isShared: doc.isShared, // Sharing status for share icon
    // Phase 2: Smart metadata
    confidence: doc.confidence,
    extractedDate: doc.extractedDate ? format(new Date(doc.extractedDate), "d. MMM yyyy", { locale: de }) : undefined,
    amount: doc.amount ?? undefined,
    sender: doc.sender ?? undefined,
  }));

  // Calculate stats
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

  // Phase 2: Category distribution for chart
  const categoryDistribution = categories
    .filter(cat => cat !== "Alle")
    .map(category => ({
      name: category.length > 20 ? category.substring(0, 18) + "..." : category,
      fullName: category,
      count: documents.filter(doc => doc.category === category).length,
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 categories

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex items-center justify-between md:justify-start gap-3">
              <img src={logoImage} alt="MeineDokBox" className="h-12 md:h-16" data-testid="img-logo" />
              <div className="flex items-center gap-2 md:hidden">
                <Link href="/settings">
                  <Button variant="ghost" size="sm" data-testid="button-settings-mobile">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout-mobile"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
                {!isUploadDisabled && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" data-testid="button-upload-menu-mobile">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setShowUpload(false); setShowCameraMultiShot(true); scrollToUpload(); }} data-testid="menu-item-camera-scanner">
                        <Camera className="h-4 w-4 mr-2" />
                        Kamera-Scanner
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setShowCameraMultiShot(false); setShowUpload(true); scrollToUpload(); }} data-testid="menu-item-multi-page">
                        <Plus className="h-4 w-4 mr-2" />
                        Datei hochladen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery}
              />
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              {documents.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportDocumentsAsZip}
                  data-testid="button-export"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {!isReadOnly && (
                <Link href="/trash">
                  <Button variant="outline" size="sm" data-testid="button-trash">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Papierkorb
                  </Button>
                </Link>
              )}
              <Link href="/settings">
                <Button variant="outline" size="sm" data-testid="button-settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Einstellungen
                </Button>
              </Link>
              {user?.email === "service@meinedokbox.de" && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" data-testid="button-admin">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
              {!isUploadDisabled && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button data-testid="button-upload-menu">
                      <Plus className="h-4 w-4 mr-2" />
                      Hochladen
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setShowUpload(false); setShowCameraMultiShot(true); scrollToUpload(); }} data-testid="menu-item-camera-scanner-desktop">
                      <Camera className="h-4 w-4 mr-2" />
                      Kamera-Scanner
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setShowCameraMultiShot(false); setShowUpload(true); scrollToUpload(); }} data-testid="menu-item-multi-page-desktop">
                      <Plus className="h-4 w-4 mr-2" />
                      Datei hochladen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div ref={uploadSectionRef}>
          {showUpload && (
            <div className="mb-8">
              <MultiPageUpload 
                onComplete={handleFileSelect}
                onCancel={() => setShowUpload(false)}
              />
            </div>
          )}

          {showCameraMultiShot && (
            <div className="mb-8">
              <Card>
                <CardContent className="p-6">
                  <CameraMultiShot 
                    onComplete={handleFileSelect}
                    onCancel={() => setShowCameraMultiShot(false)}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Subscription Status Banners */}
        {subscriptionStatus?.plan === "trial" && subscriptionStatus.daysRemaining && subscriptionStatus.daysRemaining > 0 && (
          <div className="mb-6">
            <TrialBanner
              daysRemaining={subscriptionStatus.daysRemaining}
              onUpgrade={() => setUpgradeModal({ open: true, reason: "trial_expired" })}
            />
          </div>
        )}
        
        {/* Free Plan Banner */}
        {subscriptionStatus?.plan === "free" && (
          <FreeBanner onUpgrade={() => setUpgradeModal({ open: true })} />
        )}
        
        {/* Grace Period Banner (Days 15-17) */}
        {subscriptionStatus?.gracePeriod && subscriptionStatus.graceDaysRemaining && (
          <GracePeriodBanner graceDaysRemaining={subscriptionStatus.graceDaysRemaining} />
        )}
        
        {/* Read-Only Banner (Day 18+) */}
        {subscriptionStatus?.isReadOnly && (
          <ReadOnlyBanner />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          {/* Monthly Upload Limit Card */}
          <Card data-testid="card-upload-limit">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Uploads diesen Monat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscriptionStatus?.uploadsThisMonth ?? 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / {subscriptionStatus?.maxUploadsPerMonth ?? "..."}
                </span>
              </div>
              <div className="mt-3">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      ((subscriptionStatus?.uploadsThisMonth ?? 0) / (subscriptionStatus?.maxUploadsPerMonth ?? 1)) >= 0.9 
                        ? 'bg-destructive' 
                        : ((subscriptionStatus?.uploadsThisMonth ?? 0) / (subscriptionStatus?.maxUploadsPerMonth ?? 1)) >= 0.7 
                          ? 'bg-yellow-500' 
                          : 'bg-primary'
                    }`}
                    style={{ 
                      width: `${Math.min(
                        ((subscriptionStatus?.uploadsThisMonth ?? 0) / (subscriptionStatus?.maxUploadsPerMonth ?? 1)) * 100,
                        100
                      )}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {(subscriptionStatus?.maxUploadsPerMonth ?? 0) - (subscriptionStatus?.uploadsThisMonth ?? 0)} verfügbar
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Storage Limit Card */}
          <Card data-testid="card-storage-limit">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                Speicher verwendet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscriptionStatus?.storageUsedGB?.toFixed(2) ?? "0.00"} GB
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / {subscriptionStatus?.maxStorageGB ?? "..."} GB
                </span>
              </div>
              <div className="mt-3">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      ((subscriptionStatus?.storageUsedGB ?? 0) / (subscriptionStatus?.maxStorageGB ?? 1)) >= 0.9 
                        ? 'bg-destructive' 
                        : ((subscriptionStatus?.storageUsedGB ?? 0) / (subscriptionStatus?.maxStorageGB ?? 1)) >= 0.7 
                          ? 'bg-yellow-500' 
                          : 'bg-primary'
                    }`}
                    style={{ 
                      width: `${Math.min(
                        ((subscriptionStatus?.storageUsedGB ?? 0) / (subscriptionStatus?.maxStorageGB ?? 1)) * 100,
                        100
                      )}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {((subscriptionStatus?.maxStorageGB ?? 0) - (subscriptionStatus?.storageUsedGB ?? 0)).toFixed(2)} GB verfügbar
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Documents Card */}
          <StatsCard
            title="Gesamt Dokumente"
            value={totalDocuments}
            icon={FileText}
            description={`+${thisMonthCount} diesen Monat`}
          />
        </div>

        {categoryDistribution.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Dokumentenverteilung nach Kategorien</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelFormatter={(value, payload) => {
                      const item = payload[0]?.payload;
                      return item?.fullName || value;
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {user && user.inboundEmail && (
          <div className="mb-8">
            <EmailInbound user={user} />
          </div>
        )}

        <div className="mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold">Meine Dokumente</h2>
              <div className="flex items-center gap-3">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
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
            </div>
            
            <CategoryFilter
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoryToggle={handleCategoryToggle}
            />
          </div>

          {!isReadOnly && selectedDocuments.size > 0 && (
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
            onCameraClick={!searchQuery && !isUploadDisabled ? () => { setShowUpload(false); setShowCameraMultiShot(true); scrollToUpload(); } : undefined}
            onMultiPageClick={!searchQuery && !isUploadDisabled ? () => { setShowCameraMultiShot(false); setShowUpload(true); scrollToUpload(); } : undefined}
          />
        ) : (
          <>
            {!isReadOnly && documents.length > 0 && (
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
                  {!isReadOnly && (
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedDocuments.has(doc.id)}
                        onCheckedChange={(checked) => handleSelectDocument(doc.id, checked as boolean)}
                        data-testid={`checkbox-document-${doc.id}`}
                        className="bg-background"
                      />
                    </div>
                  )}
                  <DocumentCard
                    {...doc}
                    isUpdatingSharing={updatingSharing === doc.id}
                    onView={() => handleView(doc.id)}
                    onDelete={!isReadOnly ? () => handleDelete(doc.id) : undefined}
                    onCategoryChange={(category) => handleCategoryChange(doc.id, category)}
                    onSharingToggle={(isShared) => {
                      if (updatingSharing === null) {
                        updateSharingMutation.mutate({ id: doc.id, isShared });
                      }
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Document count and Load More button */}
            <div className="mt-8 flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground" data-testid="text-document-count">
                Zeige {documents.length} von {totalDocuments} Dokumenten
              </p>
              
              {hasNextPage && (
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  data-testid="button-load-more"
                  className="min-w-[200px]"
                >
                  {isFetchingNextPage ? "Wird geladen..." : "Mehr laden"}
                </Button>
              )}
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

      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false })}
        reason={upgradeModal.reason}
      />

      <CheckoutDialog
        open={checkoutDialogOpen}
        onClose={() => setCheckoutDialogOpen(false)}
        selectedPlan={selectedPlan}
        selectedPeriod={selectedPeriod}
      />

      <Footer />
    </div>
  );
}
