import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t bg-background mt-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-4">Themen</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/digital-archivieren" data-testid="link-digital-archivieren">
                <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Digital archivieren
                </span>
              </Link>
              <Link href="/dokumente-digitalisieren-app" data-testid="link-dokumente-app">
                <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Dokumente digitalisieren App
                </span>
              </Link>
              <Link href="/post-digitalisieren" data-testid="link-post-digitalisieren">
                <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Post digitalisieren
                </span>
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Produkt</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/funktionen" data-testid="link-funktionen-footer">
                <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Funktionen
                </span>
              </Link>
              <Link href="/preise" data-testid="link-preise-footer">
                <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Preise
                </span>
              </Link>
              <Link href="/sicherheit" data-testid="link-sicherheit-footer">
                <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Sicherheit
                </span>
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Rechtliches</h3>
            <div className="flex flex-col gap-2 text-sm">
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
        
        <div className="border-t pt-8">
          <div className="text-sm text-muted-foreground text-center">
            © 2025 MeineDokBox. Alle Rechte vorbehalten.
          </div>
        </div>
      </div>
    </footer>
  );
}
