import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Box, Button, Flex, Heading, Input, SimpleGrid, Text } from '@chakra-ui/react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { api } from '../api.js';
import { useBooks } from '../hooks/useBooks.js';
import { useAction } from '../hooks/useAction.js';
import { useAuth, useAuthActions } from '../context/AuthContext.jsx';
import BookCard from '../components/BookCard.jsx';
import BookForm from '../components/BookForm.jsx';
import Notice from '../components/Notice.jsx';

export default function CatalogPage({ favorites = false }) {
  const { books, loading, error, reload, demo } = useBooks(!favorites);
  const { user, token } = useAuth(); const { updateUser } = useAuthActions();
  const { busy, notice, run } = useAction();
  const [query, setQuery] = useState(''); const [editing, setEditing] = useState(null);
  const navigate = useNavigate(); const admin = !demo && user?.role === 'admin';
  const userId = user?._id;
  const source = favorites ? user?.books : books;
  // Solo recalculamos filtrado e índice de favoritos si cambian sus datos de entradaaaaaa
  const favoriteIds = useMemo(() => new Set(user?.books.map(book => book._id) || []), [user?.books]);
  const visible = useMemo(() => {
    const search = query.toLocaleLowerCase('es').trim();
    return (source || []).filter(book => `${book.title} ${book.author}`.toLocaleLowerCase('es').includes(search));
  }, [source, query]);
  const onFavorite = useCallback((book, exists) => {
    if (demo) return;
    if (!userId) { navigate('/acceso'); return; }
    run(async () => {
      updateUser(await api(`/users/${userId}/books${exists ? `/${book._id}` : ''}`, { token, method: exists ? 'DELETE' : 'POST', ...(exists ? {} : { body: { books: [book._id] } }) }));
    }, exists ? 'Libro retirado de tus favoritos.' : 'Una nueva historia en tus favoritos.');
  }, [userId, token, navigate, run, updateUser, demo]);
  const onEdit = useCallback(book => setEditing(book), []);
  const onDelete = useCallback(book => {
    if (window.confirm(`¿Eliminar «${book.title}» y sus referencias en favoritos?`)) run(async () => {
      await api(`/books/${book._id}`, { token, method: 'DELETE' });
      await reload(); updateUser(await api('/users/me', { token }));
    }, 'Libro eliminado.');
  }, [token, reload, updateUser, run]);
  const closeEditor = useCallback(() => setEditing(null), []);
  async function saveBook(values) {
    await run(async () => {
      await api(editing._id ? `/books/${editing._id}` : '/books', { token, method: editing._id ? 'PATCH' : 'POST', body: values });
      await reload(); updateUser(await api('/users/me', { token })); setEditing(null);
    }, 'Libro guardado.');
  }
  return <>
    <Notice notice={notice} />
    {demo && <Box className="notice" mb="6" role="status"><Text>{error}</Text><Button size="sm" mt="3" variant="outline" onClick={reload}>Reintentar conexión</Button></Box>}
    <SimpleGrid columns={{ base: 1, md: 2 }} gap="10" alignItems="center" className="hero">
      <Box><Text className="eyebrow">UNA PAUSA. UN LIBRO. OTRO MUNDO.</Text><Heading as="h1" className="hero-title">{favorites ? <>Las historias<br />que <em>te esperan.</em></> : <>Tu próxima historia<br />empieza <em>aquí.</em></>}</Heading><Text maxW="420px" color="#546a80" lineHeight="1.8" mt="6">{favorites ? 'Tu selección personal, siempre a mano. Un pequeño universo con mucho por descubrir.' : 'Descubre grandes historias, guarda tus favoritos y construye una biblioteca tan única como tú.'}</Text><Flex mt="7" gap="4" align="center"><Badge colorPalette="teal" borderRadius="full" px="3" py="1">{source?.length || 0} libros{favorites ? ' guardados' : ' en el catálogo'}</Badge></Flex></Box>
      <Box className="hero-art" aria-hidden="true"><span className="sun" /><div className="hero-book back">HISTORIAS<br />QUE QUEDAN</div><div className="hero-book front"><span>BOOK CLOUD</span><strong>Un mundo<br />entre<br /><i>páginas.</i></strong><BookOpen size={42} strokeWidth={1} /><small>LA VIDA SE LEE MEJOR</small></div></Box>
    </SimpleGrid>
    <Flex justify="space-between" align="center" wrap="wrap" gap="5" mb="8" mt="12"><Box><Text className="eyebrow">{favorites ? 'TU SELECCIÓN' : 'EL PLACER DE DESCUBRIR'}</Text><Heading as="h2" size="3xl" className="serif">{favorites ? 'Mi biblioteca' : 'Explora el catálogo'}</Heading></Box><Flex className="search-box" align="center" gap="2"><Search size={18} /><Input aria-label="Buscar por título o autor" variant="flushed" border="0" placeholder="Buscar título o autor…" value={query} onChange={e => setQuery(e.target.value)} /></Flex></Flex>
    {admin && !favorites && <Button className="primary" mb="6" onClick={() => setEditing({})}><Plus size={17} />Añadir libro</Button>}
    {editing && admin && <BookForm key={editing._id || 'new'} book={editing._id ? { title: editing.title, author: editing.author, isbn: editing.isbn } : null} onSave={saveBook} onClose={closeEditor} busy={busy} />}
    {loading ? <Text role="status" py="12">Abriendo las páginas del catálogo…</Text> : error && !demo ? <Box className="panel"><Text role="alert" mb="4">{error}</Text><Button onClick={reload}>Reintentar</Button></Box> : visible.length ? <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={{ base: '8', lg: '10' }}>{visible.map(book => <BookCard key={book._id} book={book} favorite={favoriteIds.has(book._id)} busy={busy || demo} admin={admin && !favorites} onFavorite={onFavorite} onEdit={onEdit} onDelete={onDelete} />)}</SimpleGrid> : <Box className="panel" textAlign="center" py="12"><Heading className="serif" size="xl">{query ? 'No encontramos esa historia' : 'Todo empieza con un primer libro'}</Heading><Text mt="3" color="#546a80">{query ? 'Prueba con otro título o autor.' : favorites ? 'Pulsa el corazón de un libro para guardarlo aquí.' : 'Todavía no hay libros. El administrador puede añadirlos o cargar la semilla.'}</Text></Box>}
  </>;
}
