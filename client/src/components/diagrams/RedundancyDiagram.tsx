import { Server, HardDrive, CheckCircle2, Copy } from "lucide-react";

export function RedundancyDiagram() {
  return (
    <div className="w-full p-8 bg-background rounded-lg border-2 border-primary/20">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">IONOS S3 Multi-Availability-Zone Architektur</h3>
        <p className="text-muted-foreground">Automatische Replikation über mehrere physisch getrennte Rechenzentren</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Availability Zone 1 */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-32 h-40 rounded-lg bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary/30 flex flex-col items-center justify-center p-4">
              <Server className="h-12 w-12 text-primary mb-2" />
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <div className="h-1 w-12 bg-primary/60 rounded" />
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <div className="h-1 w-12 bg-primary/60 rounded" />
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <div className="h-1 w-12 bg-primary/60 rounded" />
                </div>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              AZ1
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <h4 className="font-bold mb-1">Availability Zone 1</h4>
          <p className="text-sm text-muted-foreground text-center">Frankfurt Ost</p>
        </div>

        {/* Availability Zone 2 */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-32 h-40 rounded-lg bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary/30 flex flex-col items-center justify-center p-4">
              <Server className="h-12 w-12 text-primary mb-2" />
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <div className="h-1 w-12 bg-primary/60 rounded" />
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <div className="h-1 w-12 bg-primary/60 rounded" />
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <div className="h-1 w-12 bg-primary/60 rounded" />
                </div>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              AZ2
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <h4 className="font-bold mb-1">Availability Zone 2</h4>
          <p className="text-sm text-muted-foreground text-center">Frankfurt West</p>
        </div>

        {/* Availability Zone 3 */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-32 h-40 rounded-lg bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary/30 flex flex-col items-center justify-center p-4">
              <Server className="h-12 w-12 text-primary mb-2" />
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <div className="h-1 w-12 bg-primary/60 rounded" />
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <div className="h-1 w-12 bg-primary/60 rounded" />
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <div className="h-1 w-12 bg-primary/60 rounded" />
                </div>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              AZ3
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <h4 className="font-bold mb-1">Availability Zone 3</h4>
          <p className="text-sm text-muted-foreground text-center">Frankfurt Nord</p>
        </div>
      </div>

      {/* Replication indicator */}
      <div className="relative h-16 mb-8">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 flex items-center gap-2">
          <Copy className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-primary">Automatische Echtzeit-Replikation</span>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-border">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-sm mb-1">99.99% Verfügbarkeit</h5>
            <p className="text-xs text-muted-foreground">Garantierte Uptime-SLA</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-sm mb-1">11 Neunen Haltbarkeit</h5>
            <p className="text-xs text-muted-foreground">99.999999999% Datensicherheit</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-sm mb-1">Automatisches Failover</h5>
            <p className="text-xs text-muted-foreground">Bei Rechenzentrumsausfall</p>
          </div>
        </div>
      </div>
    </div>
  );
}
