import React from "react";
import {
  Box,
  VStack,
  Text,
  Button,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiMessageCircle, FiUsers, FiMail } from "react-icons/fi";
import { useRouter } from "next/router";

interface EmptyStateProps {
  type: "messages" | "contacts" | "conversation";
  isPremium?: boolean;
}

export const EmptyState = ({ type, isPremium }: EmptyStateProps) => {
  const router = useRouter();
  const bgColor = useColorModeValue("white", "gray.700");

  const getEmptyStateContent = () => {
    switch (type) {
      case "messages":
        return {
          icon: FiMessageCircle,
          title: "No messages yet",
          description: "Start connecting with others to begin messaging",
          buttonText: "Find people to message",
          buttonAction: () => router.push("/discover"),
        };
      case "contacts":
        return {
          icon: FiUsers,
          title: "No contacts yet",
          description: isPremium
            ? "You haven't connected with anyone yet"
            : "Upgrade to Premium to connect with more people",
          buttonText: isPremium
            ? "Find people to connect"
            : "Upgrade to Premium",
          buttonAction: () => router.push(isPremium ? "/discover" : "/profile"),
        };
      case "conversation":
        return {
          icon: FiMail,
          title: "Select a conversation",
          description: "Choose a contact from the list to start chatting",
          buttonText: "",
          buttonAction: () => {},
        };
      default:
        return {
          icon: FiMessageCircle,
          title: "Nothing here",
          description: "There's nothing to display here yet",
          buttonText: "",
          buttonAction: () => {},
        };
    }
  };

  const { icon, title, description, buttonText, buttonAction } =
    getEmptyStateContent();

  return (
    <Box
      h="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={6}
      bg={bgColor}
    >
      <VStack spacing={4} textAlign="center">
        <Icon as={icon} boxSize={12} color="gray.400" />
        <Text fontSize="xl" fontWeight="bold">
          {title}
        </Text>
        <Text color="gray.500" maxW="300px">
          {description}
        </Text>
        {buttonText && (
          <Button colorScheme="blue" size="md" mt={2} onClick={buttonAction}>
            {buttonText}
          </Button>
        )}
      </VStack>
    </Box>
  );
};
