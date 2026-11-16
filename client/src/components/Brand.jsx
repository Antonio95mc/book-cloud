import { useState } from 'react';
import { BookOpen, Cloud } from 'lucide-react';

// La imagen original se muestra si está en public/book-cloud-logo.png.
// El fallback mantiene el nombre accesible mientras se copia el archivo local.
export default function Brand({ small = false }) {
  const [missing, setMissing] = useState(false);
  return <span className={`brand-mark ${small ? 'brand-small' : ''}`}>
    {!missing ? <img src="/book-cloud-logo.png" alt="Book Cloud" onError={() => setMissing(true)} /> : <>
      <span className="brand-symbol" aria-hidden="true"><Cloud /><BookOpen /></span>
      <span className="brand-word">Book<span>Cloud</span></span>
    </>}
  </span>;
}
