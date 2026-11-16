import { Box } from '@chakra-ui/react';
export default function Notice({ notice }) {
  if (!notice) return null;
  return <Box mb="6" role={notice.error ? 'alert' : 'status'} className={`notice ${notice.error ? 'error' : ''}`}>{notice.text}</Box>;
}
