import { FileText, HardDrive, TrendingUp } from 'lucide-react';
import { StatsCard } from '../StatsCard';

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <StatsCard
        title="Gesamt Dokumente"
        value={127}
        icon={FileText}
        description="+12 diesen Monat"
      />
      <StatsCard
        title="Speicher verwendet"
        value="2.4 GB"
        icon={HardDrive}
        description="von 10 GB"
      />
      <StatsCard
        title="Diesen Monat"
        value={23}
        icon={TrendingUp}
        description="hochgeladen"
      />
    </div>
  );
}
