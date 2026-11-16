import { useEffect, useState } from 'react';
import { Badge, Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { Trash2 } from 'lucide-react';
import { api } from '../api.js';
import { useAuth, useAuthActions } from '../context/AuthContext.jsx';
import { useAction } from '../hooks/useAction.js';
import Notice from '../components/Notice.jsx';
export default function AdminPage() {
  const { user, token } = useAuth(); const { updateUser, logout } = useAuthActions();
  const { busy, notice, run } = useAction();
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    api('/users', { token, signal: controller.signal }).then(setUsers).catch(err => {
      if (err.name !== 'AbortError') { setError(err.message); if (err.status === 401) logout(); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, logout]);
  async function changeRole(person) {
    const role = person.role === 'admin' ? 'user' : 'admin';
    if (window.confirm(`¿Cambiar el rol de ${person.name} a ${role}?`)) run(async () => {
      await api(`/users/${person._id}/role`, { token, method: 'PATCH', body: { role } });
      const fresh = await api('/users/me', { token }); updateUser(fresh);
      if (fresh.role === 'admin') setUsers(await api('/users', { token }));
    }, 'Permisos actualizados.');
  }
  async function remove(person) {
    if (window.confirm(`¿Eliminar la cuenta y la foto de ${person.name}?`)) run(async () => {
      await api(`/users/${person._id}`, { token, method: 'DELETE' });
      if (person._id === user._id) logout(); else setUsers(await api('/users', { token }));
    }, 'Cuenta eliminada.');
  }
  return <Box className="panel"><Notice notice={notice} /><Text className="eyebrow">GESTIÓN DE LA COMUNIDAD</Text><Heading as="h1" className="serif" size="3xl" mb="3">Personas que comparten historias.</Heading><Text mb="7">Gestiona cuentas y permisos. Se muestran hasta 100 usuarios.</Text>
    {loading ? <Text role="status">Cargando usuarios…</Text> : error ? <Text role="alert">{error}</Text> : <Stack gap="0">{users.map(person => <Flex key={person._id} className="user-row" align="center" gap="4" wrap="wrap"><img src={person.image} alt="" className="avatar" /><Box flex="1" minW="150px"><Text fontWeight="600">{person.name}{person._id === user._id ? ' (tú)' : ''}</Text><Text fontSize="sm" overflowWrap="anywhere">{person.email}</Text></Box><Badge>{person.role}</Badge><Button size="sm" variant="outline" disabled={busy} onClick={() => changeRole(person)}>{person.role === 'admin' ? 'Hacer lector' : 'Hacer admin'}</Button><Button size="sm" variant="ghost" color="#9c3535" aria-label={`Eliminar cuenta de ${person.name}`} disabled={busy} onClick={() => remove(person)}><Trash2 size={17} /></Button></Flex>)}</Stack>}
  </Box>;
}
