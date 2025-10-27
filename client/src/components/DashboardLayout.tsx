import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Plus, ChevronDown, Camera, Settings, LogOut, Trash2, Shield, Download } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/SearchBar";
import { logout, getCurrentUser, getSubscriptionStatus, type SubscriptionStatus } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WelcomeModal } from "@/components/WelcomeModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import type { User } from "@shared/schema";
import logoImage from "@assets/meinedokbox_1760966015056.png";

interface DashboardLayoutProps {
  children: ReactNode;
  showSearch?: boolean;
  showExport?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onUploadClick?: (mode: "camera" | "file") => void;
  onExportClick?: () => void;
}

export function DashboardLayout({
  children,
  showSearch = false,
  showExport = false,
  searchQuery = "",
  onSearchChange,
  onUploadClick,
  onExportClick,
}: DashboardLayoutProps) {
  const { toast } = useToast();
  const [location] = useLocation();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Fetch user data
  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getCurrentUser,
    retry: false,
  });

  // Show welcome modal if user hasn't seen it yet
  useEffect(() => {
    if (user && !user.hasSeenWelcomeModal) {
      setShowWelcomeModal(true);
    }
  }, [user]);

  // Fetch subscription status
  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
    queryFn: getSubscriptionStatus,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60,
  });

  const isReadOnly = subscriptionStatus?.isReadOnly ?? false;
  const isUploadDisabled = isReadOnly;

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
  });

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-background border-b shrink-0">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 w-full">
            <div className="flex items-center justify-between md:justify-start gap-3 min-w-0">
              <Link href="/">
                <div 
                  className="hover-elevate active-elevate-2 rounded-lg transition-all cursor-pointer p-1"
                  data-testid="logo-link"
                >
                  <img src={logoImage} alt="MeineDokBox" className="h-12 md:h-16 shrink-0" data-testid="img-logo" />
                </div>
              </Link>
              <div className="flex items-center gap-2 md:hidden">
                {!isReadOnly && (
                  <Link href="/trash">
                    <Button 
                      variant={location === "/trash" ? "default" : "ghost"} 
                      size="sm" 
                      data-testid="button-trash-mobile"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link href="/settings">
                  <Button 
                    variant={location === "/settings" ? "default" : "ghost"} 
                    size="sm" 
                    data-testid="button-settings-mobile"
                  >
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
                      <Button size="sm" className="btn-upload-shimmer text-white border-green-700" data-testid="button-upload-menu-mobile">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onUploadClick?.("camera")} data-testid="menu-item-camera-scanner">
                        <Camera className="h-4 w-4 mr-2" />
                        Kamera-Scanner
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUploadClick?.("file")} data-testid="menu-item-multi-page">
                        <Plus className="h-4 w-4 mr-2" />
                        Datei hochladen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              {showSearch && (
                <SearchBar 
                  value={searchQuery} 
                  onChange={onSearchChange || (() => {})}
                />
              )}
            </div>
            
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {showExport && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onExportClick}
                  data-testid="button-export"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {!isReadOnly && (
                <Link href="/trash">
                  <Button 
                    variant={location === "/trash" ? "default" : "outline"} 
                    size="sm" 
                    data-testid="button-trash"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Papierkorb
                  </Button>
                </Link>
              )}
              <Link href="/settings">
                <Button 
                  variant={location === "/settings" ? "default" : "outline"} 
                  size="sm" 
                  data-testid="button-settings"
                >
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
                    <Button className="btn-upload-shimmer text-white border-green-700" data-testid="button-upload-menu">
                      <Plus className="h-4 w-4 mr-2" />
                      Hochladen
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onUploadClick?.("camera")} data-testid="menu-item-camera-scanner-desktop">
                      <Camera className="h-4 w-4 mr-2" />
                      Kamera-Scanner
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUploadClick?.("file")} data-testid="menu-item-multi-page-desktop">
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

      <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8">
        {children}
      </main>

      <WelcomeModal
        open={showWelcomeModal}
        onOpenChange={setShowWelcomeModal}
        onStartTrial={() => {
          setShowWelcomeModal(false);
        }}
        onDirectPayment={() => {
          setShowWelcomeModal(false);
          setShowUpgradeModal(true);
        }}
      />

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
