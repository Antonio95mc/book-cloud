import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import demoCatalog from '../../../data/books.json';

// Custom hook de datos: aísla petición, carga, error, cancelación y reintento.
export function useBooks(enabled = true) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(null);
  const reload = useCallback(async () => {
    active.current?.abort();
    const controller = new AbortController(); active.current = controller;
    setLoading(true); setError('');
    try { setBooks(await api('/books', { signal: controller.signal })); setDemo(false); }
    catch (err) { if (err.name !== 'AbortError') {
      // Estos IDs solo sirven como claves visuales; nunca se mandan a MongoDB.
      setBooks(demoCatalog.map(book => ({ ...book, _id: `demo-${book.isbn}` })));
      setDemo(true); setError('Catálogo de demostración. Conecta el servidor y carga la semilla para activar cuentas y favoritos.');
    } }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    // La petición pertenece al ciclo de vida del hook y se cancela al abandonar la página.
    if (enabled) reload(); else setLoading(false);
    return () => active.current?.abort();
  }, [reload, enabled]);
  return { books, loading, error, reload, demo };
}
