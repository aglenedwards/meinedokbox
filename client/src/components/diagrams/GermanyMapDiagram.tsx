import { MapPin, Server, Database, Shield } from "lucide-react";

export function GermanyMapDiagram() {
  return (
    <div className="w-full p-8 bg-background rounded-lg border-2 border-primary/20">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">Ihre Daten bleiben in Deutschland</h3>
        <p className="text-muted-foreground">Redundante Speicherung in deutschen IONOS-Rechenzentren</p>
      </div>

      <div className="relative max-w-3xl mx-auto">
        <svg viewBox="0 0 400 500" className="w-full h-auto max-h-[400px]" xmlns="http://www.w3.org/2000/svg">
          {/* Germany outline - simplified but recognizable shape */}
          <path 
            d="M 180 30 
               L 220 25 L 260 35 L 290 50 L 310 70 L 320 95 
               L 340 120 L 350 150 L 345 180 L 350 210 
               L 340 250 L 320 280 L 300 320 L 280 350 
               L 250 380 L 220 410 L 180 430 L 150 440 
               L 120 430 L 100 400 L 80 360 L 70 320 
               L 60 280 L 55 240 L 60 200 L 70 160 
               L 85 120 L 100 90 L 120 60 L 150 40 Z"
            fill="hsl(var(--primary))" 
            opacity="0.12" 
            stroke="hsl(var(--primary))" 
            strokeWidth="2"
          />

          {/* Frankfurt Region - Primary with pulsing effect */}
          <g>
            <circle cx="190" cy="280" r="50" fill="hsl(var(--primary))" opacity="0.08">
              <animate attributeName="r" values="45;60;45" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0.05;0.15" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="190" cy="280" r="30" fill="hsl(var(--primary))" opacity="0.15">
              <animate attributeName="r" values="28;38;28" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0.1;0.25" dur="3s" repeatCount="indefinite" />
            </circle>
            
            {/* Main Frankfurt marker */}
            <circle cx="190" cy="280" r="18" fill="hsl(var(--primary))" stroke="white" strokeWidth="3" />
            <circle cx="190" cy="280" r="7" fill="white" />
          </g>

          {/* Berlin marker */}
          <g>
            <circle cx="290" cy="140" r="12" fill="hsl(var(--primary))" opacity="0.6" stroke="white" strokeWidth="2" />
            <circle cx="290" cy="140" r="4" fill="white" />
          </g>

          {/* Multi-AZ within Frankfurt - show redundancy */}
          <g opacity="0.7">
            {/* Connection lines showing redundancy */}
            <line x1="190" y1="280" x2="160" y2="310" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4,4" />
            <line x1="190" y1="280" x2="220" y2="310" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4,4" />
            
            {/* Redundant AZ markers */}
            <circle cx="160" cy="310" r="8" fill="hsl(var(--primary))" opacity="0.5" stroke="white" strokeWidth="2" />
            <circle cx="220" cy="310" r="8" fill="hsl(var(--primary))" opacity="0.5" stroke="white" strokeWidth="2" />
          </g>

          {/* City Labels */}
          <text x="190" y="250" textAnchor="middle" fontSize="14" fill="hsl(var(--foreground))" fontWeight="700">Frankfurt</text>
          <text x="290" y="165" textAnchor="middle" fontSize="12" fill="hsl(var(--muted-foreground))" fontWeight="600">Berlin</text>
          
          {/* Multi-AZ Label */}
          <text x="190" y="345" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">Multi-AZ Redundanz</text>
        </svg>

        {/* Frankfurt Info Card */}
        <div className="absolute top-[45%] right-0 md:right-[-10%] lg:right-[5%]">
          <div className="bg-background border-2 border-primary rounded-lg px-4 py-3 shadow-xl max-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-bold text-sm">Frankfurt am Main</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <Server className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span>IONOS S3 Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span>Neon PostgreSQL</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span>C5 & ISO 27001</span>
              </div>
            </div>
          </div>
        </div>

        {/* Berlin Info - smaller */}
        <div className="absolute top-[18%] right-[5%] md:right-[10%]">
          <div className="bg-background/90 border rounded-md px-2 py-1 shadow-md">
            <span className="text-xs text-muted-foreground">IONOS Backup</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-primary shadow-sm flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Primärer Standort</p>
              <p className="text-xs text-muted-foreground">Frankfurt (eu-central)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary/50" />
              <div className="w-3 h-3 rounded-full bg-primary/50" />
            </div>
            <div>
              <p className="font-semibold text-sm">Multi-AZ Redundanz</p>
              <p className="text-xs text-muted-foreground">Automatische Spiegelung</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/60 shadow-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Weitere Standorte</p>
              <p className="text-xs text-muted-foreground">Berlin, Baden</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-2xl font-bold text-primary">99.999999999%</div>
          <div className="text-xs text-muted-foreground">Datenhaltbarkeit</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-2xl font-bold text-primary">3x</div>
          <div className="text-xs text-muted-foreground">Redundante Kopien</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-2xl font-bold text-primary">100%</div>
          <div className="text-xs text-muted-foreground">Deutschland</div>
        </div>
      </div>
    </div>
  );
}
