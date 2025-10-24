import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logoImage from "@assets/meinedokbox_1760966015056.png";

export function Header() {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" data-testid="link-home">
          <div className="hover-elevate px-3 py-2 rounded-md transition-colors cursor-pointer">
            <img src={logoImage} alt="MeineDokBox Logo" className="h-10 w-10" />
          </div>
        </Link>
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </Link>
      </div>
    </header>
  );
}
