import { useState, useEffect, useRef } from "react";
import { Layout } from "../components/Layout";
import { useUserStore } from "../store/userStore";
import { useAuth } from "../hooks/useAuth";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  Avatar,
  useColorModeValue,
  Badge,
  Divider,
  useToast,
  Skeleton,
  IconButton,
  InputGroup,
  InputRightElement,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useMediaQuery,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PaperAirplaneIcon,
  SparklesIcon,
  LockClosedIcon,
  ArrowRightIcon,
  PlusCircleIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/solid";
import { useRouter } from "next/router";
import { EmptyState } from "../components/messages/EmptyState";
import { ChatInterface } from "../components/messages/ChatInterface";
import dynamic from "next/dynamic";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

interface Contact {
  id: string;
  name: string;
  photoURL?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isPremium: boolean;
}

// Use dynamic import with no SSR for components that use browser-only APIs
const DynamicMessagesPage = dynamic(
  () => import("../components/messages/MessagesPage"),
  {
    ssr: false,
    loading: () => (
      <Center h="calc(100vh - 140px)">
        <Box textAlign="center">
          <Spinner size="xl" mb={4} color="blue.500" />
          <Text>Loading messages...</Text>
        </Box>
      </Center>
    ),
  }
);

const MessagesContainer = () => {
  const { user, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // Only render on client after mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isLoading || !isMounted) {
    return (
      <Layout>
        <Center h="calc(100vh - 140px)">
          <Spinner size="xl" />
        </Center>
      </Layout>
    );
  }

  if (!user) {
    return null; // useAuth will redirect to login
  }

  return (
    <Layout>
      <DynamicMessagesPage />
    </Layout>
  );
};

export default MessagesContainer;
