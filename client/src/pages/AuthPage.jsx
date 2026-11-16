import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Flex, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { ArrowUpRight, UserRound } from 'lucide-react';
import Field from '../components/Field.jsx';
import Notice from '../components/Notice.jsx';
import { api } from '../api.js';
import { useAuth, useAuthActions } from '../context/AuthContext.jsx';
import { useAction } from '../hooks/useAction.js';

export default function AuthPage({ registerMode = false }) {
  const { user } = useAuth(); const { login } = useAuthActions();
  const navigate = useNavigate(); const location = useLocation();
  const { busy, notice, run } = useAction();
  const [file, setFile] = useState(null); const [preview, setPreview] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const destination = location.state?.from || '/';
  if (user) return <Navigate to={destination} replace />;
  async function submit(values) {
    await run(async () => {
      if (registerMode) {
        // La foto es un File real; FormData permite enviarla junto al texto.
        const form = new FormData();
        form.set('name', values.name); form.set('email', values.email); form.set('password', values.password); form.set('image', values.image[0]);
        await api('/auth/register', { method: 'POST', body: form });
      }
      await login(values.email, values.password);
      navigate(destination, { replace: true });
    });
  }
  return <Box className="panel" maxW="500px" mx="auto">
    <Notice notice={notice} /><Text className="eyebrow">TU ESPACIO DE LECTURA</Text>
    <Heading as="h1" className="serif" size="3xl" mb="3">{registerMode ? 'Cada historia empieza aquí.' : 'Qué bien volver a verte.'}</Heading><Text color="#546a80" mb="7">Guarda esos libros que no quieres dejar escapar.</Text>
    <form onSubmit={handleSubmit(submit)}><Stack gap="5">
      {registerMode && <Field label="Tu nombre"><Input autoComplete="name" {...register('name', { required: 'Introduce tu nombre', maxLength: 80, validate: v => !!v.trim() || 'Introduce un nombre válido' })} />{errors.name && <Text role="alert">{errors.name.message}</Text>}</Field>}
      <Field label="Correo electrónico"><Input type="email" autoComplete="email" {...register('email', { required: 'Introduce tu correo', maxLength: 254 })} />{errors.email && <Text role="alert">{errors.email.message}</Text>}</Field>
      <Field label="Contraseña"><Input type="password" autoComplete={registerMode ? 'new-password' : 'current-password'} {...register('password', { required: 'Introduce tu contraseña', minLength: { value: 8, message: 'Al menos 8 caracteres' }, maxLength: { value: 72, message: 'Máximo 72 caracteres' } })} />{errors.password && <Text role="alert">{errors.password.message}</Text>}</Field>
      {registerMode && <Field label="Tu foto de perfil"><Flex align="center" gap="4" mb="3">{preview ? <img src={preview} alt="Vista previa de tu foto" className="avatar preview" /> : <Box className="avatar-placeholder"><UserRound size={25} /></Box>}<Text fontSize="sm">JPG, PNG o WebP. Máximo 5 MB.</Text></Flex>
        <input type="file" accept="image/jpeg,image/png,image/webp" {...register('image', { validate: files => {
          const image = files?.[0];
          if (!image) return 'Selecciona una foto';
          return (['image/jpeg', 'image/png', 'image/webp'].includes(image.type) && image.size <= 5 * 1024 * 1024) || 'Imagen no admitida o mayor de 5 MB';
        }, onChange: event => setFile(event.target.files?.[0] || null) })} />{errors.image && <Text role="alert" color="red.700">{errors.image.message}</Text>}
      </Field>}
      <Button type="submit" className="primary" loading={busy}>{registerMode ? 'Crear mi biblioteca' : 'Entrar'}<ArrowUpRight size={18} /></Button>
      <Button type="button" variant="plain" disabled={busy} onClick={() => navigate(registerMode ? '/acceso' : '/registro', { state: location.state })}>{registerMode ? 'Ya tengo una cuenta →' : '¿Primera vez? Crea tu cuenta →'}</Button>
    </Stack></form>
  </Box>;
}
