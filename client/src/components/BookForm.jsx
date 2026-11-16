import { useForm } from 'react-hook-form';
import { Box, Button, Flex, Heading, Input, SimpleGrid, Text } from '@chakra-ui/react';
import { X } from 'lucide-react';
import Field from './Field.jsx';

export default function BookForm({ book, onSave, onClose, busy }) {
  // Inputs no controlados: React Hook Form guarda sus valores sin renderizar en cada tecla.
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: book || { title: '', author: '', isbn: '' } });
  return <Box className="panel" mt="6" mb="8" border="2px solid #06264d">
    <Flex justify="space-between" mb="5"><Heading as="h2" className="serif" size="2xl">{book ? 'Editar libro' : 'Una nueva historia'}</Heading><Button aria-label="Cerrar editor" variant="plain" disabled={busy} onClick={onClose}><X size={18} /></Button></Flex>
    <form onSubmit={handleSubmit(onSave)}>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="5">{[['title', 'Título', 150], ['author', 'Autor', 100], ['isbn', 'ISBN (13 dígitos)', 13]].map(([key, label, max]) => <Field key={key} label={label}>
        <Input aria-invalid={!!errors[key]} {...register(key, { required: 'Campo obligatorio', maxLength: { value: max, message: `Máximo ${max} caracteres` }, validate: value => key === 'isbn' ? /^\d{13}$/.test(value) || 'Introduce 13 dígitos' : !!value.trim() || 'No puede estar vacío' })} />
        {errors[key] && <Text role="alert" color="red.700" fontSize="sm" mt="2">{errors[key].message}</Text>}
      </Field>)}</SimpleGrid><Button className="primary" mt="5" type="submit" loading={busy}>Guardar libro</Button>
    </form>
  </Box>;
}
