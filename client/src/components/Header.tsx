import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export function Header() {
  const [location] = useLocation();
  
  const navItems = [
    { href: "/funktionen", label: "Funktionen" },
    { href: "/sicherheit", label: "Sicherheit" },
    { href: "/preise", label: "Preise" },
    { href: "/ueber-uns", label: "Über uns" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" data-testid="link-home">
          <div className="hover-elevate px-2 py-1 rounded-md transition-colors cursor-pointer">
            <img 
              src={logoImage} 
              alt="MeineDokBox Logo" 
              className="h-10 md:h-12 w-auto" 
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive(item.href) ? "secondary" : "ghost"}
                size="sm"
                className="font-medium"
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Link href="/">
            <Button size="sm" data-testid="button-header-cta">
              Kostenlos testen
            </Button>
          </Link>
        </div>

        {/* Mobile: Back Button */}
        <div className="md:hidden">
          {location !== "/" && (
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                Zurück
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t">
        <nav className="container mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive(item.href) ? "secondary" : "ghost"}
                size="sm"
                className="whitespace-nowrap text-xs"
                data-testid={`nav-mobile-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
