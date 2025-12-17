import { Link } from "wouter";
import { Lightbulb, PlayCircle, Lock, Scale, Sparkles } from "lucide-react";

export function DashboardFooter() {
  return (
    <footer className="border-t bg-muted/20 py-4 px-6 mt-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          © 2025 MeineDokBox
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <Link href="/wunsch-features" data-testid="link-wunsch-features">
            <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Lightbulb className="h-3.5 w-3.5" />
              Wunsch-Features
            </span>
          </Link>
          <Link href="/video-tutorials" data-testid="link-video-tutorials">
            <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <PlayCircle className="h-3.5 w-3.5" />
              Video-Tutorials
            </span>
          </Link>
          <Link href="/changelog" data-testid="link-changelog">
            <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Sparkles className="h-3.5 w-3.5" />
              Was ist neu?
            </span>
          </Link>
          <Link href="/datenschutz" data-testid="link-datenschutz-dashboard">
            <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Lock className="h-3.5 w-3.5" />
              Datenschutz
            </span>
          </Link>
          <Link href="/impressum" data-testid="link-impressum-dashboard">
            <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Scale className="h-3.5 w-3.5" />
              Impressum
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Online
          </span>
          <span>Made in Germany</span>
        </div>
      </div>
    </footer>
  );
}
