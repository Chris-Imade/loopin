import { ReactNode } from "react";
import { Box, Container, useColorModeValue } from "@chakra-ui/react";
import { BottomNav } from "./navigation/BottomNav";
import { useRouter } from "next/router";
import { useUserStore } from "../store/userStore";
import { motion } from "framer-motion";
import Head from "next/head";

interface LayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
}

export const Layout = ({ children, hideBottomNav = false }: LayoutProps) => {
  const router = useRouter();
  const { user, isLoading } = useUserStore();
  const bgColor = useColorModeValue("gray.50", "gray.900"); // Allow light mode

  // Only show bottom nav for logged in users
  const showBottomNav = user && !hideBottomNav && !isLoading;

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
          {children}
        </Container>
        {showBottomNav && <BottomNav />}
      </Box>
    </>
  );
};
