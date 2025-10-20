import { DocumentCard } from '../DocumentCard';

export default function DocumentCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <DocumentCard
        id="1"
        title="Versicherungspolice Autoversicherung 2024"
        category="Versicherung"
        date="15. Okt 2024"
        onView={() => console.log('View document')}
        onDelete={() => console.log('Delete document')}
      />
      <DocumentCard
        id="2"
        title="Mietvertrag Wohnung"
        category="Vertrag"
        date="1. Jan 2024"
        onView={() => console.log('View document')}
        onDelete={() => console.log('Delete document')}
      />
      <DocumentCard
        id="3"
        title="Stromrechnung März 2024"
        category="Rechnung"
        date="3. Apr 2024"
        onView={() => console.log('View document')}
        onDelete={() => console.log('Delete document')}
      />
    </div>
  );
}
