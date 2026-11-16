import { useCallback, useRef, useState } from 'react';
import { api } from '../api.js';
import { useAuth, useAuthActions } from '../context/AuthContext.jsx';

// Estado local por página: un formulario no hace renderizar el catálogo completo.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const lock = useRef(false);
  const { token } = useAuth();
  const { logout, updateUser } = useAuthActions();
  const run = useCallback(async (task, message) => {
    // La ref bloquea incluso dos clics anteriores al siguiente render de React.
    if (lock.current) return false;
    lock.current = true; setBusy(true); setNotice(null);
    try { await task(); if (message) setNotice({ text: message }); return true; }
    catch (error) {
      if (error.status === 401 && token) logout();
      if (error.status === 403 && token) {
        try { updateUser(await api('/users/me', { token })); } catch { /* La siguiente petición revalida la sesión. */ }
      }
      setNotice({ error: true, text: error.message }); return false;
    } finally { lock.current = false; setBusy(false); }
  }, [token, logout, updateUser]);
  return { busy, notice, run };
}
