import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

        {/* Desktop CTA Button */}
        <div className="hidden md:block">
          <Link href="/">
            <Button size="sm" data-testid="button-header-cta">
              Kostenlos testen
            </Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menü öffnen</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className="w-full justify-start text-lg"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`nav-mobile-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
                
                <div className="pt-4 border-t">
                  <Link href="/">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="button-mobile-cta"
                    >
                      Kostenlos testen
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
