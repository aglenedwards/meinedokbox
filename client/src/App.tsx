import { Switch, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { getCurrentUser } from "@/lib/api";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getCurrentUser,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-3xl font-bold">Willkommen bei PaperEase</h1>
          <p className="text-muted-foreground">
            Bitte melden Sie sich an, um Ihre Dokumente zu verwalten.
          </p>
          <Button asChild size="lg" data-testid="button-login">
            <a href="/api/login">
              <LogIn className="h-4 w-4 mr-2" />
              Anmelden
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Router />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AuthenticatedApp />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
