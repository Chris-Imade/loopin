import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Text,
  Input,
  Button,
  Flex,
  Avatar,
  VStack,
  HStack,
  Divider,
  Badge,
  useColorModeValue,
  IconButton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useMediaQuery,
  Heading,
  useToast,
} from "@chakra-ui/react";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/router";
import { FiSend, FiArrowLeft } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "./EmptyState";

// Define types
interface Contact {
  id: string;
  name: string;
  photoURL: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isPremium: boolean;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

const MessagesPage = () => {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesRemaining, setMessagesRemaining] = useState(5); // For non-premium users
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const [tabIndex, setTabIndex] = useState(0);

  // Empty contacts list - will be populated from real data
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Extract all useColorModeValue calls to avoid React Hook rule violations
  const hoverBgMobile = useColorModeValue("gray.50", "gray.700");
  const hoverBgDesktop = useColorModeValue("gray.100", "gray.700");
  const whiteBg = useColorModeValue("white", "gray.800");
  const messageBg = useColorModeValue("gray.100", "gray.700");
  const selectedBg = useColorModeValue("blue.50", "blue.900");
  const sidebarBg = useColorModeValue("gray.50", "gray.800");

  // Load real contacts from the database
  useEffect(() => {
    if (authUser) {
      // This would be replaced with a real API call to get contacts
      // For now, we're using an empty array as requested
      setContacts([]);
    }
  }, [authUser]);

  // Reset messages when selecting a new contact
  useEffect(() => {
    if (activeContact && authUser) {
      // In a real implementation, this would load actual messages
      // For now, we're using an empty array as requested
      setMessages([]);
    }
  }, [activeContact, authUser?.uid]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeContact || !authUser) return;

    if (!isPremium && messagesRemaining <= 0) {
      toast({
        title: "Message limit reached",
        description: "Upgrade to premium to send unlimited messages",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const newMessage: Message = {
      id: `msg${Date.now()}`,
      senderId: authUser.uid,
      text: messageText,
      timestamp: new Date(),
      read: false,
    };

    setMessages([...messages, newMessage]);
    setMessageText("");

    // Decrease remaining messages for non-premium users
    if (!isPremium) {
      setMessagesRemaining((prev) => prev - 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Get from user store later
  const isPremium = authUser?.isPremium || false;

  // Mobile back button handler
  const handleBackClick = () => {
    setActiveContact(null);
  };

  // Render the UI
  return (
    <Box h="calc(100vh - 64px)">
      <Tabs
        isFitted
        variant="enclosed"
        index={tabIndex}
        onChange={setTabIndex}
        display={{ base: "block", md: "none" }}
      >
        <TabList mb="1em">
          <Tab>Messages</Tab>
          <Tab>Contacts</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            {contacts.length === 0 ? (
              <EmptyState type="messages" />
            ) : (
              <VStack
                h="calc(100vh - 120px)"
                align="stretch"
                spacing={0}
                overflowY="auto"
              >
                {contacts.map((contact) => (
                  <React.Fragment key={contact.id}>
                    <HStack
                      p={4}
                      _hover={{ bg: hoverBgMobile }}
                      cursor="pointer"
                      onClick={() => {
                        setActiveContact(contact);
                        if (isMobile) setTabIndex(1);
                      }}
                    >
                      <Avatar src={contact.photoURL} name={contact.name} />
                      <Box flex="1">
                        <Flex justify="space-between" align="center">
                          <Heading size="sm">{contact.name}</Heading>
                          <Text fontSize="xs" color="gray.500">
                            {formatDistanceToNow(contact.lastMessageTime, {
                              addSuffix: true,
                            })}
                          </Text>
                        </Flex>
                        <Text fontSize="sm" noOfLines={1}>
                          {contact.lastMessage}
                        </Text>
                      </Box>
                      {contact.unreadCount > 0 && (
                        <Badge
                          colorScheme="blue"
                          borderRadius="full"
                          px={2}
                          py={1}
                        >
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </HStack>
                    <Divider />
                  </React.Fragment>
                ))}
              </VStack>
            )}
          </TabPanel>
          <TabPanel p={0}>
            {(isMobile && !activeContact) || !isMobile ? (
              contacts.length === 0 ? (
                <EmptyState type="contacts" isPremium={isPremium} />
              ) : (
                <VStack
                  h="calc(100vh - 120px)"
                  align="stretch"
                  spacing={0}
                  overflowY="auto"
                >
                  {contacts.map((contact) => (
                    <React.Fragment key={contact.id}>
                      <HStack
                        p={4}
                        _hover={{ bg: hoverBgMobile }}
                        cursor="pointer"
                        onClick={() => setActiveContact(contact)}
                      >
                        <Avatar src={contact.photoURL} name={contact.name} />
                        <Box flex="1">
                          <Flex justify="space-between" align="center">
                            <Heading size="sm">{contact.name}</Heading>
                            {contact.isPremium && (
                              <Badge colorScheme="yellow">Premium</Badge>
                            )}
                          </Flex>
                        </Box>
                      </HStack>
                      <Divider />
                    </React.Fragment>
                  ))}
                </VStack>
              )
            ) : (
              <Box h="calc(100vh - 120px)" position="relative">
                {/* Chat header */}
                <HStack
                  p={4}
                  borderBottomWidth="1px"
                  position="sticky"
                  top={0}
                  zIndex={10}
                  bg={whiteBg}
                >
                  {isMobile && (
                    <IconButton
                      aria-label="Back"
                      icon={<FiArrowLeft />}
                      onClick={handleBackClick}
                      variant="ghost"
                      mr={2}
                    />
                  )}
                  <Avatar
                    src={activeContact.photoURL}
                    name={activeContact.name}
                  />
                  <Box flex="1">
                    <Heading size="md">{activeContact.name}</Heading>
                  </Box>
                </HStack>

                {/* Chat messages */}
                <VStack
                  p={4}
                  spacing={4}
                  overflowY="auto"
                  h="calc(100vh - 230px)"
                  align="stretch"
                >
                  {messages.length === 0 ? (
                    <Flex h="100%" align="center" justify="center">
                      <Text color="gray.500">
                        Start a conversation with {activeContact.name}
                      </Text>
                    </Flex>
                  ) : (
                    messages.map((message) => (
                      <Flex
                        key={message.id}
                        justify={
                          message.senderId === authUser?.uid
                            ? "flex-end"
                            : "flex-start"
                        }
                      >
                        <Box
                          maxW="70%"
                          p={3}
                          borderRadius="lg"
                          bg={
                            message.senderId === authUser?.uid
                              ? "blue.500"
                              : messageBg
                          }
                          color={
                            message.senderId === authUser?.uid
                              ? "white"
                              : undefined
                          }
                        >
                          <Text>{message.text}</Text>
                          <Text fontSize="xs" mt={1} opacity={0.8}>
                            {formatDistanceToNow(message.timestamp, {
                              addSuffix: true,
                            })}
                          </Text>
                        </Box>
                      </Flex>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </VStack>

                {/* Chat input */}
                <HStack
                  p={4}
                  borderTopWidth="1px"
                  position="sticky"
                  bottom={0}
                  bg={whiteBg}
                >
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <IconButton
                    aria-label="Send message"
                    icon={<FiSend />}
                    onClick={handleSendMessage}
                    colorScheme="blue"
                  />
                </HStack>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Desktop view */}
      <HStack
        h="calc(100vh - 64px)"
        spacing={0}
        display={{ base: "none", md: "flex" }}
      >
        {/* Contacts list - left sidebar */}
        <Box
          w="300px"
          h="100%"
          borderRightWidth="1px"
          overflowY="auto"
          bg={sidebarBg}
        >
          <VStack align="stretch" spacing={0}>
            <Box p={4} borderBottomWidth="1px">
              <Heading size="md">Messages</Heading>
            </Box>
            {contacts.length === 0 ? (
              <EmptyState type="contacts" isPremium={isPremium} />
            ) : (
              contacts.map((contact) => (
                <React.Fragment key={contact.id}>
                  <HStack
                    p={4}
                    _hover={{ bg: hoverBgDesktop }}
                    cursor="pointer"
                    bg={
                      activeContact?.id === contact.id ? selectedBg : undefined
                    }
                    onClick={() => setActiveContact(contact)}
                  >
                    <Avatar src={contact.photoURL} name={contact.name} />
                    <Box flex="1">
                      <Flex justify="space-between" align="center">
                        <Heading size="sm">{contact.name}</Heading>
                        <Text fontSize="xs" color="gray.500">
                          {formatDistanceToNow(contact.lastMessageTime, {
                            addSuffix: true,
                          })}
                        </Text>
                      </Flex>
                      <Text fontSize="sm" noOfLines={1}>
                        {contact.lastMessage}
                      </Text>
                    </Box>
                    {contact.unreadCount > 0 && (
                      <Badge
                        colorScheme="blue"
                        borderRadius="full"
                        px={2}
                        py={1}
                      >
                        {contact.unreadCount}
                      </Badge>
                    )}
                  </HStack>
                  <Divider />
                </React.Fragment>
              ))
            )}
          </VStack>
        </Box>

        {/* Chat area - right side */}
        <Box flex="1" h="100%" position="relative">
          {activeContact ? (
            <>
              {/* Chat header */}
              <HStack
                p={4}
                borderBottomWidth="1px"
                position="sticky"
                top={0}
                zIndex={10}
                bg={whiteBg}
              >
                <Avatar
                  src={activeContact.photoURL}
                  name={activeContact.name}
                />
                <Box flex="1">
                  <Heading size="md">{activeContact.name}</Heading>
                </Box>
              </HStack>

              {/* Chat messages */}
              <VStack
                p={4}
                spacing={4}
                overflowY="auto"
                h="calc(100vh - 174px)"
                align="stretch"
              >
                {messages.length === 0 ? (
                  <Flex h="100%" align="center" justify="center">
                    <Text color="gray.500">
                      Start a conversation with {activeContact.name}
                    </Text>
                  </Flex>
                ) : (
                  messages.map((message) => (
                    <Flex
                      key={message.id}
                      justify={
                        message.senderId === authUser?.uid
                          ? "flex-end"
                          : "flex-start"
                      }
                    >
                      <Box
                        maxW="70%"
                        p={3}
                        borderRadius="lg"
                        bg={
                          message.senderId === authUser?.uid
                            ? "blue.500"
                            : messageBg
                        }
                        color={
                          message.senderId === authUser?.uid
                            ? "white"
                            : undefined
                        }
                      >
                        <Text>{message.text}</Text>
                        <Text fontSize="xs" mt={1} opacity={0.8}>
                          {formatDistanceToNow(message.timestamp, {
                            addSuffix: true,
                          })}
                        </Text>
                      </Box>
                    </Flex>
                  ))
                )}
                <div ref={messagesEndRef} />
              </VStack>

              {/* Chat input */}
              <HStack
                p={4}
                borderTopWidth="1px"
                position="sticky"
                bottom={0}
                bg={whiteBg}
              >
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <IconButton
                  aria-label="Send message"
                  icon={<FiSend />}
                  onClick={handleSendMessage}
                  colorScheme="blue"
                />
              </HStack>
            </>
          ) : (
            !isMobile && <EmptyState type="conversation" />
          )}
        </Box>
      </HStack>
    </Box>
  );
};

export default MessagesPage;
