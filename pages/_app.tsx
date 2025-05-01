import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import { Layout } from "../components/Layout";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { extendTheme } from "@chakra-ui/react";
import {
  useAuthStateListener,
  useAuthErrorToast,
  useUserStore,
} from "../store/userStore";
import ErrorBoundary from "../components/ErrorBoundary";
import dynamic from "next/dynamic";

// Only include AuthDebugger in development mode
const AuthDebugger =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("../components/debug/AuthDebugger"), { ssr: false })
    : () => null;

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
  const user = useUserStore((state) => state.user);
  const isAuthenticated = !!user;

  // Initialize auth state listener
  useAuthStateListener();

  // Initialize auth error toast handling
  useAuthErrorToast();

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
        {/* Only render AuthDebugger in development */}
        {process.env.NODE_ENV === "development" && <AuthDebugger />}
      </ErrorBoundary>
    </ChakraProvider>
  );
}

export default MyApp;
