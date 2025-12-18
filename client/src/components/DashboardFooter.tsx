import { Link } from "wouter";
import { Lightbulb, PlayCircle, Lock, Scale, Sparkles } from "lucide-react";

export function DashboardFooter() {
  return (
    <footer className="border-t bg-muted/20 py-4 px-4 sm:px-6 mt-8 overflow-hidden">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm">
          <Link href="/wunsch-features" data-testid="link-wunsch-features">
            <span className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap">
              <Lightbulb className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              Features
            </span>
          </Link>
          <Link href="/video-tutorials" data-testid="link-video-tutorials">
            <span className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap">
              <PlayCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              Tutorials
            </span>
          </Link>
          <Link href="/changelog" data-testid="link-changelog">
            <span className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              Neu
            </span>
          </Link>
          <Link href="/datenschutz" data-testid="link-datenschutz-dashboard">
            <span className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap">
              <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              Datenschutz
            </span>
          </Link>
          <Link href="/impressum" data-testid="link-impressum-dashboard">
            <span className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap">
              <Scale className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              Impressum
            </span>
          </Link>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>© 2025 MeineDokBox</span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Online
          </span>
          <span className="hidden sm:inline">·</span>
          <span>Made in Germany</span>
        </div>
      </div>
    </footer>
  );
}
