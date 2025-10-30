import { MapPin, CheckCircle2 } from "lucide-react";

export function EUMapDiagram() {
  return (
    <div className="w-full p-8 bg-background rounded-lg border-2 border-primary/20">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">Rechenzentrumsstandorte in der EU</h3>
        <p className="text-muted-foreground">Alle Daten verbleiben zu 100% innerhalb der Europäischen Union</p>
      </div>

      <div className="relative max-w-4xl mx-auto">
        <svg viewBox="0 0 900 700" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          <rect width="900" height="700" fill="hsl(var(--muted))" opacity="0.2" />
          
          <g stroke="hsl(var(--border))" strokeWidth="1.5">
            {/* Spain */}
            <path d="M 100 420 L 140 380 L 180 390 L 220 420 L 240 460 L 200 490 L 150 480 L 110 450 Z" 
                  fill="hsl(var(--primary))" opacity="0.08" />
            
            {/* France */}
            <path d="M 220 280 L 280 260 L 320 280 L 340 320 L 320 380 L 280 400 L 240 390 L 220 350 Z" 
                  fill="hsl(var(--primary))" opacity="0.08" />
            
            {/* Italy */}
            <path d="M 380 380 L 420 360 L 440 390 L 430 450 L 410 510 L 390 530 L 370 490 L 360 440 L 370 400 Z" 
                  fill="hsl(var(--primary))" opacity="0.08" />
            
            {/* Germany - HIGHLIGHTED */}
            <path d="M 340 200 L 400 180 L 460 190 L 480 230 L 470 280 L 440 310 L 390 320 L 340 300 L 320 260 Z" 
                  fill="hsl(var(--primary))" opacity="0.25" stroke="hsl(var(--primary))" strokeWidth="2" />
            
            {/* Poland */}
            <path d="M 480 180 L 540 170 L 590 190 L 600 240 L 580 280 L 540 290 L 490 270 L 480 230 Z" 
                  fill="hsl(var(--primary))" opacity="0.08" />
            
            {/* Netherlands & Belgium */}
            <path d="M 280 200 L 320 190 L 340 210 L 330 240 L 300 250 L 270 230 Z" 
                  fill="hsl(var(--primary))" opacity="0.08" />
            
            {/* Denmark */}
            <path d="M 380 120 L 420 110 L 440 130 L 430 160 L 400 170 L 370 150 Z" 
                  fill="hsl(var(--primary))" opacity="0.08" />
            
            {/* Sweden */}
            <path d="M 450 40 L 490 30 L 520 50 L 540 100 L 530 150 L 500 160 L 470 140 L 460 90 Z" 
                  fill="hsl(var(--primary))" opacity="0.08" />
            
            {/* Czech Republic & Austria */}
            <path d="M 440 280 L 480 270 L 510 290 L 500 320 L 470 330 L 440 320 Z" 
                  fill="hsl(var(--primary))" opacity="0.08" />
            
            {/* Greece */}
            <path d="M 540 480 L 580 470 L 610 500 L 600 540 L 560 550 L 530 520 Z" 
                  fill="hsl(var(--primary))" opacity="0.08" />
            
            {/* Portugal */}
            <path d="M 60 380 L 90 360 L 110 390 L 100 430 L 70 450 L 50 420 Z" 
                  fill="hsl(var(--primary))" opacity="0.08" />
            
            {/* Ireland */}
            <path d="M 140 180 L 170 170 L 190 200 L 180 230 L 150 240 L 130 210 Z" 
                  fill="hsl(var(--primary))" opacity="0.08" />
            
            {/* Romania */}
            <path d="M 580 320 L 630 310 L 660 340 L 650 380 L 610 390 L 570 370 Z" 
                  fill="hsl(var(--primary))" opacity="0.08" />
          </g>

          {/* Frankfurt - PRIMARY LOCATION with pulsing effect */}
          <g>
            <circle cx="405" cy="250" r="70" fill="hsl(var(--primary))" opacity="0.08">
              <animate attributeName="r" values="60;85;60" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0.03;0.15" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="405" cy="250" r="45" fill="hsl(var(--primary))" opacity="0.15">
              <animate attributeName="r" values="40;55;40" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0.08;0.25" dur="3s" repeatCount="indefinite" />
            </circle>
            
            <circle cx="405" cy="250" r="24" fill="hsl(var(--primary))" stroke="white" strokeWidth="4" />
            <circle cx="405" cy="250" r="10" fill="white" />
          </g>

          {/* Azure EU Regions - smaller markers */}
          {/* Amsterdam */}
          <g>
            <circle cx="310" cy="205" r="8" fill="hsl(var(--primary))" opacity="0.4" stroke="white" strokeWidth="2" />
            <circle cx="310" cy="205" r="3" fill="white" />
          </g>
          
          {/* Dublin */}
          <g>
            <circle cx="160" cy="205" r="8" fill="hsl(var(--primary))" opacity="0.4" stroke="white" strokeWidth="2" />
            <circle cx="160" cy="205" r="3" fill="white" />
          </g>
          
          {/* Paris */}
          <g>
            <circle cx="270" cy="310" r="8" fill="hsl(var(--primary))" opacity="0.4" stroke="white" strokeWidth="2" />
            <circle cx="270" cy="310" r="3" fill="white" />
          </g>
          
          {/* Stockholm */}
          <g>
            <circle cx="495" cy="90" r="8" fill="hsl(var(--primary))" opacity="0.4" stroke="white" strokeWidth="2" />
            <circle cx="495" cy="90" r="3" fill="white" />
          </g>

          {/* Location Labels - minimal */}
          <text x="310" y="195" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))" fontWeight="600">AMS</text>
          <text x="160" y="195" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))" fontWeight="600">DUB</text>
          <text x="270" y="300" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))" fontWeight="600">PAR</text>
          <text x="495" y="80" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))" fontWeight="600">STO</text>
        </svg>

        {/* Frankfurt Info Box */}
        <div className="absolute top-[28%] left-[52%] translate-x-2">
          <div className="bg-background border-2 border-primary rounded-lg px-4 py-3 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-bold text-base">Frankfurt, Deutschland</span>
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
      </div>

      {/* Compact Legend */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-primary shadow-sm" />
            <div>
              <p className="font-semibold text-sm">IONOS S3 Frankfurt</p>
              <p className="text-xs text-muted-foreground">Primärer Speicher</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-primary shadow-sm" />
            <div>
              <p className="font-semibold text-sm">Neon DB Frankfurt</p>
              <p className="text-xs text-muted-foreground">PostgreSQL Datenbank</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/40 shadow-sm" />
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
