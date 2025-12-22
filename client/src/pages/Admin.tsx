import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User, Trash2, Search, Home, Shield, AlertTriangle, Lightbulb, PlayCircle, Plus, Edit2, Save, X, BarChart3, Users, CreditCard, TrendingUp, FileText, HardDrive, Gift, UserPlus, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import logoImage from "@assets/meinedokbox_1760966015056.png";
import type { User as UserType, FeatureRequest, VideoTutorial } from "@shared/schema";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface MarketingChannel {
  source: string;
  registrations: number;
  verified: number;
  paying: number;
  conversionRate: string;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  churnedReferrals: number;
  totalBonusStorageGB: number;
  usersWithFreeFromReferrals: number;
  topReferrers: {
    email: string;
    name: string;
    referralCount: number;
    activeCount: number;
    freeFromReferrals: boolean;
  }[];
}

interface AdminStatistics {
  totalUsers: number;
  verifiedUsers: number;
  payingCustomers: number;
  usersByPlan: {
    trial: number;
    free: number;
    solo: number;
    family: number;
    familyPlus: number;
  };
  registrationsLast30Days: number;
  registrationsLast7Days: number;
  registrationsToday: number;
  verificationRate: string;
  purchaseRate: string;
  overallConversionRate: string;
  totalStorageUsedGB: string;
  totalDocuments: number;
  dailyRegistrations: { date: string; count: number }[];
  marketingChannels: MarketingChannel[];
  referralStats?: ReferralStats;
}

interface UserWithStats extends UserType {
  documentCount: number;
  storageUsed: number;
}

interface SubscriptionData {
  userId: number;
  email: string;
  name: string;
  plan: string;
  interval: string;
  amount: number;
  currency: string;
  status: string;
  startDate: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionsResponse {
  subscriptions: SubscriptionData[];
  revenue: {
    mrr: number;
    arr: number;
    totalActive: number;
    totalCanceling: number;
    paymentsNext7Days: { count: number; amount: number };
    paymentsNext30Days: { count: number; amount: number };
  };
}

const TUTORIAL_CATEGORIES = ["Upload", "Ordner", "Suche", "Einstellungen", "Tags", "E-Mail", "Teilen"] as const;
const FEATURE_STATUS_OPTIONS = ["pending", "approved", "planned", "in_progress", "completed", "rejected"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Ausstehend",
  approved: "Genehmigt",
  planned: "Geplant",
  in_progress: "In Arbeit",
  completed: "Abgeschlossen",
  rejected: "Abgelehnt",
};

export default function Admin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("statistics");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: UserWithStats | null }>({
    open: false,
    user: null,
  });
  const [deleteFeatureDialog, setDeleteFeatureDialog] = useState<{ open: boolean; feature: FeatureRequest | null }>({
    open: false,
    feature: null,
  });
  const [deleteTutorialDialog, setDeleteTutorialDialog] = useState<{ open: boolean; tutorial: VideoTutorial | null }>({
    open: false,
    tutorial: null,
  });
  const [editingAdminNote, setEditingAdminNote] = useState<{ id: string; note: string } | null>(null);
  const [editingBaseVotes, setEditingBaseVotes] = useState<{ id: string; votes: number } | null>(null);
  const [tutorialDialog, setTutorialDialog] = useState<{ open: boolean; tutorial: VideoTutorial | null }>({
    open: false,
    tutorial: null,
  });
  const [tutorialForm, setTutorialForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    category: "Upload",
    sortOrder: 0,
    isPublished: true,
  });

  // Check admin authentication status
  const { data: adminStatus, isLoading: checkingAuth } = useQuery<{
    isAdminEmail: boolean;
    isAdminAuthenticated: boolean;
    requiresLogin: boolean;
  }>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  // Redirect to admin login if not authenticated
  useEffect(() => {
    if (!checkingAuth && adminStatus?.requiresLogin) {
      setLocation("/admin/login");
    }
  }, [adminStatus, checkingAuth, setLocation]);

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<UserWithStats[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
    enabled: adminStatus?.isAdminAuthenticated === true,
  });

  // Fetch feature requests
  const { data: featureRequests = [], isLoading: loadingFeatures } = useQuery<FeatureRequest[]>({
    queryKey: ["/api/admin/feature-requests"],
    retry: false,
    enabled: adminStatus?.isAdminAuthenticated === true,
  });

  // Fetch video tutorials
  const { data: videoTutorials = [], isLoading: loadingTutorials } = useQuery<VideoTutorial[]>({
    queryKey: ["/api/admin/video-tutorials"],
    retry: false,
    enabled: adminStatus?.isAdminAuthenticated === true,
  });

  // Fetch statistics
  const { data: statistics, isLoading: loadingStatistics } = useQuery<AdminStatistics>({
    queryKey: ["/api/admin/statistics"],
    retry: false,
    enabled: adminStatus?.isAdminAuthenticated === true,
  });

  // Fetch subscriptions from Stripe
  const { data: subscriptionsData, isLoading: loadingSubscriptions } = useQuery<SubscriptionsResponse>({
    queryKey: ["/api/admin/subscriptions"],
    retry: false,
    enabled: adminStatus?.isAdminAuthenticated === true,
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Fehler beim Löschen des Users");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeleteDialog({ open: false, user: null });
      toast({
        title: "User gelöscht",
        description: "Der User wurde erfolgreich entfernt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Benutzer konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  // Update user plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Fehler beim Ändern des Plans");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Plan geändert",
        description: `Der Plan wurde erfolgreich auf ${getPlanDisplayName(variables.plan)} geändert.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Der Plan konnte nicht geändert werden.",
        variant: "destructive",
      });
    },
  });

  // Update feature request mutation
  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; isPublished?: boolean; adminNote?: string; baseVotes?: number }) => {
      const response = await fetch(`/api/admin/feature-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Fehler beim Aktualisieren");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-requests"] });
      setEditingAdminNote(null);
      toast({ title: "Gespeichert", description: "Feature Request wurde aktualisiert." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Konnte nicht gespeichert werden.", variant: "destructive" });
    },
  });

  // Delete feature request mutation
  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/feature-requests/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Fehler beim Löschen");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-requests"] });
      setDeleteFeatureDialog({ open: false, feature: null });
      toast({ title: "Gelöscht", description: "Feature Request wurde entfernt." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Konnte nicht gelöscht werden.", variant: "destructive" });
    },
  });

  // Create/Update tutorial mutation
  const saveTutorialMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id?: string; title: string; description?: string; videoUrl: string; thumbnailUrl?: string; category: string; sortOrder: number; isPublished: boolean }) => {
      const url = id ? `/api/admin/video-tutorials/${id}` : "/api/admin/video-tutorials";
      const method = id ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Fehler beim Speichern");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/video-tutorials"] });
      setTutorialDialog({ open: false, tutorial: null });
      resetTutorialForm();
      toast({ title: "Gespeichert", description: "Video Tutorial wurde gespeichert." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Konnte nicht gespeichert werden.", variant: "destructive" });
    },
  });

  // Delete tutorial mutation
  const deleteTutorialMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/video-tutorials/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Fehler beim Löschen");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/video-tutorials"] });
      setDeleteTutorialDialog({ open: false, tutorial: null });
      toast({ title: "Gelöscht", description: "Video Tutorial wurde entfernt." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Konnte nicht gelöscht werden.", variant: "destructive" });
    },
  });

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query)
    );
  });

  const getPlanDisplayName = (plan: string) => {
    const planNames: Record<string, string> = {
      trial: "Trial",
      free: "Free",
      solo: "Solo",
      family: "Family",
      "family-plus": "Family Plus",
    };
    return planNames[plan] || plan;
  };

  const handlePlanChange = (userId: string, newPlan: string) => {
    updatePlanMutation.mutate({ userId, plan: newPlan });
  };

  const handleDeleteClick = (user: UserWithStats) => {
    setDeleteDialog({ open: true, user });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.user) {
      deleteMutation.mutate(deleteDialog.user.id);
    }
  };

  const resetTutorialForm = () => {
    setTutorialForm({
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      category: "Upload",
      sortOrder: 0,
      isPublished: true,
    });
  };

  const openTutorialDialog = (tutorial?: VideoTutorial) => {
    if (tutorial) {
      setTutorialForm({
        title: tutorial.title,
        description: tutorial.description || "",
        videoUrl: tutorial.videoUrl,
        thumbnailUrl: tutorial.thumbnailUrl || "",
        category: tutorial.category,
        sortOrder: tutorial.sortOrder,
        isPublished: tutorial.isPublished,
      });
      setTutorialDialog({ open: true, tutorial });
    } else {
      resetTutorialForm();
      setTutorialDialog({ open: true, tutorial: null });
    }
  };

  const handleSaveTutorial = () => {
    if (!tutorialForm.title || !tutorialForm.videoUrl) {
      toast({ title: "Fehler", description: "Titel und Video-URL sind erforderlich.", variant: "destructive" });
      return;
    }
    saveTutorialMutation.mutate({
      id: tutorialDialog.tutorial?.id,
      ...tutorialForm,
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Authentifizierung wird überprüft...</p>
      </div>
    );
  }

  // Don't render if user needs to login (will redirect)
  if (adminStatus?.requiresLogin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logoImage} alt="MeineDokBox" className="h-12 md:h-16" data-testid="img-logo" />
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="text-xl md:text-2xl font-bold">Admin-Bereich</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5" data-testid="admin-tabs">
            <TabsTrigger value="statistics" className="flex items-center gap-2" data-testid="tab-statistics">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Statistiken</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2" data-testid="tab-subscriptions">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Abos & Umsatz</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2" data-testid="tab-users">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Benutzer</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2" data-testid="tab-features">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="flex items-center gap-2" data-testid="tab-tutorials">
              <PlayCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Tutorials</span>
            </TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            {loadingStatistics ? (
              <div className="text-center py-8 text-muted-foreground">Lädt Statistiken...</div>
            ) : statistics ? (
              <div className="space-y-6">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Registrierte Nutzer</p>
                          <p className="text-3xl font-bold" data-testid="stat-total-users">{statistics.totalUsers}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {statistics.verifiedUsers} verifiziert ({statistics.verificationRate}%)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-500/10">
                          <CreditCard className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Zahlende Kunden</p>
                          <p className="text-3xl font-bold" data-testid="stat-paying-customers">{statistics.payingCustomers}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {statistics.purchaseRate}% Kaufrate
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-500/10">
                          <TrendingUp className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Registrierungen (30 Tage)</p>
                          <p className="text-3xl font-bold" data-testid="stat-registrations-30d">{statistics.registrationsLast30Days}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {statistics.registrationsToday} heute, {statistics.registrationsLast7Days} letzte 7 Tage
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-purple-500/10">
                          <HardDrive className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Speicher / Dokumente</p>
                          <p className="text-3xl font-bold" data-testid="stat-storage">{statistics.totalStorageUsedGB} GB</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {statistics.totalDocuments} Dokumente gesamt
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Conversion Funnel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Conversion Funnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 text-center p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Registrierungen</p>
                        <p className="text-2xl font-bold">{statistics.totalUsers}</p>
                      </div>
                      <div className="text-2xl text-muted-foreground">→</div>
                      <div className="flex-1 text-center p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Verifiziert</p>
                        <p className="text-2xl font-bold">{statistics.verifiedUsers}</p>
                        <p className="text-xs text-green-500">{statistics.verificationRate}%</p>
                      </div>
                      <div className="text-2xl text-muted-foreground">→</div>
                      <div className="flex-1 text-center p-4 border rounded-lg bg-green-500/5">
                        <p className="text-sm text-muted-foreground mb-1">Gekauft</p>
                        <p className="text-2xl font-bold text-green-600">{statistics.payingCustomers}</p>
                        <p className="text-xs text-green-500">{statistics.overallConversionRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Registrations Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Registrierungen (letzte 30 Tage)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={statistics.dailyRegistrations}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 10 }}
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getDate()}.${date.getMonth() + 1}`;
                              }}
                            />
                            <YAxis allowDecimals={false} />
                            <Tooltip 
                              labelFormatter={(value) => {
                                const date = new Date(value);
                                return format(date, "dd. MMMM yyyy", { locale: de });
                              }}
                              formatter={(value: number) => [value, "Registrierungen"]}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="count" 
                              stroke="hsl(var(--primary))" 
                              fill="hsl(var(--primary) / 0.2)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Plan Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Verteilung nach Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Trial", value: statistics.usersByPlan.trial, color: "#f59e0b" },
                                { name: "Free", value: statistics.usersByPlan.free, color: "#6b7280" },
                                { name: "Solo", value: statistics.usersByPlan.solo, color: "#3b82f6" },
                                { name: "Family", value: statistics.usersByPlan.family, color: "#8b5cf6" },
                                { name: "Family Plus", value: statistics.usersByPlan.familyPlus, color: "#10b981" },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
                            >
                              {[
                                { name: "Trial", value: statistics.usersByPlan.trial, color: "#f59e0b" },
                                { name: "Free", value: statistics.usersByPlan.free, color: "#6b7280" },
                                { name: "Solo", value: statistics.usersByPlan.solo, color: "#3b82f6" },
                                { name: "Family", value: statistics.usersByPlan.family, color: "#8b5cf6" },
                                { name: "Family Plus", value: statistics.usersByPlan.familyPlus, color: "#10b981" },
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number, name: string) => [value, name]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500" />
                          <span className="text-sm">Trial ({statistics.usersByPlan.trial})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gray-500" />
                          <span className="text-sm">Free ({statistics.usersByPlan.free})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="text-sm">Solo ({statistics.usersByPlan.solo})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                          <span className="text-sm">Family ({statistics.usersByPlan.family})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-sm">Family Plus ({statistics.usersByPlan.familyPlus})</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Marketing Channels */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Marketing-Kanäle
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {statistics.marketingChannels && statistics.marketingChannels.length > 0 ? (
                        <div className="space-y-3">
                          {statistics.marketingChannels.map((channel) => (
                            <div key={channel.source} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  channel.source === 'google' ? 'bg-red-500' :
                                  channel.source === 'facebook' ? 'bg-blue-600' :
                                  channel.source === 'instagram' ? 'bg-pink-500' :
                                  channel.source === 'tiktok' ? 'bg-black' :
                                  channel.source === 'linkedin' ? 'bg-blue-700' :
                                  'bg-gray-400'
                                }`} />
                                <span className="font-medium capitalize">{channel.source}</span>
                              </div>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-center">
                                  <div className="font-bold">{channel.registrations}</div>
                                  <div className="text-muted-foreground text-xs">Registr.</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold">{channel.verified}</div>
                                  <div className="text-muted-foreground text-xs">Verifiziert</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-green-600">{channel.paying}</div>
                                  <div className="text-muted-foreground text-xs">Zahlend</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-primary">{channel.conversionRate}%</div>
                                  <div className="text-muted-foreground text-xs">Conv.</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Noch keine Marketing-Daten verfügbar. Nutze UTM-Parameter in deinen Werbelinks.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Referral Program Stats */}
                  {statistics.referralStats && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Gift className="h-5 w-5 text-purple-500" />
                          Empfehlungsprogramm
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Overview Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {statistics.referralStats.totalReferrals}
                            </div>
                            <div className="text-xs text-muted-foreground">Gesamt Empfehlungen</div>
                          </div>
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {statistics.referralStats.activeReferrals}
                            </div>
                            <div className="text-xs text-muted-foreground">Aktive (Zahlend)</div>
                          </div>
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {statistics.referralStats.pendingReferrals}
                            </div>
                            <div className="text-xs text-muted-foreground">Ausstehend (Trial)</div>
                          </div>
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <div className="text-2xl font-bold text-gray-500">
                              {statistics.referralStats.churnedReferrals}
                            </div>
                            <div className="text-xs text-muted-foreground">Abgewandert</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {statistics.referralStats.totalBonusStorageGB} GB
                            </div>
                            <div className="text-xs text-muted-foreground">Bonus-Speicher vergeben</div>
                          </div>
                          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-center">
                            <div className="text-2xl font-bold text-amber-600 flex items-center justify-center gap-1">
                              <Crown className="h-5 w-5" />
                              {statistics.referralStats.usersWithFreeFromReferrals}
                            </div>
                            <div className="text-xs text-muted-foreground">Nutzer mit kostenlosem Plan</div>
                          </div>
                        </div>

                        {/* Top Referrers */}
                        {statistics.referralStats.topReferrers.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <UserPlus className="h-4 w-4" />
                              Top Empfehler
                            </h4>
                            <div className="space-y-2">
                              {statistics.referralStats.topReferrers.map((referrer, index) => (
                                <div key={referrer.email} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      index === 0 ? 'bg-yellow-500 text-white' :
                                      index === 1 ? 'bg-gray-400 text-white' :
                                      index === 2 ? 'bg-amber-700 text-white' :
                                      'bg-muted text-muted-foreground'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <div>
                                      <div className="font-medium flex items-center gap-2">
                                        {referrer.name || referrer.email}
                                        {referrer.freeFromReferrals && (
                                          <Crown className="h-4 w-4 text-amber-500" />
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{referrer.email}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="text-center">
                                      <div className="font-bold text-purple-600">{referrer.referralCount}</div>
                                      <div className="text-muted-foreground text-xs">Gesamt</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-bold text-green-600">{referrer.activeCount}</div>
                                      <div className="text-muted-foreground text-xs">Aktiv</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : null}
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            {loadingSubscriptions ? (
              <div className="text-center py-8 text-muted-foreground">Lädt Abonnement-Daten von Stripe...</div>
            ) : subscriptionsData ? (
              <div className="space-y-6">
                {/* Revenue Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-500/10">
                          <TrendingUp className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">MRR (monatl.)</p>
                          <p className="text-3xl font-bold" data-testid="stat-mrr">
                            {subscriptionsData.revenue.mrr.toFixed(2)} €
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {subscriptionsData.revenue.totalActive} aktive Abos
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-500/10">
                          <BarChart3 className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ARR (jährl.)</p>
                          <p className="text-3xl font-bold" data-testid="stat-arr">
                            {subscriptionsData.revenue.arr.toFixed(2)} €
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Hochrechnung auf 12 Monate
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-orange-500/10">
                          <CreditCard className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Nächste 7 Tage</p>
                          <p className="text-3xl font-bold" data-testid="stat-next7days">
                            {subscriptionsData.revenue.paymentsNext7Days.amount.toFixed(2)} €
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {subscriptionsData.revenue.paymentsNext7Days.count} Zahlung(en) fällig
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-purple-500/10">
                          <AlertTriangle className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Kündigungen</p>
                          <p className="text-3xl font-bold" data-testid="stat-canceling">
                            {subscriptionsData.revenue.totalCanceling}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            läuft zum Periodenende aus
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Subscriptions Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Alle Abonnements ({subscriptionsData.subscriptions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscriptionsData.subscriptions.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">Keine aktiven Abonnements</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Kunde</TableHead>
                              <TableHead>Plan</TableHead>
                              <TableHead>Intervall</TableHead>
                              <TableHead>Betrag</TableHead>
                              <TableHead>Kaufdatum</TableHead>
                              <TableHead>Nächste Zahlung</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subscriptionsData.subscriptions.map((sub) => (
                              <TableRow key={sub.userId} data-testid={`row-subscription-${sub.userId}`}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{sub.name}</p>
                                    <p className="text-xs text-muted-foreground">{sub.email}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    sub.plan === 'family-plus' ? 'default' : 
                                    sub.plan === 'family' ? 'secondary' : 'outline'
                                  }>
                                    {sub.plan === 'solo' ? 'Solo' : 
                                     sub.plan === 'family' ? 'Family' : 
                                     sub.plan === 'family-plus' ? 'Family+' : sub.plan}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={sub.interval === 'jährlich' ? 'default' : 'outline'}>
                                    {sub.interval}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {sub.amount.toFixed(2)} {sub.currency}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(sub.startDate), 'dd.MM.yyyy', { locale: de })}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {format(new Date(sub.currentPeriodEnd), 'dd.MM.yyyy', { locale: de })}
                                    {new Date(sub.currentPeriodEnd) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                                      <Badge variant="destructive" className="text-xs">bald</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {sub.cancelAtPeriodEnd ? (
                                    <Badge variant="destructive">Gekündigt</Badge>
                                  ) : sub.status === 'active' ? (
                                    <Badge className="bg-green-500">Aktiv</Badge>
                                  ) : sub.status === 'trialing' ? (
                                    <Badge variant="secondary">Trial</Badge>
                                  ) : (
                                    <Badge variant="outline">{sub.status}</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Keine Daten verfügbar</div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Benutzerverwaltung
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 md:w-80">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Suche nach Name, E-Mail oder ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                        data-testid="input-search-users"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Lädt Benutzer...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "Keine Benutzer gefunden" : "Keine Benutzer vorhanden"}
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>E-Mail</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead className="text-right">Dokumente</TableHead>
                          <TableHead className="text-right">Speicher</TableHead>
                          <TableHead>Registriert</TableHead>
                          <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                            <TableCell className="font-medium">
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-mono text-sm">{user.email}</span>
                                {!user.isVerified && (
                                  <Badge variant="outline" className="w-fit mt-1 text-xs">
                                    Unverifiziert
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.subscriptionPlan || "free"}
                                onValueChange={(value) => handlePlanChange(user.id, value)}
                                disabled={updatePlanMutation.isPending}
                              >
                                <SelectTrigger className="w-36" data-testid={`select-plan-${user.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="trial">Trial</SelectItem>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="solo">Solo</SelectItem>
                                  <SelectItem value="family">Family</SelectItem>
                                  <SelectItem value="family-plus">Family Plus</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">{user.documentCount}</TableCell>
                            <TableCell className="text-right">{user.storageUsed.toFixed(2)} MB</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {user.createdAt ? format(new Date(user.createdAt), "dd.MM.yyyy", { locale: de }) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(user)}
                                data-testid={`button-delete-${user.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="mt-4 text-sm text-muted-foreground">
                  Gesamt: {filteredUsers.length} {filteredUsers.length === 1 ? "Benutzer" : "Benutzer"}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Requests Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Feature Requests Verwaltung
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingFeatures ? (
                  <div className="text-center py-8 text-muted-foreground">Lädt Feature Requests...</div>
                ) : featureRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Keine Feature Requests vorhanden</div>
                ) : (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Titel</TableHead>
                          <TableHead className="min-w-[200px]">Beschreibung</TableHead>
                          <TableHead>Benutzer-ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Echte</TableHead>
                          <TableHead className="text-center">Basis</TableHead>
                          <TableHead className="text-center">Gesamt</TableHead>
                          <TableHead>Veröffentlicht</TableHead>
                          <TableHead className="min-w-[200px]">Admin-Notiz</TableHead>
                          <TableHead>Erstellt</TableHead>
                          <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {featureRequests.map((feature) => (
                          <TableRow key={feature.id} data-testid={`feature-row-${feature.id}`}>
                            <TableCell className="font-medium">{feature.title}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {truncateText(feature.description, 80)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{truncateText(feature.userId, 12)}</TableCell>
                            <TableCell>
                              <Select
                                value={feature.status}
                                onValueChange={(value) => updateFeatureMutation.mutate({ id: feature.id, status: value })}
                                disabled={updateFeatureMutation.isPending}
                              >
                                <SelectTrigger className="w-32" data-testid={`select-status-${feature.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {FEATURE_STATUS_OPTIONS.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {STATUS_LABELS[status]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{feature.voteCount}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {editingBaseVotes?.id === feature.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={editingBaseVotes.votes}
                                    onChange={(e) => setEditingBaseVotes({ ...editingBaseVotes, votes: parseInt(e.target.value) || 0 })}
                                    className="w-20"
                                    min="0"
                                    data-testid={`input-base-votes-${feature.id}`}
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      updateFeatureMutation.mutate({ id: feature.id, baseVotes: editingBaseVotes.votes });
                                      setEditingBaseVotes(null);
                                    }}
                                    disabled={updateFeatureMutation.isPending}
                                    data-testid={`button-save-votes-${feature.id}`}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setEditingBaseVotes(null)}
                                    data-testid={`button-cancel-votes-${feature.id}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <Badge variant="secondary">{feature.baseVotes || 0}</Badge>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setEditingBaseVotes({ id: feature.id, votes: feature.baseVotes || 0 })}
                                    data-testid={`button-edit-votes-${feature.id}`}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="default">{(feature.voteCount || 0) + (feature.baseVotes || 0)}</Badge>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={feature.isPublished}
                                onCheckedChange={(checked) => updateFeatureMutation.mutate({ id: feature.id, isPublished: checked })}
                                disabled={updateFeatureMutation.isPending}
                                data-testid={`switch-published-${feature.id}`}
                              />
                            </TableCell>
                            <TableCell>
                              {editingAdminNote?.id === feature.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    value={editingAdminNote.note}
                                    onChange={(e) => setEditingAdminNote({ ...editingAdminNote, note: e.target.value })}
                                    className="w-40"
                                    data-testid={`input-admin-note-${feature.id}`}
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => updateFeatureMutation.mutate({ id: feature.id, adminNote: editingAdminNote.note })}
                                    disabled={updateFeatureMutation.isPending}
                                    data-testid={`button-save-note-${feature.id}`}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setEditingAdminNote(null)}
                                    data-testid={`button-cancel-note-${feature.id}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-sm text-muted-foreground">
                                    {feature.adminNote || "-"}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setEditingAdminNote({ id: feature.id, note: feature.adminNote || "" })}
                                    data-testid={`button-edit-note-${feature.id}`}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {feature.createdAt ? format(new Date(feature.createdAt), "dd.MM.yyyy", { locale: de }) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteFeatureDialog({ open: true, feature })}
                                data-testid={`button-delete-feature-${feature.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="mt-4 text-sm text-muted-foreground">
                  Gesamt: {featureRequests.length} {featureRequests.length === 1 ? "Feature Request" : "Feature Requests"}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Tutorials Tab */}
          <TabsContent value="tutorials">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Video Tutorials Verwaltung
                  </CardTitle>
                  <Button onClick={() => openTutorialDialog()} data-testid="button-create-tutorial">
                    <Plus className="h-4 w-4 mr-2" />
                    Neues Tutorial
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingTutorials ? (
                  <div className="text-center py-8 text-muted-foreground">Lädt Video Tutorials...</div>
                ) : videoTutorials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Keine Video Tutorials vorhanden</div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titel</TableHead>
                          <TableHead>Kategorie</TableHead>
                          <TableHead className="text-center">Reihenfolge</TableHead>
                          <TableHead>Veröffentlicht</TableHead>
                          <TableHead>Erstellt</TableHead>
                          <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {videoTutorials.map((tutorial) => (
                          <TableRow key={tutorial.id} data-testid={`tutorial-row-${tutorial.id}`}>
                            <TableCell className="font-medium">{tutorial.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{tutorial.category}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{tutorial.sortOrder}</TableCell>
                            <TableCell>
                              <Badge variant={tutorial.isPublished ? "default" : "secondary"}>
                                {tutorial.isPublished ? "Ja" : "Nein"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {tutorial.createdAt ? format(new Date(tutorial.createdAt), "dd.MM.yyyy", { locale: de }) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openTutorialDialog(tutorial)}
                                  data-testid={`button-edit-tutorial-${tutorial.id}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteTutorialDialog({ open: true, tutorial })}
                                  data-testid={`button-delete-tutorial-${tutorial.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="mt-4 text-sm text-muted-foreground">
                  Gesamt: {videoTutorials.length} {videoTutorials.length === 1 ? "Tutorial" : "Tutorials"}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Benutzer löschen?
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Möchten Sie den Benutzer <strong>{deleteDialog.user?.email}</strong> wirklich löschen?
              </p>
              <p className="text-destructive font-medium">
                Diese Aktion löscht unwiderruflich:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Den Benutzer-Account</li>
                <li>Alle Dokumente ({deleteDialog.user?.documentCount} Dokumente)</li>
                <li>Alle E-Mail-Whitelist-Einträge</li>
                <li>Alle Ordner und Einstellungen</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, user: null })}
              disabled={deleteMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Wird gelöscht..." : "Ja, löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Feature Request Dialog */}
      <Dialog open={deleteFeatureDialog.open} onOpenChange={(open) => setDeleteFeatureDialog({ open, feature: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Feature Request löschen?
            </DialogTitle>
            <DialogDescription>
              Möchten Sie den Feature Request <strong>"{deleteFeatureDialog.feature?.title}"</strong> wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteFeatureDialog({ open: false, feature: null })}
              disabled={deleteFeatureMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteFeatureDialog.feature && deleteFeatureMutation.mutate(deleteFeatureDialog.feature.id)}
              disabled={deleteFeatureMutation.isPending}
              data-testid="button-confirm-delete-feature"
            >
              {deleteFeatureMutation.isPending ? "Wird gelöscht..." : "Ja, löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tutorial Dialog */}
      <Dialog open={deleteTutorialDialog.open} onOpenChange={(open) => setDeleteTutorialDialog({ open, tutorial: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Video Tutorial löschen?
            </DialogTitle>
            <DialogDescription>
              Möchten Sie das Tutorial <strong>"{deleteTutorialDialog.tutorial?.title}"</strong> wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTutorialDialog({ open: false, tutorial: null })}
              disabled={deleteTutorialMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTutorialDialog.tutorial && deleteTutorialMutation.mutate(deleteTutorialDialog.tutorial.id)}
              disabled={deleteTutorialMutation.isPending}
              data-testid="button-confirm-delete-tutorial"
            >
              {deleteTutorialMutation.isPending ? "Wird gelöscht..." : "Ja, löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Tutorial Dialog */}
      <Dialog open={tutorialDialog.open} onOpenChange={(open) => { setTutorialDialog({ open, tutorial: null }); if (!open) resetTutorialForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tutorialDialog.tutorial ? "Tutorial bearbeiten" : "Neues Tutorial erstellen"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={tutorialForm.title}
                onChange={(e) => setTutorialForm({ ...tutorialForm, title: e.target.value })}
                placeholder="Tutorial Titel"
                data-testid="input-tutorial-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={tutorialForm.description}
                onChange={(e) => setTutorialForm({ ...tutorialForm, description: e.target.value })}
                placeholder="Beschreibung des Tutorials"
                data-testid="input-tutorial-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video-URL *</Label>
              <Input
                id="videoUrl"
                value={tutorialForm.videoUrl}
                onChange={(e) => setTutorialForm({ ...tutorialForm, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                data-testid="input-tutorial-videoUrl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail-URL</Label>
              <Input
                id="thumbnailUrl"
                value={tutorialForm.thumbnailUrl}
                onChange={(e) => setTutorialForm({ ...tutorialForm, thumbnailUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-tutorial-thumbnailUrl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select
                value={tutorialForm.category}
                onValueChange={(value) => setTutorialForm({ ...tutorialForm, category: value })}
              >
                <SelectTrigger data-testid="select-tutorial-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TUTORIAL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Reihenfolge</Label>
              <Input
                id="sortOrder"
                type="number"
                value={tutorialForm.sortOrder}
                onChange={(e) => setTutorialForm({ ...tutorialForm, sortOrder: parseInt(e.target.value) || 0 })}
                data-testid="input-tutorial-sortOrder"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPublished"
                checked={tutorialForm.isPublished}
                onCheckedChange={(checked) => setTutorialForm({ ...tutorialForm, isPublished: checked as boolean })}
                data-testid="checkbox-tutorial-isPublished"
              />
              <Label htmlFor="isPublished">Veröffentlicht</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setTutorialDialog({ open: false, tutorial: null }); resetTutorialForm(); }}
              disabled={saveTutorialMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveTutorial}
              disabled={saveTutorialMutation.isPending}
              data-testid="button-save-tutorial"
            >
              {saveTutorialMutation.isPending ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
