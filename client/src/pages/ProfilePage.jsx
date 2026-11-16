import { useForm } from 'react-hook-form';
import { Box, Badge, Button, Flex, Heading, Input, Text } from '@chakra-ui/react';
import { LogOut, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import { useAuth, useAuthActions } from '../context/AuthContext.jsx';
import { useAction } from '../hooks/useAction.js';
import Field from '../components/Field.jsx';
import Notice from '../components/Notice.jsx';
export default function ProfilePage() {
  const { user, token } = useAuth(); const { updateUser, logout } = useAuthActions();
  const { busy, notice, run } = useAction();
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { name: user.name } });
  return <Box className="panel" maxW="600px" mx="auto"><Notice notice={notice} />
    <Flex gap="5" align="center" mb="7" wrap="wrap"><img className="avatar profile" src={user.image} alt={`Foto de ${user.name}`} /><Box minW="0"><Text className="eyebrow">MI CUENTA</Text><Heading as="h1" className="serif" size="2xl">{user.name}</Heading><Text overflowWrap="anywhere">{user.email}</Text><Badge mt="2">{user.role === 'admin' ? 'Administrador' : 'Lector'}</Badge></Box></Flex>
    <form onSubmit={handleSubmit(values => run(async () => {
      await api(`/users/${user._id}`, { token, method: 'PATCH', body: values });
      updateUser(await api('/users/me', { token }));
    }, 'Nombre actualizado.'))}><Field label="Nombre"><Input {...register('name', { required: 'Introduce tu nombre', maxLength: 80, validate: v => !!v.trim() || 'No puede estar vacío' })} />{errors.name && <Text role="alert">{errors.name.message}</Text>}</Field><Button mt="4" className="primary" type="submit" loading={busy}>Guardar cambios</Button></form>
    <Button mt="7" variant="outline" disabled={busy} onClick={logout}><LogOut size={16} />Cerrar sesión</Button>
    <Box borderTop="1px solid #dce8ef" mt="8" pt="7"><Heading size="lg">Eliminar mi cuenta</Heading><Text fontSize="sm" mt="2" mb="4">Se eliminarán tu perfil, tu foto y tus favoritos. Esta acción no se puede deshacer.</Text><Button colorPalette="red" variant="outline" disabled={busy} onClick={() => {
      if (window.confirm('¿Eliminar definitivamente tu cuenta y tu foto?')) run(async () => { await api(`/users/${user._id}`, { token, method: 'DELETE' }); logout(); });
    }}><Trash2 size={16} />Eliminar mi cuenta</Button></Box>
  </Box>;
}
