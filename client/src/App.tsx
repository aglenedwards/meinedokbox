import { Switch, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getCurrentUser } from "@/lib/api";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Trash from "@/pages/Trash";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import VerifyEmail from "@/pages/VerifyEmail";
import Invite from "@/pages/Invite";
import ResetPassword from "@/pages/ResetPassword";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import Funktionen from "@/pages/Funktionen";
import Sicherheit from "@/pages/Sicherheit";
import Preise from "@/pages/Preise";
import UeberUns from "@/pages/UeberUns";
import Impressum from "@/pages/Impressum";
import Datenschutz from "@/pages/Datenschutz";
import Kontakt from "@/pages/Kontakt";
import DigitalArchivieren from "@/pages/DigitalArchivieren";
import DokumenteApp from "@/pages/DokumenteApp";
import PostDigitalisieren from "@/pages/PostDigitalisieren";
import NotFound from "@/pages/not-found";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { useEffect } from "react";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element | null }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getCurrentUser,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Component />;
}

function Router() {
  const [location] = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location]);

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/funktionen" component={Funktionen} />
      <Route path="/sicherheit" component={Sicherheit} />
      <Route path="/preise" component={Preise} />
      <Route path="/ueber-uns" component={UeberUns} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/invite" component={Invite} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/checkout/erfolg" component={CheckoutSuccess} />
      <Route path="/impressum" component={Impressum} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route path="/kontakt" component={Kontakt} />
      <Route path="/digital-archivieren" component={DigitalArchivieren} />
      <Route path="/dokumente-digitalisieren-app" component={DokumenteApp} />
      <Route path="/post-digitalisieren" component={PostDigitalisieren} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/trash">
        {() => <ProtectedRoute component={Trash} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>
      <Route path="/admin/login">
        {() => <ProtectedRoute component={AdminLogin} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={Admin} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <PWAInstallPrompt />
          <PWAUpdatePrompt />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
