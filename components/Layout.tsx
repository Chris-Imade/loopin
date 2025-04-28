import { Box, useColorMode } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, ReactNode } from "react";
import { Navbar } from "./navigation/Navbar";
import { BottomNav } from "./navigation/BottomNav";
import ConnectionStatusHandler from "./ConnectionStatusHandler";

interface LayoutProps {
  children: ReactNode;
  hideNavbar?: boolean;
  customTitle?: string;
}

export const Layout = ({
  children,
  hideNavbar = false,
  customTitle,
}: LayoutProps) => {
  const { colorMode } = useColorMode();
  const router = useRouter();

  const bgColor = colorMode === "dark" ? "gray.900" : "white";
  const textColor = colorMode === "dark" ? "white" : "gray.800";

  // Add navigation guards / redirects if needed
  useEffect(() => {
    // Example: Redirect to login if user is not authenticated on protected routes
  }, [router.pathname]);

  return (
    <Box
      bg={bgColor}
      color={textColor}
      minH="100vh"
      pb={["80px", null, null, 0]} // Bottom padding for mobile navigation
    >
      {/* Connection status handler for simple connectivity monitoring */}
      <ConnectionStatusHandler />

      {/* Top navigation - only show if not explicitly hidden */}
      {/* {!hideNavbar && <Navbar title={customTitle} />} */}

      {/* Main content */}
      <Box as="main">{children}</Box>

      {/* Bottom navigation for mobile */}
      <BottomNav />
    </Box>
  );
};
