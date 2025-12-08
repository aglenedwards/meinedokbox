import { Link } from "wouter";
import { Shield, Server, Lock, FileText, CreditCard, HelpCircle, Mail, Building2, Scale, FolderOpen, Smartphone, Mail as MailIcon } from "lucide-react";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <Link href="/">
                <img src={logoImage} alt="MeineDokBox" className="h-12 w-auto mb-4 cursor-pointer" data-testid="img-footer-logo" />
              </Link>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Die intelligente Dokumentenverwaltung für Ihren Haushalt. DSGVO-konform, sicher und made in Germany.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border text-xs font-medium">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  DSGVO
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border text-xs font-medium">
                  <Server className="h-3.5 w-3.5 text-primary" />
                  DE Server
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border text-xs font-medium">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Verschlüsselt
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider text-foreground/80">Produkt</h3>
              <div className="flex flex-col gap-3.5">
                <Link href="/funktionen" data-testid="link-funktionen-footer">
                  <span className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                    <FileText className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    Funktionen
                  </span>
                </Link>
                <Link href="/preise" data-testid="link-preise-footer">
                  <span className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                    <CreditCard className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    Preise
                  </span>
                </Link>
                <Link href="/sicherheit" data-testid="link-sicherheit-footer">
                  <span className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                    <Shield className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    Sicherheit
                  </span>
                </Link>
                <Link href="/ueber-uns" data-testid="link-ueber-uns-footer">
                  <span className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                    <Building2 className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    Über uns
                  </span>
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider text-foreground/80">Themen</h3>
              <div className="flex flex-col gap-3.5">
                <Link href="/digital-archivieren" data-testid="link-digital-archivieren">
                  <span className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                    <FolderOpen className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    Digital archivieren
                  </span>
                </Link>
                <Link href="/dokumente-digitalisieren-app" data-testid="link-dokumente-app">
                  <span className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                    <Smartphone className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    Dokumente digitalisieren App
                  </span>
                </Link>
                <Link href="/post-digitalisieren" data-testid="link-post-digitalisieren">
                  <span className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                    <MailIcon className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    Post digitalisieren
                  </span>
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider text-foreground/80">Rechtliches</h3>
              <div className="flex flex-col gap-3.5">
                <Link href="/impressum" data-testid="link-impressum">
                  <span className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                    <Scale className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    Impressum
                  </span>
                </Link>
                <Link href="/datenschutz" data-testid="link-datenschutz">
                  <span className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                    <Lock className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    Datenschutz
                  </span>
                </Link>
                <Link href="/kontakt" data-testid="link-kontakt">
                  <span className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                    <Mail className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    Kontakt
                  </span>
                </Link>
                <Link href="/hilfe" data-testid="link-hilfe">
                  <span className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                    <HelpCircle className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    Hilfe & FAQ
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 MeineDokBox. Alle Rechte vorbehalten.
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Alle Systeme online
              </span>
              <span>Made with care in Germany</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
