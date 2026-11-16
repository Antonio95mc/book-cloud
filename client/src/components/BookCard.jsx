import { memo } from 'react';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { Heart, Pencil, Trash2 } from 'lucide-react';
const palettes = ['#008e8a', '#173e68', '#507d9d', '#316d7a', '#505e8d', '#267b74'];

function BookCard({ book, favorite, onFavorite, busy, admin, onEdit, onDelete }) {
  // La tarjeta no consulta contexto: solo cambia cuando cambian sus props.
  const color = palettes[Number(book.isbn.slice(-2)) % palettes.length];
  return <Box as="article" className="book-card">
    <Box className="cover-stage">
      <Box className="book-cover" style={{ '--cover': color }}>
        <Text className="cover-kicker">BIBLIOTECA · BOOK CLOUD</Text>
        <Heading className="cover-title">{book.title}</Heading>
        <Box className="cover-art" aria-hidden="true"><span /><span /><span /></Box>
        <Text className="cover-author">{book.author}</Text>
      </Box>
      <Button className="heart-button" aria-label={`${favorite ? 'Quitar' : 'Añadir'} ${book.title} ${favorite ? 'de' : 'a'} favoritos`} aria-pressed={favorite} disabled={busy} onClick={() => onFavorite(book, favorite)} variant="plain">
        <Heart size={20} fill={favorite ? '#008e8a' : 'none'} color={favorite ? '#008e8a' : '#06264d'} />
      </Button>
    </Box>
    <Text fontSize="xs" letterSpacing=".12em" color="#58738a" mt="5" mb="2">LITERATURA · {book.isbn}</Text>
    <Heading as="h3" size="lg" className="serif">{book.title}</Heading>
    <Text color="#546a80" mt="1" fontSize="sm">{book.author}</Text>
    {admin && <Flex gap="2" mt="4" wrap="wrap">
      <Button size="xs" variant="outline" disabled={busy} onClick={() => onEdit(book)}><Pencil size={13} />Editar</Button>
      <Button size="xs" variant="ghost" color="#9c3535" disabled={busy} onClick={() => onDelete(book)}><Trash2 size={13} />Eliminar</Button>
    </Flex>}
  </Box>;
}


// Con callbacks estables, escribir en el buscador no vuelve a ejecutar cada tarjeta.
export default memo(BookCard);
