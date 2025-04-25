import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Heading,
  Avatar,
  Text,
  Badge,
  Button,
  HStack,
  VStack,
  Divider,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useMediaQuery,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { SparklesIcon, ArrowRightIcon } from "../../components/icons";
import { useRouter } from "next/router";
import { useUserStore } from "../../store/userStore";
import { useAuth } from "../../hooks/useAuth";
import { EmptyState } from "./EmptyState";
import { ChatInterface } from "./ChatInterface";

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
  photoURL: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isPremium: boolean;
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

  // Mock contacts for demo
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: "contact1",
      name: "Alex Johnson",
      photoURL: "https://randomuser.me/api/portraits/men/32.jpg",
      lastMessage: "Hey, how are you doing?",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      unreadCount: 2,
      isPremium: true,
    },
    {
      id: "contact2",
      name: "Sarah Miller",
      photoURL: "https://randomuser.me/api/portraits/women/44.jpg",
      lastMessage: "That video chat was fun!",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      unreadCount: 0,
      isPremium: false,
    },
    {
      id: "contact3",
      name: "Carlos Rodriguez",
      photoURL: "https://randomuser.me/api/portraits/men/67.jpg",
      lastMessage: "See you next time 👋",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      unreadCount: 0,
      isPremium: true,
    },
  ]);

  // Mock messages for demo
  useEffect(() => {
    if (activeContact && authUser) {
      // Generate fake message history when a contact is selected
      const mockMessages: Message[] = [
        {
          id: "msg1",
          senderId: activeContact.id,
          text: "Hey there! How are you?",
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          read: true,
        },
        {
          id: "msg2",
          senderId: authUser.uid,
          text: "I'm doing great! Just wanted to follow up after our video chat.",
          timestamp: new Date(Date.now() - 1000 * 60 * 55),
          read: true,
        },
        {
          id: "msg3",
          senderId: activeContact.id,
          text: "That was fun! Where are you from again?",
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          read: true,
        },
        {
          id: "msg4",
          senderId: authUser.uid,
          text: "I'm from California. How about you?",
          timestamp: new Date(Date.now() - 1000 * 60 * 40),
          read: true,
        },
        {
          id: "msg5",
          senderId: activeContact.id,
          text: "I'm from London! Would love to visit California someday.",
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          read: activeContact.unreadCount === 0,
        },
      ];

      if (activeContact.unreadCount > 0) {
        // Mark the contact's messages as read when selected
        const updatedContacts = contacts.map((contact) =>
          contact.id === activeContact.id
            ? { ...contact, unreadCount: 0 }
            : contact
        );
        setContacts(updatedContacts);
      }

      setMessages(mockMessages);
    }
  }, [activeContact, authUser?.uid, contacts]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const formatContactTime = (date?: Date) => {
    if (!date) return "";

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return days === 1 ? "Yesterday" : `${days} days ago`;
    }

    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const bgColor = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBg = useColorModeValue("gray.50", "gray.600");

  if (!authUser) {
    return null; // useAuth in parent will handle redirect
  }

  // Check if user is premium
  const isPremium = authUser.isPremium || false;

  return (
    <Box h="calc(100vh - 140px)" maxH="calc(100vh - 140px)" overflow="hidden">
      <Heading size="lg" mb={4} pt={2}>
        Messages
      </Heading>

      {!isPremium && (
        <Box
          mb={4}
          p={3}
          bg="yellow.400"
          color="gray.800"
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <HStack>
            <SparklesIcon width={20} height={20} />
            <Text fontWeight="medium">
              Upgrade to Premium for unlimited messages!
            </Text>
          </HStack>
          <Button
            size="sm"
            colorScheme="blackAlpha"
            onClick={() => router.push("/profile")}
            rightIcon={<ArrowRightIcon width={16} height={16} />}
          >
            Upgrade
          </Button>
        </Box>
      )}

      <Flex
        h="calc(100% - 60px)"
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        overflow="hidden"
      >
        {/* Contacts sidebar - hidden on mobile when a contact is selected */}
        <Box
          w={{ base: activeContact ? "0" : "100%", md: "320px" }}
          borderRightWidth="1px"
          borderColor={borderColor}
          display={{ base: activeContact ? "none" : "block", md: "block" }}
          bg={cardBg}
          overflowY="auto"
        >
          <Tabs
            isFitted
            variant="enclosed"
            index={tabIndex}
            onChange={(index) => setTabIndex(index)}
          >
            <TabList>
              <Tab>Chats</Tab>
              <Tab>Contacts</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0} py={2}>
                {contacts.length === 0 ? (
                  <EmptyState type="messages" />
                ) : (
                  <VStack align="stretch" spacing={0} divider={<Divider />}>
                    {contacts.map((contact) => (
                      <Box
                        key={contact.id}
                        p={3}
                        cursor="pointer"
                        bg={
                          activeContact?.id === contact.id
                            ? hoverBg
                            : "transparent"
                        }
                        _hover={{ bg: hoverBg }}
                        onClick={() => setActiveContact(contact)}
                        position="relative"
                        borderLeftWidth={
                          activeContact?.id === contact.id ? "4px" : "0"
                        }
                        borderLeftColor="blue.500"
                      >
                        <HStack spacing={3} align="start">
                          <Box position="relative">
                            <Avatar
                              size="md"
                              name={contact.name}
                              src={contact.photoURL}
                            />
                            {contact.isPremium && (
                              <Box
                                position="absolute"
                                bottom="-2px"
                                right="-2px"
                                bg="yellow.400"
                                borderRadius="full"
                                w="16px"
                                h="16px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <SparklesIcon
                                  width={10}
                                  height={10}
                                  color="black"
                                />
                              </Box>
                            )}
                          </Box>
                          <Box flex="1" overflow="hidden">
                            <Flex justify="space-between" align="center">
                              <Text fontWeight="bold" noOfLines={1}>
                                {contact.name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {formatContactTime(contact.lastMessageTime)}
                              </Text>
                            </Flex>
                            <Text
                              fontSize="sm"
                              color={
                                contact.unreadCount > 0
                                  ? "gray.800"
                                  : "gray.500"
                              }
                              fontWeight={
                                contact.unreadCount > 0 ? "medium" : "normal"
                              }
                              noOfLines={1}
                            >
                              {contact.lastMessage}
                            </Text>
                          </Box>
                          {contact.unreadCount > 0 && (
                            <Badge
                              borderRadius="full"
                              colorScheme="blue"
                              px={2}
                              py={1}
                            >
                              {contact.unreadCount}
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </TabPanel>

              <TabPanel>
                {contacts.length === 0 ? (
                  <EmptyState type="contacts" isPremium={isPremium} />
                ) : (
                  <VStack align="stretch" spacing={0} divider={<Divider />}>
                    {contacts.map((contact) => (
                      <Box
                        key={contact.id}
                        p={3}
                        cursor="pointer"
                        _hover={{ bg: hoverBg }}
                        onClick={() => {
                          setActiveContact(contact);
                          setTabIndex(0); // Switch to chats tab on mobile
                        }}
                      >
                        <HStack spacing={3}>
                          <Box position="relative">
                            <Avatar
                              size="md"
                              name={contact.name}
                              src={contact.photoURL}
                            />
                            {contact.isPremium && (
                              <Box
                                position="absolute"
                                bottom="-2px"
                                right="-2px"
                                bg="yellow.400"
                                borderRadius="full"
                                w="16px"
                                h="16px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <SparklesIcon
                                  width={10}
                                  height={10}
                                  color="black"
                                />
                              </Box>
                            )}
                          </Box>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">{contact.name}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {contact.isPremium
                                ? "Premium User"
                                : "Basic User"}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>

        {/* Conversation area */}
        <Box
          flex="1"
          bg={bgColor}
          display={activeContact || !isMobile ? "block" : "none"}
        >
          {activeContact ? (
            <ChatInterface
              contact={activeContact}
              currentUserId={authUser.uid}
              isPremium={isPremium}
              initialMessages={messages}
              limitedMessages={!isPremium && activeContact.isPremium}
              messagesRemaining={messagesRemaining}
              onGoBack={() => setActiveContact(null)}
            />
          ) : (
            !isMobile && <EmptyState type="conversation" />
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default MessagesPage;
