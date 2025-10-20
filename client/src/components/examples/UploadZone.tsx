import { UploadZone } from '../UploadZone';

export default function UploadZoneExample() {
  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name);
  };

  return <UploadZone onFileSelect={handleFileSelect} />;
}
