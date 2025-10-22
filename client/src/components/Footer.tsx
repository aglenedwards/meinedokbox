export function Footer() {
  return (
    <footer className="border-t bg-background mt-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2025 MeineDokBox. Alle Rechte vorbehalten.
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
            <a 
              href="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-impressum"
            >
              Impressum
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-datenschutz"
            >
              Datenschutz
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-kontakt"
            >
              Kontakt
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
