import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ArrowRight } from "lucide-react";
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
    <header className="border-b bg-red-500 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 lg:px-6 py-4 md:py-5 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" data-testid="link-home">
          <div className="hover-elevate active-elevate-2 px-3 py-2 rounded-lg transition-all cursor-pointer">
            <img 
              src={logoImage} 
              alt="MeineDokBox Logo" 
              className="h-12 md:h-14 lg:h-16 w-auto" 
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive(item.href) ? "secondary" : "ghost"}
                size="default"
                className="text-base font-medium px-5"
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button 
              variant="ghost" 
              size="default"
              className="text-base font-medium px-5"
              data-testid="button-header-login"
            >
              Anmelden
            </Button>
          </Link>
          <Link href="/">
            <Button 
              size="default"
              className="text-base font-semibold px-6 shadow-lg hover:shadow-xl transition-shadow"
              data-testid="button-header-cta"
            >
              Kostenlos testen
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11" data-testid="button-mobile-menu">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menü öffnen</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px]">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-3">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className="w-full justify-start text-base font-medium h-12"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`nav-mobile-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
                
                <div className="pt-6 border-t mt-4 space-y-3">
                  <Link href="/login">
                    <Button 
                      variant="outline"
                      className="w-full text-base font-medium h-12" 
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="button-mobile-login"
                    >
                      Anmelden
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button 
                      className="w-full text-base font-semibold h-12" 
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="button-mobile-cta"
                    >
                      Kostenlos testen
                      <ArrowRight className="ml-2 h-5 w-5" />
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
