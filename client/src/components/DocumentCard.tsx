import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  MoreVertical, Sparkles, Lock, Users, User, Check, Folder, X,
  Download, Share2, Eye, Pencil, Tag, FolderInput, Trash2, CheckCircle2, DollarSign,
  Calendar, FileText, Euro
} from "lucide-react";
import { categoryConfig, allCategories, getCategoryBadgeClasses, getCategoryBorderColor } from "@shared/categories";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EditDocumentDialog } from "@/components/EditDocumentDialog";
import { SmartTagsDialog } from "@/components/SmartTagsDialog";

interface DocumentCardProps {
  id: string;
  title: string;
  category: string;
  date: string;
  thumbnailUrl?: string;
  isShared?: boolean;
  isUpdatingSharing?: boolean;
  onView?: () => void;
  onDelete?: () => void;
  onCategoryChange?: (category: string) => void;
  onSharingToggle?: (isShared: boolean) => void;
  onFolderChange?: (folderId: string | null) => void;
  // Phase 2: Smart metadata
  confidence?: number;
  extractedDate?: string;
  documentDate?: string;
  amount?: number;
  sender?: string;
  // Phase 3: Smart tags
  systemTags?: string[] | null;
  // Folder assignment
  folderId?: string | null;
  folderName?: string;
  folderIcon?: string;
  // Payment tracking
  paymentStatus?: 'paid' | 'unpaid' | 'not_applicable' | null;
  onPaymentStatusChange?: (status: 'paid' | 'unpaid' | 'not_applicable') => void;
}


export function DocumentCard({
  id,
  title,
  category,
  date,
  thumbnailUrl,
  isShared,
  isUpdatingSharing = false,
  onView,
  onDelete,
  onCategoryChange,
  onSharingToggle,
  onFolderChange,
  confidence,
  extractedDate,
  documentDate,
  amount,
  sender,
  systemTags,
  folderId,
  folderName,
  folderIcon,
  paymentStatus,
  onPaymentStatusChange,
}: DocumentCardProps) {
  // Handle null/undefined isShared values - default to false (private, not shared)
  const sharedStatus = isShared ?? false;
  
  const config = categoryConfig[category] || categoryConfig['Sonstiges / Privat'];
  const CategoryIcon = config.icon;
  
  // Mobile detection (under 768px)
  const [isMobile, setIsMobile] = useState(false);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [folderDrawerOpen, setFolderDrawerOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [smartTagsDialogOpen, setSmartTagsDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Fetch folders for folder assignment
  const { data: folders = [] } = useQuery<Array<{
    id: string;
    name: string;
    icon: string;
  }>>({
    queryKey: ['/api/folders'],
  });
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Helper function to format confidence
  const getConfidenceColor = (conf?: number) => {
    if (!conf) return 'bg-muted text-muted-foreground';
    if (conf >= 0.9) return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400';
    if (conf >= 0.7) return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400';
    return 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400';
  };

  const formatAmount = (amt?: number) => {
    if (!amt) return null;
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amt);
  };

  // Helper function to validate and format date
  const formatDocumentDate = (dateStr?: string) => {
    if (!dateStr) return null;
    
    // Try to create a Date object
    let date = new Date(dateStr);
    
    // If that fails, try parsing German format DD.MM.YYYY
    if (isNaN(date.getTime()) && dateStr.includes('.')) {
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        date = new Date(`${year}-${month}-${day}`);
      }
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date.toLocaleDateString('de-DE');
  };

  // Get the best available document date (prefer documentDate, fallback to extractedDate)
  const getDocumentDate = () => {
    return formatDocumentDate(documentDate) || formatDocumentDate(extractedDate);
  };

  // Download handler
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch(`/api/documents/${id}/download-url`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const data = await response.json();
      
      // Open download URL in new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Share handler with Web Share API fallback
  const handleShare = async () => {
    try {
      setIsSharing(true);
      const response = await fetch(`/api/documents/${id}/share-url`);
      
      if (!response.ok) {
        throw new Error('Share failed');
      }
      
      const data = await response.json();
      
      // Try native Web Share API first (works on mobile)
      if (navigator.share) {
        try {
          await navigator.share({
            title: title,
            text: `Dokument: ${title}`,
            url: data.url
          });
          return;
        } catch (shareError) {
          // User cancelled or share failed, fall through to clipboard
          if ((shareError as Error).name === 'AbortError') {
            return;
          }
        }
      }
      
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(data.url);
      alert('Link in Zwischenablage kopiert! (Gültig für 7 Tage)');
    } catch (error) {
      console.error('Share error:', error);
      alert('Fehler beim Teilen');
    } finally {
      setIsSharing(false);
    }
  };
  
  return (
    <>
    <Card 
      className={`relative cursor-pointer transition-all duration-200 border-l-4 ${getCategoryBorderColor(category)} hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5`}
      onClick={onView}
      data-testid={`card-document-${id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className={`${config.bgColor} rounded-lg p-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}>
            <CategoryIcon className={`h-8 w-8 ${config.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-base line-clamp-2 leading-snug" data-testid={`text-title-${id}`}>
                {title}
              </h3>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 flex-shrink-0"
                    data-testid={`button-menu-${id}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(); }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ansehen
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleDownload();
                    }}
                    disabled={isDownloading}
                    data-testid="menuitem-download"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isDownloading ? 'Lädt...' : 'Download'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleShare();
                    }}
                    disabled={isSharing}
                    data-testid="menuitem-share"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {isSharing ? 'Teilt...' : 'Teilen'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setEditDialogOpen(true);
                    }}
                    data-testid="menuitem-edit"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setSmartTagsDialogOpen(true);
                    }}
                    data-testid="menuitem-steuerrelevant"
                  >
                    <span className="mr-2">💰</span>
                    Steuerrelevant
                  </DropdownMenuItem>
                  
                  {/* Payment Status Toggle */}
                  {paymentStatus === 'unpaid' && (
                    <DropdownMenuItem 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onPaymentStatusChange?.('paid');
                      }}
                      data-testid="menuitem-mark-paid"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Als bezahlt markieren
                    </DropdownMenuItem>
                  )}
                  
                  {/* Category Change - Open Dialog or Drawer */}
                  <DropdownMenuItem 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (isMobile) {
                        setCategoryDrawerOpen(true);
                      } else {
                        setCategoryDialogOpen(true);
                      }
                    }}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Kategorie ändern
                  </DropdownMenuItem>
                  
                  {/* Folder Assignment - Open Dialog or Drawer */}
                  <DropdownMenuItem 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (isMobile) {
                        setFolderDrawerOpen(true);
                      } else {
                        setFolderDialogOpen(true);
                      }
                    }}
                  >
                    <FolderInput className="h-4 w-4 mr-2" />
                    Ordner zuweisen
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="text-destructive" 
                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`${getCategoryBadgeClasses(category)} text-xs w-fit`}
                  data-testid={`badge-category-${id}`}
                >
                  {category}
                </Badge>
                
                {confidence && (
                  <Badge 
                    variant="outline"
                    className={`${getConfidenceColor(confidence)} text-xs w-fit`}
                    data-testid={`badge-confidence-${id}`}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {Math.round(confidence * 100)}% KI
                  </Badge>
                )}
                
                {folderId && folderName && (
                  <Badge variant="outline" className="gap-1 pr-1 group" data-testid={`badge-folder-${id}`}>
                    <span>{folderIcon || '📁'}</span>
                    <span className="text-xs">{folderName}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFolderChange?.(null);
                      }}
                      className="ml-1 hover:bg-accent rounded-sm p-0.5 transition-colors"
                      data-testid={`button-remove-folder-${id}`}
                      aria-label="Aus Ordner entfernen"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {paymentStatus === 'unpaid' && (
                  <Badge 
                    variant="outline" 
                    className="gap-1 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400 text-xs w-fit"
                    data-testid={`badge-unpaid-${id}`}
                  >
                    <DollarSign className="h-3 w-3" />
                    Unbezahlt
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span data-testid={`text-date-${id}`}>{date}</span>
                </div>
                
                {getDocumentDate() && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span data-testid={`text-document-date-${id}`}>
                      Dok: {getDocumentDate()}
                    </span>
                  </div>
                )}
                
                {amount !== undefined && amount !== null && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Euro className="h-4 w-4 flex-shrink-0" />
                    <span data-testid={`text-amount-${id}`} className="font-medium">
                      {formatAmount(amount)}
                    </span>
                  </div>
                )}
                
                {sender && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span data-testid={`text-sender-${id}`} className="truncate">
                      {sender}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {/* Sharing toggle - bottom right */}
      <div className="absolute bottom-3 right-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={isUpdatingSharing}
          onClick={(e) => {
            e.stopPropagation();
            if (onSharingToggle && !isUpdatingSharing) {
              onSharingToggle(!sharedStatus);
            }
          }}
          data-testid={`button-sharing-${id}`}
          title={sharedStatus ? "Geteilt mit Partner" : "Privat (nur Sie)"}
        >
          {sharedStatus ? (
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-500" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </Card>
    
    {/* Mobile Category Drawer */}
    {isMobile && (
      <Drawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Kategorie ändern</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              {allCategories.map((cat) => {
                const catConfig = categoryConfig[cat] || categoryConfig['Sonstiges / Privat'];
                const CatIcon = catConfig.icon;
                const isSelected = cat === category;
                
                return (
                  <Button
                    key={cat}
                    variant={isSelected ? "default" : "outline"}
                    className="h-auto py-4 px-4 justify-start gap-3 text-left"
                    onClick={() => {
                      if (cat !== category) {
                        onCategoryChange?.(cat);
                      }
                      setCategoryDrawerOpen(false);
                    }}
                    data-testid={`drawer-category-${cat}`}
                  >
                    <div className={`${catConfig.bgColor} rounded-lg p-2 flex-shrink-0`}>
                      <CatIcon className={`h-5 w-5 ${catConfig.color}`} />
                    </div>
                    <span className="flex-1 font-medium">{cat}</span>
                    {isSelected && <Check className="h-5 w-5 flex-shrink-0" />}
                  </Button>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    )}
    
    {/* Mobile Folder Drawer */}
    {isMobile && (
      <Drawer open={folderDrawerOpen} onOpenChange={setFolderDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Ordner zuweisen</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              {/* No Folder Option */}
              <Button
                variant={!folderId ? "default" : "outline"}
                className="h-auto py-4 px-4 justify-start gap-3 text-left"
                onClick={() => {
                  onFolderChange?.(null);
                  setFolderDrawerOpen(false);
                }}
                data-testid="drawer-folder-none"
              >
                <div className="bg-muted rounded-lg p-2 flex-shrink-0">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="flex-1 font-medium">Kein Ordner</span>
                {!folderId && <Check className="h-5 w-5 flex-shrink-0" />}
              </Button>
              
              {/* Folder Options */}
              {folders.map((folder) => {
                const isSelected = folder.id === folderId;
                
                return (
                  <Button
                    key={folder.id}
                    variant={isSelected ? "default" : "outline"}
                    className="h-auto py-4 px-4 justify-start gap-3 text-left"
                    onClick={() => {
                      if (folder.id !== folderId) {
                        onFolderChange?.(folder.id);
                      }
                      setFolderDrawerOpen(false);
                    }}
                    data-testid={`drawer-folder-${folder.id}`}
                  >
                    <div className="text-3xl flex-shrink-0">
                      {folder.icon}
                    </div>
                    <span className="flex-1 font-medium">{folder.name}</span>
                    {isSelected && <Check className="h-5 w-5 flex-shrink-0" />}
                  </Button>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    )}
    
    {/* Edit Document Dialog */}
    <EditDocumentDialog 
      document={{
        id,
        title,
        category,
        documentDate: documentDate ? new Date(documentDate) : null,
        amount: amount ?? null,
        sender: sender ?? null,
        userId: '',
        folderId: folderId ?? null,
        extractedText: '',
        fileUrl: null,
        pageUrls: null,
        thumbnailUrl: null,
        mimeType: null,
        confidence: confidence || 0,
        isShared: isShared || false,
        uploadedAt: new Date(date),
        deletedAt: null,
        extractedDate: extractedDate ? new Date(extractedDate) : null,
        year: null,
        systemTags: systemTags ?? null,
      }}
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
    />
    
    {/* Smart Tags Dialog */}
    <SmartTagsDialog 
      document={{
        id,
        title,
        category,
        documentDate: documentDate ? new Date(documentDate) : null,
        amount: amount ?? null,
        sender: sender ?? null,
        userId: '',
        folderId: folderId ?? null,
        extractedText: '',
        fileUrl: null,
        pageUrls: null,
        thumbnailUrl: null,
        mimeType: null,
        confidence: confidence || 0,
        isShared: isShared || false,
        uploadedAt: new Date(date),
        deletedAt: null,
        extractedDate: extractedDate ? new Date(extractedDate) : null,
        year: null,
        systemTags: systemTags ?? null,
      }}
      open={smartTagsDialogOpen}
      onOpenChange={setSmartTagsDialogOpen}
    />
    
    {/* Desktop Category Dialog */}
    {!isMobile && (
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Kategorie ändern</DialogTitle>
            <DialogDescription>Wählen Sie eine passende Kategorie für Ihr Dokument.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid gap-2">
              {allCategories.map((cat) => {
                const catConfig = categoryConfig[cat] || categoryConfig['Sonstiges / Privat'];
                const CatIcon = catConfig.icon;
                const isSelected = cat === category;
                
                return (
                  <Button
                    key={cat}
                    variant={isSelected ? "default" : "outline"}
                    className="h-auto py-4 px-4 justify-start gap-3 text-left"
                    onClick={() => {
                      if (cat !== category) {
                        onCategoryChange?.(cat);
                      }
                      setCategoryDialogOpen(false);
                    }}
                    data-testid={`dialog-category-${cat}`}
                  >
                    <div className={`${catConfig.bgColor} rounded-lg p-2 flex-shrink-0`}>
                      <CatIcon className={`h-5 w-5 ${catConfig.color}`} />
                    </div>
                    <span className="flex-1 font-medium">{cat}</span>
                    {isSelected && <Check className="h-5 w-5 flex-shrink-0" />}
                  </Button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
    
    {/* Desktop Folder Dialog */}
    {!isMobile && (
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ordner zuweisen</DialogTitle>
            <DialogDescription>Weisen Sie das Dokument einem Ordner zu oder lassen Sie es ohne Ordner.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid gap-2">
              {/* No Folder Option */}
              <Button
                variant={!folderId ? "default" : "outline"}
                className="h-auto py-4 px-4 justify-start gap-3 text-left"
                onClick={() => {
                  onFolderChange?.(null);
                  setFolderDialogOpen(false);
                }}
                data-testid="dialog-folder-none"
              >
                <div className="bg-muted rounded-lg p-2 flex-shrink-0">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="flex-1 font-medium">Kein Ordner</span>
                {!folderId && <Check className="h-5 w-5 flex-shrink-0" />}
              </Button>
              
              {/* Folder Options */}
              {folders.map((folder) => {
                const isSelected = folder.id === folderId;
                
                return (
                  <Button
                    key={folder.id}
                    variant={isSelected ? "default" : "outline"}
                    className="h-auto py-4 px-4 justify-start gap-3 text-left"
                    onClick={() => {
                      if (folder.id !== folderId) {
                        onFolderChange?.(folder.id);
                      }
                      setFolderDialogOpen(false);
                    }}
                    data-testid={`dialog-folder-${folder.id}`}
                  >
                    <div className="text-3xl flex-shrink-0">
                      {folder.icon}
                    </div>
                    <span className="flex-1 font-medium">{folder.name}</span>
                    {isSelected && <Check className="h-5 w-5 flex-shrink-0" />}
                  </Button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
  </>
  );
}
