import { MapPin, Server, Database, Shield } from "lucide-react";
import germanyMap from "@assets/Deutschlandkarte_1765890129712.png";

// ============================================
// MARKER-POSITIONEN (in Prozent der Kartenbreite/höhe)
// Hier kannst du die X/Y Werte anpassen um die Marker zu verschieben
// ============================================
const locations = {
  frankfurt: { x: 38, y: 55 },  // Frankfurt am Main
  berlin: { x: 62, y: 30 },     // Berlin
};

export function GermanyMapDiagram() {
  return (
    <div className="w-full p-8 bg-background rounded-lg border-2 border-primary/20">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">Ihre Daten bleiben in Deutschland</h3>
        <p className="text-muted-foreground">Redundante Speicherung in deutschen IONOS-Rechenzentren</p>
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Germany Map Image */}
        <img 
          src={germanyMap} 
          alt="Deutschlandkarte mit Rechenzentrumsstandorten" 
          className="w-full h-auto"
        />

        {/* Frankfurt Marker - Primary Location */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${locations.frankfurt.x}%`, top: `${locations.frankfurt.y}%` }}
        >
          {/* Pulsing circles */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-24 h-24 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '3s' }} />
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
          </div>
          
          {/* Main marker */}
          <div className="relative z-10 w-8 h-8 rounded-full bg-primary border-4 border-white shadow-lg flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          
          {/* Label */}
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
            <span className="px-2 py-1 bg-primary text-primary-foreground text-sm font-bold rounded shadow-lg">
              Frankfurt
            </span>
          </div>
        </div>

        {/* Berlin Marker - Secondary Location */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${locations.berlin.x}%`, top: `${locations.berlin.y}%` }}
        >
          {/* Smaller marker */}
          <div className="relative z-10 w-5 h-5 rounded-full bg-primary/70 border-3 border-white shadow-md flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          
          {/* Label */}
          <div className="absolute left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded shadow">
              Berlin
            </span>
          </div>
        </div>

        {/* Frankfurt Info Card */}
        <div 
          className="absolute z-20"
          style={{ left: `${locations.frankfurt.x + 12}%`, top: `${locations.frankfurt.y - 5}%` }}
        >
          <div className="bg-background border-2 border-primary rounded-lg px-4 py-3 shadow-xl max-w-[180px]">
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
