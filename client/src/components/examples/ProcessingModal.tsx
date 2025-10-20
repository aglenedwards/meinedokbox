import { useState } from 'react';
import { ProcessingModal } from '../ProcessingModal';
import { Button } from '@/components/ui/button';

export default function ProcessingModalExample() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  return (
    <div className="p-4 space-y-2">
      <Button onClick={() => { setStatus('processing'); setOpen(true); }}>
        Show Processing
      </Button>
      <Button onClick={() => { setStatus('success'); setOpen(true); }}>
        Show Success
      </Button>
      <Button onClick={() => { setStatus('error'); setOpen(true); }}>
        Show Error
      </Button>
      
      <ProcessingModal
        open={open}
        status={status}
        progress={65}
        detectedCategory="Rechnung"
        onClose={() => setOpen(false)}
        onAddAnother={() => { setOpen(false); console.log('Add another'); }}
      />
    </div>
  );
}
