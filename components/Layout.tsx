import { ReactNode } from "react";
import { Box, Container, useColorModeValue } from "@chakra-ui/react";
import { BottomNav } from "./navigation/BottomNav";
import { useRouter } from "next/router";
import { useUserStore } from "../store/userStore";
import { useCoinStore } from "../store/coinStore";
import { motion } from "framer-motion";
import Head from "next/head";
import ConnectionStatusHandler from "./ConnectionStatusHandler";
import { useEffect } from "react";
import testRealtimeDatabase from "../lib/firebase-test";

interface LayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
}

export const Layout = ({ children, hideBottomNav = false }: LayoutProps) => {
  const router = useRouter();
  const { user, isLoading } = useUserStore();
  const { loadUserCoins } = useCoinStore();
  const bgColor = useColorModeValue("gray.50", "gray.900"); // Allow light mode

  // Only show bottom nav for logged in users
  const showBottomNav = user && !hideBottomNav && !isLoading;

  // Check Firebase database connection on component mount
  useEffect(() => {
    if (user) {
      console.log("[LAYOUT] Testing Firebase connection...");
      testRealtimeDatabase()
        .then((result) => {
          console.log("[LAYOUT] Firebase connection test result:", result);
        })
        .catch((error) => {
          console.error("[LAYOUT] Firebase connection test error:", error);
        });
    }
  }, [user]);

  // Handle retry connection for data loading
  const handleRetryConnection = () => {
    console.log("Retrying connection from Layout...");
    // Test the connection again after retry
    testRealtimeDatabase()
      .then((result) => {
        console.log("[LAYOUT] Connection retry test result:", result);
      })
      .catch((error) => {
        console.error("[LAYOUT] Connection retry test error:", error);
      });
  };

  const pageVariants = {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <>
      <Head>
        <title>Loopin - Video Chat App</title>
        <meta
          name="description"
          content="Connect with people worldwide through video chat"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, user-scalable=no"
        />
      </Head>
      <Box minH="100vh" bg={bgColor}>
        <Container
          as={motion.div}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          maxW="container.xl"
          px={[2, 4]}
          pt={4}
          pb={showBottomNav ? "80px" : "4"}
          display="flex"
          flexDirection="column"
          height="100vh"
          overflowY="auto"
          css={{
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-track": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "gray.500",
              borderRadius: "24px",
            },
          }}
        >
          {user && (
            <ConnectionStatusHandler
              onRetryConnection={handleRetryConnection}
            />
          )}
          {children}
        </Container>
        {showBottomNav && <BottomNav />}
      </Box>
    </>
  );
};
