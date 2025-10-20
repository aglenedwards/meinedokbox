import { EmptyState } from '../EmptyState';

export default function EmptyStateExample() {
  return (
    <EmptyState
      title="Keine Dokumente gefunden"
      description="Laden Sie Ihr erstes Dokument hoch, um loszulegen."
      actionLabel="Dokument hochladen"
      onAction={() => console.log('Upload clicked')}
    />
  );
}
