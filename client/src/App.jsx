import { Navigate, Route, Routes, useLocation, Link } from 'react-router-dom';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AdminPage from './pages/AdminPage.jsx';

function Protected({ admin = false, children }) {
  const { user } = useAuth(); const location = useLocation();
  // Estas guardas mejoran la navegación. Express vuelve a comprobar cada permiso.
  if (!user) return <Navigate to="/acceso" state={{ from: location.pathname }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
export default function App() {
  // Cada página tiene URL propia: el historial y los enlaces funcionan con React Router.
  return <Routes><Route element={<Layout />}>
    <Route path="/" element={<CatalogPage key="catalog" />} />
    <Route path="/acceso" element={<AuthPage key="login" />} />
    <Route path="/registro" element={<AuthPage key="register" registerMode />} />
    <Route path="/mi-biblioteca" element={<Protected><CatalogPage key="favorites" favorites /></Protected>} />
    <Route path="/mi-cuenta" element={<Protected><ProfilePage /></Protected>} />
    <Route path="/administracion" element={<Protected admin><AdminPage /></Protected>} />
    <Route path="*" element={<Box className="panel"><Heading className="serif">Esta página aún no tiene historia.</Heading><Text mt="4"><Link to="/">Volver al catálogo →</Link></Text></Box>} />
  </Route></Routes>;
}
