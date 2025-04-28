import {
  Box,
  Flex,
  IconButton,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ChevronLeftIcon } from "@chakra-ui/icons";

interface NavbarProps {
  title?: string;
}

export const Navbar = ({ title }: NavbarProps) => {
  const router = useRouter();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Don't show navbar on video screen (home page)
  if (router.pathname === "/" || router.pathname.startsWith("/video")) {
    return null;
  }

  // Default title based on current route if not provided
  const pageTitle = title || getDefaultTitle(router.pathname);

  return (
    <Box
      as="nav"
      position="sticky"
      top="0"
      zIndex="sticky"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      boxShadow="sm"
    >
      <Flex h="50px" alignItems="center" px={4} maxW="container.xl" mx="auto">
        <IconButton
          aria-label="Go back"
          icon={<ChevronLeftIcon w={6} h={6} />}
          variant="ghost"
          onClick={() => router.back()}
          mr={2}
        />

        <Text fontSize="lg" fontWeight="medium">
          {pageTitle}
        </Text>
      </Flex>
    </Box>
  );
};

// Helper function to get default title based on route
function getDefaultTitle(pathname: string): string {
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/messages")) return "Messages";
  if (pathname.startsWith("/chat")) return "Chat";
  if (pathname.startsWith("/events")) return "Events";
  if (pathname.startsWith("/connect")) return "Connect";
  if (pathname.startsWith("/auth")) return "Authentication";
  if (pathname.startsWith("/coins")) return "Coins";
  if (pathname.startsWith("/subscription")) return "Subscription";

  // Extract path segment for other routes
  const segment = pathname.split("/")[1];
  return segment
    ? segment.charAt(0).toUpperCase() + segment.slice(1)
    : "Loopin";
}

export default Navbar;
