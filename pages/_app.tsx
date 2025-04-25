import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import { Layout } from "../components/Layout";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { extendTheme } from "@chakra-ui/react";
import { useAuthStateListener, useAuthErrorToast } from "../store/userStore";
import ErrorBoundary from "../components/ErrorBoundary";
import { useEffect } from "react";
import { db } from "../firebase/config";
import { handleNetworkStatus } from "../lib/firebase";

// Define the theme
const theme = extendTheme({
  styles: {
    global: (props: any) => ({
      "html, body": {
        backgroundColor: props.colorMode === "dark" ? "gray.900" : "white",
        color: props.colorMode === "dark" ? "white" : "gray.800",
      },
    }),
  },
  config: {
    initialColorMode: "dark",
    useSystemColorMode: true,
    cssVarPrefix: "loopin",
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Initialize auth state listener
  useAuthStateListener();

  // Initialize auth error toast handling
  useAuthErrorToast();

  // Set up network status monitoring for Firebase
  useEffect(() => {
    // Use the centralized network status handler from firebase.ts
    handleNetworkStatus();
  }, []);

  // Allow pages to opt out of using the Layout
  const getLayout =
    (Component as any).getLayout ||
    ((page: React.ReactElement) => <Layout>{page}</Layout>);

  return (
    <ChakraProvider theme={theme}>
      <ErrorBoundary>
        <AnimatePresence mode="wait" initial={false}>
          {getLayout(<Component {...pageProps} key={router.route} />)}
        </AnimatePresence>
      </ErrorBoundary>
    </ChakraProvider>
  );
}

export default MyApp;
