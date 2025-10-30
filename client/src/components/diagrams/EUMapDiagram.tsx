import { MapPin, CheckCircle2 } from "lucide-react";

export function EUMapDiagram() {
  return (
    <div className="w-full p-8 bg-background rounded-lg border-2 border-primary/20">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">Rechenzentrumsstandorte in der EU</h3>
        <p className="text-muted-foreground">Alle Daten verbleiben zu 100% innerhalb der Europäischen Union</p>
      </div>

      {/* Simplified EU Map */}
      <div className="relative max-w-3xl mx-auto">
        {/* Europe outline (simplified SVG) */}
        <svg viewBox="0 0 800 600" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {/* Background */}
          <rect width="800" height="600" fill="hsl(var(--muted))" opacity="0.3" />
          
          {/* Simplified EU countries (approximate shapes) */}
          <g fill="hsl(var(--primary))" opacity="0.15" stroke="hsl(var(--primary))" strokeWidth="1">
            {/* Western Europe */}
            <path d="M 150 150 L 200 120 L 280 140 L 320 180 L 300 250 L 250 280 L 180 260 Z" />
            {/* Central Europe */}
            <path d="M 320 180 L 380 160 L 450 180 L 480 230 L 460 280 L 400 300 L 350 270 L 300 250 Z" />
            {/* Northern Europe */}
            <path d="M 380 50 L 450 40 L 500 70 L 480 130 L 420 140 L 380 100 Z" />
            {/* Southern Europe */}
            <path d="M 250 330 L 320 310 L 380 340 L 400 400 L 360 440 L 280 430 L 240 390 Z" />
            {/* Eastern Europe */}
            <path d="M 480 230 L 550 210 L 600 240 L 590 310 L 540 340 L 480 320 L 460 280 Z" />
          </g>

          {/* EU Stars circle */}
          <circle cx="400" cy="80" r="40" fill="hsl(var(--primary))" opacity="0.1" />
          <text x="400" y="90" textAnchor="middle" fontSize="40" fill="hsl(var(--primary))">🇪🇺</text>

          {/* Frankfurt Location Marker */}
          <g>
            {/* Pulsing circle */}
            <circle cx="420" cy="220" r="60" fill="hsl(var(--primary))" opacity="0.1">
              <animate attributeName="r" values="50;70;50" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="420" cy="220" r="40" fill="hsl(var(--primary))" opacity="0.2">
              <animate attributeName="r" values="35;50;35" dur="2s" repeatCount="indefinite" />
            </circle>
            
            {/* Pin marker */}
            <circle cx="420" cy="220" r="20" fill="hsl(var(--primary))" stroke="white" strokeWidth="3" />
            <circle cx="420" cy="220" r="8" fill="white" />
          </g>
        </svg>

        {/* Frankfurt Label */}
        <div className="absolute top-1/3 left-1/2 translate-x-4 -translate-y-12">
          <div className="bg-background border-2 border-primary rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">Frankfurt, Deutschland</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>IONOS S3 Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Neon PostgreSQL Database</span>
              </div>
            </div>
          </div>
        </div>

        {/* Azure EU Regions (dispersed) */}
        <div className="absolute top-1/4 left-1/4">
          <div className="bg-primary/10 border border-primary/30 rounded px-2 py-1 text-xs font-semibold">
            Azure EU
          </div>
        </div>
        <div className="absolute top-2/3 right-1/4">
          <div className="bg-primary/10 border border-primary/30 rounded px-2 py-1 text-xs font-semibold">
            Azure EU
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-primary" />
            <div>
              <p className="font-semibold text-sm">IONOS S3 Frankfurt</p>
              <p className="text-xs text-muted-foreground">Primärer Speicher</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-primary" />
            <div>
              <p className="font-semibold text-sm">Neon DB Frankfurt</p>
              <p className="text-xs text-muted-foreground">PostgreSQL Datenbank</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-primary/40" />
            <div>
              <p className="font-semibold text-sm">Azure OpenAI EU</p>
              <p className="text-xs text-muted-foreground">KI-Verarbeitung (verteilt)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
