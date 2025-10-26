import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, Calendar, MoreVertical, Euro, FileSignature, Shield, Mail, FileQuestion,
  Landmark, Receipt, Briefcase, FileCheck, Building2, Stethoscope, Home, Car, 
  GraduationCap, Baby, PiggyBank, ShoppingBag, Plane, User, Sparkles, Lock, Users, Check, Folder, X
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

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
  // Folder assignment
  folderId?: string | null;
  folderName?: string;
  folderIcon?: string;
}

const categoryConfig: Record<string, { icon: typeof Euro; color: string; bgColor: string }> = {
  'Finanzen & Banken': { 
    icon: Landmark, 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950'
  },
  'Versicherungen': { 
    icon: Shield, 
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950'
  },
  'Steuern & Buchhaltung': { 
    icon: Euro, 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950'
  },
  'Arbeit & Gehalt': { 
    icon: Briefcase, 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950'
  },
  'Verträge & Abos': { 
    icon: FileSignature, 
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950'
  },
  'Behörden & Amtliches': { 
    icon: Building2, 
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-900'
  },
  'Gesundheit & Arzt': { 
    icon: Stethoscope, 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950'
  },
  'Wohnen & Immobilien': { 
    icon: Home, 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950'
  },
  'Auto & Mobilität': { 
    icon: Car, 
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950'
  },
  'Schule & Ausbildung': { 
    icon: GraduationCap, 
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950'
  },
  'Familie & Kinder': { 
    icon: Baby, 
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-950'
  },
  'Rente & Vorsorge': { 
    icon: PiggyBank, 
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950'
  },
  'Einkäufe & Online-Bestellungen': { 
    icon: ShoppingBag, 
    color: 'text-lime-600 dark:text-lime-400',
    bgColor: 'bg-lime-50 dark:bg-lime-950'
  },
  'Reisen & Freizeit': { 
    icon: Plane, 
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-50 dark:bg-sky-950'
  },
  'Sonstiges / Privat': { 
    icon: FileQuestion, 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
};

const categoryColors: Record<string, string> = {
  'Finanzen & Banken': 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  'Versicherungen': 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  'Steuern & Buchhaltung': 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'Arbeit & Gehalt': 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  'Verträge & Abos': 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  'Behörden & Amtliches': 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  'Gesundheit & Arzt': 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  'Wohnen & Immobilien': 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  'Auto & Mobilität': 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
  'Schule & Ausbildung': 'bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  'Familie & Kinder': 'bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800',
  'Rente & Vorsorge': 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  'Einkäufe & Online-Bestellungen': 'bg-lime-50 dark:bg-lime-950 text-lime-600 dark:text-lime-400 border-lime-200 dark:border-lime-800',
  'Reisen & Freizeit': 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  'Sonstiges / Privat': 'bg-muted text-muted-foreground border-border',
};

const allCategories = [
  'Finanzen & Banken',
  'Versicherungen',
  'Steuern & Buchhaltung',
  'Arbeit & Gehalt',
  'Verträge & Abos',
  'Behörden & Amtliches',
  'Gesundheit & Arzt',
  'Wohnen & Immobilien',
  'Auto & Mobilität',
  'Schule & Ausbildung',
  'Familie & Kinder',
  'Rente & Vorsorge',
  'Einkäufe & Online-Bestellungen',
  'Reisen & Freizeit',
  'Sonstiges / Privat'
];

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
  folderId,
  folderName,
  folderIcon,
}: DocumentCardProps) {
  // Handle null/undefined isShared values - default to false (private, not shared)
  const sharedStatus = isShared ?? false;
  
  const config = categoryConfig[category] || categoryConfig['Sonstiges / Privat'];
  const CategoryIcon = config.icon;
  
  // Mobile detection (under 768px)
  const [isMobile, setIsMobile] = useState(false);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [folderDrawerOpen, setFolderDrawerOpen] = useState(false);
  
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
    const date = new Date(dateStr);
    
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
  
  return (
    <>
    <Card 
      className="relative hover-elevate cursor-pointer transition-all" 
      onClick={onView}
      data-testid={`card-document-${id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className={`${config.bgColor} rounded-lg p-3 flex-shrink-0`}>
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
                    Ansehen
                  </DropdownMenuItem>
                  
                  {/* Mobile: Show drawer trigger instead of submenu */}
                  {isMobile ? (
                    <DropdownMenuItem 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setCategoryDrawerOpen(true);
                      }}
                    >
                      Kategorie ändern
                    </DropdownMenuItem>
                  ) : (
                    /* Desktop: Dropdown with scrolling */
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                        Kategorie ändern
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-[400px] overflow-y-auto">
                        {allCategories.map((cat) => (
                          <DropdownMenuItem
                            key={cat}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (cat !== category) {
                                onCategoryChange?.(cat);
                              }
                            }}
                            disabled={cat === category}
                            data-testid={`menuitem-category-${cat}`}
                          >
                            {cat}
                            {cat === category && " ✓"}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}
                  
                  {/* Folder Assignment */}
                  {isMobile ? (
                    <DropdownMenuItem 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setFolderDrawerOpen(true);
                      }}
                    >
                      Ordner zuweisen
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                        Ordner zuweisen
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-[400px] overflow-y-auto">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onFolderChange?.(null);
                          }}
                          disabled={!folderId}
                          data-testid="menuitem-folder-none"
                        >
                          Kein Ordner
                          {!folderId && " ✓"}
                        </DropdownMenuItem>
                        {folders.map((folder) => (
                          <DropdownMenuItem
                            key={folder.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (folder.id !== folderId) {
                                onFolderChange?.(folder.id);
                              }
                            }}
                            disabled={folder.id === folderId}
                            data-testid={`menuitem-folder-${folder.id}`}
                          >
                            {folder.icon} {folder.name}
                            {folder.id === folderId && " ✓"}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}
                  
                  <DropdownMenuItem 
                    className="text-destructive" 
                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                  >
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`${categoryColors[category] || categoryColors['Sonstiges']} text-xs w-fit`}
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
  </>
  );
}
