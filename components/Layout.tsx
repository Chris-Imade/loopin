import { Box, useColorMode } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, ReactNode } from "react";
import { Navbar } from "./navigation/Navbar";
import { BottomNav } from "./navigation/BottomNav";
import ConnectionStatusHandler from "./ConnectionStatusHandler";
import { useUserStore } from "../store/userStore";

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
  const user = useUserStore((state) => state.user);
  const isAuthenticated = !!user;

  // Determine if we're on an auth page (login/signup) where we don't want nav
  const isAuthPage =
    router.pathname === "/login" ||
    router.pathname === "/signup" ||
    router.pathname === "/auth/email";

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
      pb={isAuthenticated ? ["80px", null, null, 0] : 0} // Bottom padding only when nav is showing
    >
      {/* Connection status handler for simple connectivity monitoring */}
      <ConnectionStatusHandler />

      {/* Top navigation - only show if not explicitly hidden */}
      {/* {!hideNavbar && <Navbar title={customTitle} />} */}

      {/* Main content */}
      <Box as="main">{children}</Box>

      {/* Bottom navigation for mobile - only show for authenticated users and not on auth pages */}
      {isAuthenticated && !isAuthPage && <BottomNav />}
    </Box>
  );
};
