import Brand from './Brand.jsx';
import { Box, Button, Container, Flex, Text } from '@chakra-ui/react';
import { Heart, Shield, ArrowUpRight } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
export default function Layout() {
  const { user } = useAuth();
  return <Box minH="100vh" bg="#f4f9fc" color="#06264d"><Container maxW="1240px" px={{ base: '5', md: '10' }}>
    <Flex as="header" className="header" align="center" justify="space-between" gap="5" wrap="wrap">
      <NavLink className="brand" to="/" aria-label="Book Cloud, inicio"><Brand /></NavLink>
      <Flex as="nav" aria-label="Navegación principal" gap={{ base: '2', md: '5' }} align="center" wrap="wrap">
        <NavLink to="/" end className="nav-link">Explorar</NavLink>
        {user && <NavLink to="/mi-biblioteca" className="nav-link"><Heart size={16} />Mi biblioteca</NavLink>}
        {user?.role === 'admin' && <NavLink to="/administracion" className="nav-link"><Shield size={16} />Administración</NavLink>}
        {user ? <NavLink to="/mi-cuenta" className="nav-link"><img src={user.image} alt="" className="avatar small" />{user.name}</NavLink> : <Button asChild className="primary"><NavLink to="/acceso">Entrar<ArrowUpRight size={16} /></NavLink></Button>}
      </Flex>
    </Flex>
    <Box as="main" pb="20" minH="70vh"><Outlet /></Box>
    <Flex as="footer" py="7" borderTop="1px solid #dce8ef" align="center" justify="center" gap="5" wrap="wrap"><NavLink to="/" aria-label="Book Cloud, inicio"><Brand small /></NavLink><Text className="footer-tagline">Historias en la nube</Text></Flex>
  </Container></Box>;
}
