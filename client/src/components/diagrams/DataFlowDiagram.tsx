import { Cloud, Database, Zap, Server, Shield, ArrowRight } from "lucide-react";

export function DataFlowDiagram() {
  return (
    <div className="w-full p-8 bg-background rounded-lg border-2 border-primary/20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
        {/* Step 1: Upload */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-2 border-primary/30">
              <Cloud className="h-10 w-10 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">1</span>
            </div>
          </div>
          <h3 className="font-bold text-lg mb-2">Upload</h3>
          <p className="text-sm text-muted-foreground">
            TLS 1.3-verschlüsselte<br />Übertragung
          </p>
        </div>

        {/* Arrow 1 */}
        <div className="hidden md:flex items-center justify-center flex-shrink-0">
          <ArrowRight className="h-8 w-8 text-primary" />
        </div>
        <div className="md:hidden flex items-center justify-center flex-shrink-0 rotate-90">
          <ArrowRight className="h-8 w-8 text-primary" />
        </div>

        {/* Step 2: Neon DB */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-2 border-primary/30">
              <Database className="h-10 w-10 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">2</span>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-semibold">
                <span>EU</span>
              </div>
            </div>
          </div>
          <h3 className="font-bold text-lg mb-2 mt-4">Neon PostgreSQL</h3>
          <p className="text-sm text-muted-foreground">
            Frankfurt,<br />Deutschland
          </p>
        </div>

        {/* Arrow 2 */}
        <div className="hidden md:flex items-center justify-center flex-shrink-0">
          <ArrowRight className="h-8 w-8 text-primary" />
        </div>
        <div className="md:hidden flex items-center justify-center flex-shrink-0 rotate-90">
          <ArrowRight className="h-8 w-8 text-primary" />
        </div>

        {/* Step 3: Azure OpenAI */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-2 border-primary/30">
              <Zap className="h-10 w-10 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-semibold">
                <span>EU</span>
              </div>
            </div>
          </div>
          <h3 className="font-bold text-lg mb-2 mt-4">Azure OpenAI</h3>
          <p className="text-sm text-muted-foreground">
            EU-Rechenzentren<br />Keine Speicherung
          </p>
        </div>

        {/* Arrow 3 */}
        <div className="hidden md:flex items-center justify-center flex-shrink-0">
          <ArrowRight className="h-8 w-8 text-primary" />
        </div>
        <div className="md:hidden flex items-center justify-center flex-shrink-0 rotate-90">
          <ArrowRight className="h-8 w-8 text-primary" />
        </div>

        {/* Step 4: IONOS S3 */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-2 border-primary/30">
              <Server className="h-10 w-10 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">4</span>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-semibold">
                <span>EU</span>
              </div>
            </div>
          </div>
          <h3 className="font-bold text-lg mb-2 mt-4">IONOS S3</h3>
          <p className="text-sm text-muted-foreground">
            Frankfurt,<br />AES-256 verschlüsselt
          </p>
        </div>
      </div>

      {/* Security Badge */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Shield className="h-5 w-5" />
          <span className="font-semibold">100% EU-Infrastruktur – Ihre Daten verlassen niemals die Europäische Union</span>
        </div>
      </div>
    </div>
  );
}
