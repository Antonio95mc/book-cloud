import { Box, Text } from '@chakra-ui/react';

export default function Field({ label, children }) {
  // El label envuelve el campo para que también se pueda activar pulsando su texto.
  return <Box as="label" display="block"><Text as="span" display="block" fontSize="sm" fontWeight="600" mb="2">{label}</Text>{children}</Box>;
}

