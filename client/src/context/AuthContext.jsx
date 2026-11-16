import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);
const AuthActionsContext = createContext(null);

export function AuthProvider({ children }) {
  // La sesión es compartida por las páginas y el menú, pero no persiste tras recargar.
  const [session, setSession] = useState({ user: null, token: '' });
  const logout = useCallback(() => setSession({ user: null, token: '' }), []);
  const login = useCallback(async (email, password) => {
    const { token } = await api('/auth/login', { method: 'POST', body: { email, password } });
    const user = await api('/users/me', { token });
    setSession({ user, token });
  }, []);
  const updateUser = useCallback(user => setSession(current => ({ ...current, user })), []);
  // Separar acciones y datos evita suscribir al usuario a componentes que solo cierran sesión.
  const actions = useMemo(() => ({ login, logout, updateUser }), [login, logout, updateUser]);
  return <AuthActionsContext.Provider value={actions}><AuthContext.Provider value={session}>{children}</AuthContext.Provider></AuthActionsContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  return context;
}
export function useAuthActions() {
  const context = useContext(AuthActionsContext);
  if (!context) throw new Error('useAuthActions necesita AuthProvider');
  return context;
}
