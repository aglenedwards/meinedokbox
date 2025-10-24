import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t bg-background mt-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2025 MeineDokBox. Alle Rechte vorbehalten.
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
            <Link href="/impressum" data-testid="link-impressum">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Impressum
              </span>
            </Link>
            <Link href="/datenschutz" data-testid="link-datenschutz">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Datenschutz
              </span>
            </Link>
            <Link href="/kontakt" data-testid="link-kontakt">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Kontakt
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
