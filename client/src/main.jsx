import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import './styles.css';

// Chakra v3 necesita un sistema de estilos en su proveedor raíz.
// Todos los componentes hijos pueden usar sus props de diseño y accesibilidad.
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider value={defaultSystem}>
      <BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);
