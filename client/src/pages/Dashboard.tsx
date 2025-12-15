import { useState, useEffect, useRef } from "react";
import { useQuery, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { FileText, HardDrive, TrendingUp, Plus, Trash2, ArrowUpDown, Download, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "wouter";
import type { Document, DocumentWithFolder, User } from "@shared/schema";
import { UploadZone } from "@/components/UploadZone";
import { DocumentCard } from "@/components/DocumentCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { StatsCard } from "@/components/StatsCard";
import { EmptyState } from "@/components/EmptyState";
import { ProcessingModal } from "@/components/ProcessingModal";
import { DuplicateWarningDialog } from "@/components/DuplicateWarningDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SmartFolders } from "@/components/SmartFolders";
import { Folders } from "@/components/Folders";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { uploadDocument, getDocuments, deleteDocument, updateDocumentCategory, updateDocumentSharing, getStorageStats, bulkDeleteDocuments, exportDocumentsAsZip, getCurrentUser, getSubscriptionStatus, type StorageStats, type SortOption, type SubscriptionStatus, type PaginatedDocuments } from "@/lib/api";
import { DocumentViewer } from "@/components/DocumentViewer";
import { MultiPageUpload } from "@/components/MultiPageUpload";
import { CameraMultiShot } from "@/components/CameraMultiShot";
import { EmailInbound } from "@/components/EmailInbound";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentGridSkeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { UpgradeModal } from "@/components/UpgradeModal";
import { CheckoutDialog } from "@/components/CheckoutDialog";
import { TrialBanner } from "@/components/TrialBanner";
import { GracePeriodBanner } from "@/components/GracePeriodBanner";
import { ReadOnlyBanner } from "@/components/ReadOnlyBanner";
import { FreeBanner } from "@/components/FreeBanner";
import { DashboardFooter } from "@/components/DashboardFooter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { UnpaidInvoicesWidget } from "@/components/UnpaidInvoicesWidget";

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
  const [activeTab, setActiveTab] = useState<"all" | "smart" | "folders">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Alle"]);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const [showCameraMultiShot, setShowCameraMultiShot] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"solo" | "family" | "family-plus">("family");
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "yearly">("yearly");
  
  const uploadAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to upload area when it opens (mobile UX)
  useEffect(() => {
    if (showUpload || showCameraMultiShot) {
      setTimeout(() => {
        const uploadElement = document.getElementById('upload-area');
        if (uploadElement) {
          uploadElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [showUpload, showCameraMultiShot]);

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

  const [processingModal, setProcessingModal] = useState<{
    open: boolean;
    status: 'processing' | 'success' | 'error';
    progress: number;
    detectedCategory?: string;
    uploadedDocumentId?: string;
    totalFiles?: number;
    currentFile?: number;
  }>({
    open: false,
    status: 'processing',
    progress: 0,
  });
  const [viewerDocument, setViewerDocument] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean;
    reason?: "document_limit" | "email_feature" | "trial_expired" | "trial_active";
    daysRemaining?: number;
  }>({ open: false });
  const [updatingSharing, setUpdatingSharing] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    open: boolean;
    duplicates: Array<{ filename: string; duplicate: any }>;
    files: File | File[];
    mergeIntoOne: boolean;
  }>({ open: false, duplicates: [], files: [], mergeIntoOne: false });

  // Fetch documents with React Query using infinite query for pagination
  const DOCS_PER_PAGE = 25;
  
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedDocuments>({
    queryKey: ["/api/documents", searchQuery, selectedCategories, sortBy],
    queryFn: ({ pageParam }) => 
      getDocuments(searchQuery, selectedCategories, sortBy, DOCS_PER_PAGE, pageParam as string | undefined),
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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/stats"] });
      
      const { documents, errors, message } = result;
      
      // Show success for uploaded documents
      if (documents.length > 0) {
        const firstDocument = documents[0];
        setProcessingModal({
          open: true,
          status: 'success',
          progress: 100,
          detectedCategory: firstDocument.category,
          uploadedDocumentId: firstDocument.id,
        });
        
        // Show appropriate success message
        if (documents.length === 1) {
          toast({
            title: "Dokument erfolgreich hochgeladen",
            description: `"${firstDocument.title}" wurde als ${firstDocument.category} klassifiziert.`,
          });
        } else {
          toast({
            title: message || `${documents.length} Dokumente erfolgreich hochgeladen`,
            description: `Alle Dokumente wurden automatisch kategorisiert.`,
          });
        }
      }
      
      // Show warnings for any errors
      if (errors && errors.length > 0) {
        toast({
          title: "Einige Dateien konnten nicht hochgeladen werden",
          description: `${errors.length} von ${documents.length + errors.length} Dateien sind fehlgeschlagen.`,
          variant: "destructive",
        });
      }
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

  // Update folder mutation with optimistic updates
  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId: string | null }) => {
      const res = await apiRequest('PATCH', `/api/documents/${id}/folder`, { folderId });
      return await res.json();
    },
    onMutate: async ({ id, folderId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/documents"] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(["/api/documents", searchQuery, selectedCategories, sortBy]);

      // Get folder data from cache to show immediately
      const foldersData = queryClient.getQueryData<Array<{ id: string; name: string; icon: string }>>(['/api/folders']);
      const folder = foldersData?.find(f => f.id === folderId);

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
                doc.id === id ? { 
                  ...doc, 
                  folderId,
                  folderName: folder?.name || null,
                  folderIcon: folder?.icon || null,
                } : doc
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
        description: "Der Ordner konnte nicht geändert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Ordner aktualisiert",
        description: variables.folderId 
          ? "Das Dokument wurde erfolgreich einem Ordner zugewiesen."
          : "Das Dokument wurde erfolgreich aus dem Ordner entfernt.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
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

  const handleFileSelect = async (files: File | File[], mergeIntoOne: boolean = false, forceDuplicates: boolean = false) => {
    setShowUpload(false);
    setShowCameraMultiShot(false);
    
    const fileArray = Array.isArray(files) ? files : [files];
    const totalFiles = mergeIntoOne ? 1 : fileArray.length; // If merging, it's 1 document
    
    setProcessingModal({ 
      open: true, 
      status: 'processing', 
      progress: 0,
      totalFiles,
      currentFile: 1,
    });

    // Realistic progress simulation
    // Estimate: ~30-45 seconds per file for Vision API, ~10 seconds for text-only PDFs
    const estimatedSecondsPerFile = 30;
    const estimatedTotalSeconds = totalFiles * estimatedSecondsPerFile;
    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      setProcessingModal(prev => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        let newProgress = prev.progress;
        
        // Phase 1: Upload (0-20%) - fast, ~2-3 seconds
        if (elapsedSeconds < 3) {
          newProgress = Math.min(20, (elapsedSeconds / 3) * 20);
        }
        // Phase 2: AI Analysis (20-85%) - slow, based on estimated time
        else if (elapsedSeconds < estimatedTotalSeconds - 2) {
          const analysisProgress = (elapsedSeconds - 3) / (estimatedTotalSeconds - 5);
          newProgress = 20 + (analysisProgress * 65);
        }
        // Phase 3: Saving (85-95%) - keep some buffer
        else {
          newProgress = Math.min(95, 85 + ((elapsedSeconds - (estimatedTotalSeconds - 2)) / 2) * 10);
        }
        
        // Calculate current file based on progress
        const currentFile = Math.min(totalFiles, Math.ceil((newProgress / 100) * totalFiles) || 1);
        
        return { 
          ...prev, 
          progress: Math.round(newProgress),
          currentFile,
        };
      });
    }, 500); // Update every 500ms for smoother animation

    try {
      // Upload with mergeIntoOne and forceDuplicates flags if provided
      const result = await uploadDocument(files, mergeIntoOne, forceDuplicates);
      
      clearInterval(progressInterval);
      
      // Check for duplicates
      if (result.isDuplicate || (result.duplicates && result.duplicates.length > 0)) {
        setProcessingModal({ open: false, status: 'processing', progress: 0 });
        setDuplicateWarning({
          open: true,
          duplicates: result.duplicates || [],
          files,
          mergeIntoOne,
        });
        return;
      }
      
      // Manually trigger mutation callbacks for cache invalidation
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/stats"] });
      
      // Show success for uploaded documents
      const { documents, errors, message } = result;
      
      if (documents && documents.length > 0) {
        const firstDocument = documents[0];
        setProcessingModal({
          open: true,
          status: 'success',
          progress: 100,
          detectedCategory: firstDocument.category,
          uploadedDocumentId: firstDocument.id,
        });
        
        // Show appropriate success message
        if (mergeIntoOne && fileArray.length > 1) {
          toast({
            title: "Dokumente zusammengeführt",
            description: `${fileArray.length} Dateien wurden zu einem Dokument zusammengeführt: "${firstDocument.title}"`,
          });
        } else if (documents.length === 1) {
          const successTitle = forceDuplicates 
            ? "Dokument erneut hochgeladen" 
            : "Dokument erfolgreich hochgeladen";
          toast({
            title: successTitle,
            description: `"${firstDocument.title}" wurde als ${firstDocument.category} klassifiziert.`,
          });
        } else {
          toast({
            title: message || `${documents.length} Dokumente erfolgreich hochgeladen`,
            description: `Alle Dokumente wurden automatisch kategorisiert.`,
          });
        }
        
        // Show partial errors if any
        if (errors && errors.length > 0) {
          toast({
            title: "Einige Uploads sind fehlgeschlagen",
            description: `${errors.length} von ${fileArray.length} Dateien konnten nicht hochgeladen werden.`,
            variant: "destructive",
          });
        }
        
        // Show duplicate warnings if any (for 207 multi-status responses)
        if (result.duplicates && result.duplicates.length > 0) {
          toast({
            title: "Einige Dokumente waren Duplikate",
            description: `${result.duplicates.length} Dokument(e) wurden bereits hochgeladen und übersprungen.`,
            variant: "default",
          });
        }
      } else {
        // No documents were uploaded - this shouldn't happen if backend returned 200
        setProcessingModal({ open: false, status: 'processing', progress: 0 });
        if (!result.isDuplicate && !result.duplicates) {
          toast({
            title: "Upload fehlgeschlagen",
            description: "Es konnten keine Dokumente hochgeladen werden.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      clearInterval(progressInterval);
      setProcessingModal({
        open: true,
        status: 'error',
        progress: 0,
      });
      toast({
        title: "Upload fehlgeschlagen",
        description: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
        variant: "destructive",
      });
    }
  };
  
  const handleUploadAnyway = () => {
    const { files, mergeIntoOne } = duplicateWarning;
    setDuplicateWarning({ open: false, duplicates: [], files: [], mergeIntoOne: false });
    handleFileSelect(files, mergeIntoOne, true); // Force upload with forceDuplicates=true
  };
  
  const handleCancelDuplicateUpload = () => {
    setDuplicateWarning({ open: false, duplicates: [], files: [], mergeIntoOne: false });
    toast({
      title: "Upload abgebrochen",
      description: "Die Duplikate wurden nicht erneut hochgeladen.",
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCategoryChange = (id: string, category: string) => {
    updateCategoryMutation.mutate({ id, category });
  };

  const handleFolderChange = (id: string, folderId: string | null) => {
    updateFolderMutation.mutate({ id, folderId });
  };

  const handlePaymentStatusChange = async (id: string, status: 'paid' | 'unpaid' | 'not_applicable') => {
    try {
      await apiRequest('PATCH', `/api/documents/${id}/payment-status`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/unpaid-invoices"] });
      toast({
        title: "Zahlungsstatus aktualisiert",
        description: status === 'paid' ? "Rechnung als bezahlt markiert" : "Rechnung als unbezahlt markiert",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Der Zahlungsstatus konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
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
    documentDate: doc.documentDate ? format(new Date(doc.documentDate), "d. MMM yyyy", { locale: de }) : undefined,
    amount: doc.amount ?? undefined,
    sender: doc.sender ?? undefined,
    // Folder assignment
    folderId: doc.folderId ?? undefined,
    folderName: doc.folderName ?? undefined,
    folderIcon: doc.folderIcon ?? undefined,
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
    <DashboardLayout
      showSearch={true}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onUploadClick={(mode) => {
        if (mode === "camera") {
          setShowUpload(false);
          setShowCameraMultiShot(true);
        } else {
          setShowCameraMultiShot(false);
          setShowUpload(true);
        }
      }}
    >
        <div id="upload-area" ref={uploadAreaRef}>
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
        {/* Only show trial banner if plan is trial AND no active Stripe subscription */}
        {subscriptionStatus?.plan === "trial" && subscriptionStatus.daysRemaining && subscriptionStatus.daysRemaining > 0 && !subscriptionStatus.hasActiveSubscription && (
          <div className="mb-6">
            <TrialBanner
              daysRemaining={subscriptionStatus.daysRemaining}
              onUpgrade={() => setUpgradeModal({ 
                open: true, 
                reason: "trial_active",
                daysRemaining: subscriptionStatus.daysRemaining ?? undefined
              })}
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

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "smart" | "folders")} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all" data-testid="tab-alle-dokumente">Alle Dokumente</TabsTrigger>
            <TabsTrigger value="smart" data-testid="tab-steuererklarung">Steuererklärung</TabsTrigger>
            <TabsTrigger value="folders" data-testid="tab-meine-ordner">Meine Ordner</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "smart" ? (
          <SmartFolders />
        ) : activeTab === "folders" ? (
          <Folders />
        ) : (
          <>
        {!isReadOnly && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8" data-testid="section-statistics">
            {/* Monthly Upload Limit Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5" data-testid="card-upload-limit">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  Uploads diesen Monat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                  {subscriptionStatus?.uploadsThisMonth ?? 0}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / {subscriptionStatus?.maxUploadsPerMonth ?? "..."}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="h-3 bg-secondary/50 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-500 ease-out rounded-full ${
                        ((subscriptionStatus?.uploadsThisMonth ?? 0) / (subscriptionStatus?.maxUploadsPerMonth ?? 1)) >= 0.9 
                          ? 'bg-gradient-to-r from-red-400 to-red-600' 
                          : ((subscriptionStatus?.uploadsThisMonth ?? 0) / (subscriptionStatus?.maxUploadsPerMonth ?? 1)) >= 0.7 
                            ? 'bg-gradient-to-r from-amber-400 to-amber-600' 
                            : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
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
                    <span className="font-medium text-foreground">{(subscriptionStatus?.maxUploadsPerMonth ?? 0) - (subscriptionStatus?.uploadsThisMonth ?? 0)}</span> verfügbar
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Storage Limit Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5" data-testid="card-storage-limit">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  Speicher verwendet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                  {subscriptionStatus?.storageUsedGB?.toFixed(2) ?? "0.00"} GB
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / {subscriptionStatus?.maxStorageGB ?? "..."} GB
                  </span>
                </div>
                <div className="mt-3">
                  <div className="h-3 bg-secondary/50 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-500 ease-out rounded-full ${
                        ((subscriptionStatus?.storageUsedGB ?? 0) / (subscriptionStatus?.maxStorageGB ?? 1)) >= 0.9 
                          ? 'bg-gradient-to-r from-red-400 to-red-600' 
                          : ((subscriptionStatus?.storageUsedGB ?? 0) / (subscriptionStatus?.maxStorageGB ?? 1)) >= 0.7 
                            ? 'bg-gradient-to-r from-amber-400 to-amber-600' 
                            : 'bg-gradient-to-r from-blue-400 to-blue-600'
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
                    <span className="font-medium text-foreground">{((subscriptionStatus?.maxStorageGB ?? 0) - (subscriptionStatus?.storageUsedGB ?? 0)).toFixed(2)} GB</span> verfügbar
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
        )}

        {categoryDistribution.length > 0 && (
          <Card className="mb-8" data-testid="section-categories">
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
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border border-border rounded-md p-3 shadow-lg">
                            <p className="font-medium mb-1">{data.fullName}</p>
                            <p className="text-sm text-muted-foreground">Anzahl: {data.count}</p>
                          </div>
                        );
                      }
                      return null;
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

        <UnpaidInvoicesWidget />

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
          <div className="py-4">
            <DocumentGridSkeleton count={6} />
          </div>
        ) : formattedDocuments.length === 0 ? (
          <EmptyState
            title="Keine Dokumente gefunden"
            description={
              searchQuery 
                ? `Keine Dokumente für "${searchQuery}" gefunden.`
                : "Laden Sie Ihr erstes Dokument hoch, um loszulegen."
            }
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
                  {someSelected ? `${selectedDocuments.size} ausgewählt` : (allSelected ? "Alle abwählen" : "Alle auswählen")}
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
                    onFolderChange={(folderId) => handleFolderChange(doc.id, folderId)}
                    onPaymentStatusChange={(status) => handlePaymentStatusChange(doc.id, status)}
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
          </>
        )}

      <ProcessingModal
        open={processingModal.open}
        status={processingModal.status}
        progress={processingModal.progress}
        detectedCategory={processingModal.detectedCategory}
        totalFiles={processingModal.totalFiles}
        currentFile={processingModal.currentFile}
        onClose={() => {
          // Just close the modal, don't open the document
          setProcessingModal(prev => ({ ...prev, open: false }));
        }}
        onViewDocument={() => {
          // Close modal and open the document in viewer
          setProcessingModal(prev => ({ ...prev, open: false }));
          if (processingModal.uploadedDocumentId) {
            handleView(processingModal.uploadedDocumentId);
          }
        }}
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
        daysRemaining={upgradeModal.daysRemaining}
      />

      <CheckoutDialog
        open={checkoutDialogOpen}
        onClose={() => setCheckoutDialogOpen(false)}
        selectedPlan={selectedPlan}
        selectedPeriod={selectedPeriod}
      />

      <DuplicateWarningDialog
        open={duplicateWarning.open}
        duplicates={duplicateWarning.duplicates}
        onCancel={handleCancelDuplicateUpload}
        onUploadAnyway={handleUploadAnyway}
      />

      <DashboardFooter />
    </DashboardLayout>
  );
}
