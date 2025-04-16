
import { Box, ChakraProvider, Container } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react';
import Head from 'next/head';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white'
      }
    }
  }
});

export const Layout = ({ children }) => {
  return (
    <ChakraProvider theme={theme}>
      <Head>
        <title>Social Video Chat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box minH="100vh" bg="gray.900">
        <Container maxW="container.xl" py={4}>
          {children}
        </Container>
      </Box>
    </ChakraProvider>
  );
};
