import React from "react";
import {
  Box,
  Flex,
  Text,
  Avatar,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";

// Simple date formatter function to replace date-fns
const format = (date: Date, formatString: string): string => {
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  online?: boolean;
}

interface ContactCardProps {
  contact: Contact;
  isActive: boolean;
  onClick: () => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  isActive,
  onClick,
}) => {
  const { name, avatar, lastMessage, lastMessageTime, unreadCount, online } =
    contact;

  // Move all color mode values to the top of the component
  const activeBg = useColorModeValue("blue.50", "blue.900");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const lightBorderColor = useColorModeValue("blue.500", "blue.400");
  const darkBorderColor = useColorModeValue("gray.200", "gray.700");
  const badgeBorderColor = useColorModeValue("white", "gray.800");

  // Compute derived values from hooks
  const bg = isActive ? activeBg : "transparent";
  const borderColor = isActive ? lightBorderColor : darkBorderColor;

  return (
    <Box
      p={3}
      borderRadius="md"
      cursor="pointer"
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      _hover={{ bg: isActive ? activeBg : hoverBg }}
      transition="all 0.2s"
      onClick={onClick}
    >
      <Flex align="center">
        <Box position="relative">
          <Avatar size="md" name={name} src={avatar} />
          {online && (
            <Badge
              position="absolute"
              bottom="0"
              right="0"
              borderRadius="full"
              bg="green.400"
              boxSize="12px"
              border="2px solid"
              borderColor={badgeBorderColor}
            />
          )}
        </Box>

        <Box ml={3} flex="1" overflow="hidden">
          <Flex justify="space-between" align="center">
            <Text fontWeight="medium" isTruncated>
              {name}
            </Text>
            {lastMessageTime && (
              <Text fontSize="xs" color="gray.500">
                {format(lastMessageTime, "h:mm a")}
              </Text>
            )}
          </Flex>

          <Flex justify="space-between" align="center" mt={1}>
            {lastMessage && (
              <Text fontSize="sm" color="gray.500" isTruncated>
                {lastMessage}
              </Text>
            )}

            {unreadCount && unreadCount > 0 && (
              <Badge
                borderRadius="full"
                colorScheme="blue"
                fontSize="xs"
                px={2}
                py={0.5}
                ml={2}
              >
                {unreadCount}
              </Badge>
            )}
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};
