import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Text,
  VStack,
  HStack,
  Avatar,
  Badge,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Button,
  Divider,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
  Progress,
  CircularProgress,
} from "@chakra-ui/react";
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  PhotoIcon,
  MicrophoneIcon,
  SparklesIcon,
  LockClosedIcon,
  StopIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";

// Mock Agora RTM Service
const agoraRTMService = {
  emojis: {
    smileys: [
      "😊",
      "😂",
      "😍",
      "🙂",
      "😎",
      "😢",
      "😭",
      "🤔",
      "😴",
      "🥰",
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "😉",
      "😌",
      "😚",
      "😋",
    ],
    gestures: [
      "👍",
      "👎",
      "👏",
      "🙌",
      "👋",
      "✌️",
      "🤞",
      "👊",
      "✋",
      "🤚",
      "🖐️",
      "👐",
      "🤲",
      "🤝",
      "🙏",
      "👌",
      "👈",
      "👉",
      "👆",
      "👇",
    ],
    symbols: [
      "❤️",
      "💯",
      "🔥",
      "⭐",
      "🎉",
      "💩",
      "👻",
      "👀",
      "💪",
      "🙏",
      "💕",
      "💓",
      "💖",
      "💘",
      "💝",
      "💞",
      "💌",
      "💗",
      "💜",
      "💙",
    ],
    animals: [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
      "🐔",
      "🐧",
      "🐦",
      "🐤",
      "🦄",
    ],
    food: [
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🍆",
      "🥑",
      "🥦",
      "🥙",
    ],
  },
  init: async () => true,
  joinChannel: async () => true,
  isReady: () => true,
  logout: () => {},
  onMessage: (callback) => {},
  sendMessageToPeer: async () => true,
  getAllEmojis: () => {
    return Object.values(agoraRTMService.emojis).flat();
  },
  getEmojisByCategory: (category) => {
    return agoraRTMService.emojis[category] || [];
  },
  // Mock audio recording functions
  startAudioRecording: async () => true,
  stopAudioRecording: async () => ({
    audioUrl: "mock-audio-url.m4a",
    duration: 10.5,
  }),
  cancelAudioRecording: () => {},
};

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
  isEmoji?: boolean;
  isDelivered?: boolean;
  isFailed?: boolean;
  isAudio?: boolean;
  audioDuration?: number;
  audioUrl?: string;
}

interface ChatInterfaceProps {
  contact: {
    id: string;
    name: string;
    photoURL?: string;
    isPremium: boolean;
  };
  currentUserId: string;
  isPremium: boolean;
  initialMessages?: Message[];
  limitedMessages?: boolean;
  messagesRemaining?: number;
  onGoBack?: () => void;
}

export const ChatInterface = ({
  contact,
  currentUserId,
  isPremium,
  initialMessages = [],
  limitedMessages = false,
  messagesRemaining = 5,
  onGoBack,
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [messageText, setMessageText] = useState("");
  const [remainingMessages, setRemainingMessages] = useState(messagesRemaining);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [emojiCategoryTab, setEmojiCategoryTab] = useState("smileys");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const router = useRouter();
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const inputBgColor = useColorModeValue("white", "gray.700");
  const userMessageBg = useColorModeValue("blue.500", "blue.500");
  const contactMessageBg = useColorModeValue("gray.200", "gray.600");

  // Init Agora RTM connection when component mounts
  useEffect(() => {
    const connectToAgora = async () => {
      setIsConnecting(true);
      try {
        // Initialize RTM with current user ID
        const initSuccess = await agoraRTMService.init();
        if (!initSuccess) {
          throw new Error("Failed to initialize Agora RTM");
        }

        // Create a direct messaging channel with contact
        // For 1-on-1 chat we'll use a convention channelName = sortedUserIds
        const channelName = [currentUserId, contact.id].sort().join("-");
        const joinSuccess = await agoraRTMService.joinChannel();
        if (!joinSuccess) {
          throw new Error("Failed to join channel");
        }

        // Set up message listener
        agoraRTMService.onMessage((senderId, text) => {
          if (senderId === contact.id) {
            const newMessage: Message = {
              id: `msg-${Date.now()}`,
              senderId,
              text,
              timestamp: new Date(),
              read: true,
              isEmoji: text.length <= 4 && !text.includes(" "),
              isDelivered: true,
            };
            setMessages((prev) => [...prev, newMessage]);
          }
        });

        setIsConnected(true);
      } catch (error) {
        console.error("Error connecting to Agora RTM", error);
        toast({
          title: "Connection Error",
          description:
            "Failed to connect to messaging service. Using mock data instead.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        // Still set connected to true to allow for mock functionality
        setIsConnected(true);
      } finally {
        setIsConnecting(false);
      }
    };

    connectToAgora();

    // Cleanup when component unmounts
    return () => {
      if (agoraRTMService.isReady()) {
        agoraRTMService.logout();
      }
    };
  }, [currentUserId, contact.id, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingDuration(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const sendMessage = async (text: string, isEmoji = false) => {
    if (
      (!text.trim() && !isEmoji) ||
      (limitedMessages && remainingMessages <= 0 && !isPremium)
    )
      return;

    // Create new message
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      text,
      timestamp: new Date(),
      read: false,
      isEmoji,
      isDelivered: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageText("");

    // Decrement remaining messages for non-premium users
    if (limitedMessages && !isPremium) {
      setRemainingMessages((prev) => prev - 1);
    }

    // Try to send via Agora RTM
    let deliverySuccess = false;

    try {
      if (agoraRTMService.isReady()) {
        deliverySuccess = await agoraRTMService.sendMessageToPeer();
      }
    } catch (error) {
      console.error("Error sending message via Agora RTM", error);
    }

    // Update message status
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id
            ? {
                ...msg,
                isDelivered: deliverySuccess,
                isFailed: !deliverySuccess,
              }
            : msg
        )
      );
    }, 500);

    // For demo: if using mock data or delivery failed, simulate a reply
    if (!deliverySuccess) {
      await simulateReply(text, isEmoji);
    }
  };

  const sendAudioMessage = async () => {
    try {
      const result = await agoraRTMService.stopAudioRecording();

      // Create new audio message
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        text: "🎤 Audio message",
        timestamp: new Date(),
        read: false,
        isAudio: true,
        audioDuration: result.duration,
        audioUrl: result.audioUrl,
        isDelivered: false,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Simulate successful delivery
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id
              ? {
                  ...msg,
                  isDelivered: true,
                }
              : msg
          )
        );
      }, 500);

      // Simulate reply
      const delay = 1000 + Math.random() * 2000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (Math.random() < 0.7) {
        const replyOptions = [
          "Thanks for the voice message!",
          "I'll listen to it later",
          "Nice to hear your voice!",
          "👍",
          "Got your audio!",
        ];

        const replyText =
          replyOptions[Math.floor(Math.random() * replyOptions.length)];
        const isEmojiReply = replyText.length <= 4 && !replyText.includes(" ");

        const reply: Message = {
          id: `msg-${Date.now() + 1}`,
          senderId: contact.id,
          text: replyText,
          timestamp: new Date(),
          read: false,
          isEmoji: isEmojiReply,
          isDelivered: true,
        };

        setMessages((prev) => [...prev, reply]);
      }
    } catch (error) {
      console.error("Error sending audio message", error);
      toast({
        title: "Failed to send audio",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsRecording(false);
    }
  };

  const startRecording = async () => {
    try {
      const success = await agoraRTMService.startAudioRecording();
      if (success) {
        setIsRecording(true);
        toast({
          title: "Recording started",
          description: "Tap the stop button when finished",
          status: "info",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error starting recording", error);
      toast({
        title: "Failed to start recording",
        status: "error",
        duration: 3000,
      });
    }
  };

  const stopRecording = async () => {
    sendAudioMessage();
  };

  const cancelRecording = () => {
    agoraRTMService.cancelAudioRecording();
    setIsRecording(false);
    toast({
      title: "Recording canceled",
      status: "info",
      duration: 2000,
    });
  };

  const simulateReply = async (text: string, isEmoji: boolean) => {
    // Add random reply after a short delay (for demo)
    const delay = 1000 + Math.random() * 2000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // 70% chance of reply
    if (Math.random() < 0.7) {
      let replyText = "";

      if (isEmoji) {
        // Respond with an emoji from the same category
        const allEmojis = agoraRTMService.getAllEmojis();
        replyText = allEmojis[Math.floor(Math.random() * allEmojis.length)];
      } else {
        const replyOptions = [
          "Hey there!",
          "How are you?",
          "Nice to meet you!",
          "Thanks for the message",
          "What's up?",
          "Cool 😎",
          "Interesting...",
          "I'm good, thanks!",
          "😊",
          "👍",
          "Where are you from?",
          "I enjoyed our video chat",
          "What do you do for fun?",
          "Have a great day!",
          "Tell me more about yourself",
        ];

        replyText =
          replyOptions[Math.floor(Math.random() * replyOptions.length)];
      }

      const isEmojiReply = replyText.length <= 4 && !replyText.includes(" ");

      const reply: Message = {
        id: `msg-${Date.now() + 1}`,
        senderId: contact.id,
        text: replyText,
        timestamp: new Date(),
        read: false,
        isEmoji: isEmojiReply,
        isDelivered: true,
      };

      setMessages((prev) => [...prev, reply]);
    }
  };

  const handleInsertEmoji = useCallback(
    (emoji: string) => {
      if (!inputRef.current) return;

      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      const text = messageText;

      const newText = text.substring(0, start) + emoji + text.substring(end);
      setMessageText(newText);

      // After state update, need to focus back on input and set cursor position
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newCursorPos = start + emoji.length;
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [messageText]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(messageText);
    }
  };

  // Get emoji categories and emojis
  const emojiCategories = Object.keys(agoraRTMService.emojis);
  const currentCategoryEmojis = agoraRTMService.getEmojisByCategory(
    emojiCategoryTab as keyof typeof agoraRTMService.emojis
  );

  // Format message time
  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format recording time (MM:SS)
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Retry sending a failed message
  const retryMessage = async (messageId: string) => {
    const message = messages.find((msg) => msg.id === messageId);
    if (!message) return;

    // Remove the failed message and send it again
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    await sendMessage(message.text, message.isEmoji);
  };

  // Memoize emoji panels to prevent unnecessary re-renders
  const memoizedEmojiPanels = useMemo(() => {
    return emojiCategories.map((category) => (
      <TabPanel key={category} p={1}>
        <Flex
          flexWrap="wrap"
          justifyContent="flex-start"
          maxH="200px"
          overflowY="auto"
          css={{
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-track": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(0,0,0,0.1)",
              borderRadius: "24px",
            },
          }}
        >
          {agoraRTMService
            .getEmojisByCategory(
              category as keyof typeof agoraRTMService.emojis
            )
            .map((emoji) => (
              <Box
                key={emoji}
                as="button"
                p={2}
                fontSize="xl"
                onClick={() => handleInsertEmoji(emoji)}
                _hover={{ bg: "gray.100" }}
                borderRadius="md"
                width="40px"
                height="40px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                m={0.5}
              >
                {emoji}
              </Box>
            ))}
        </Flex>
      </TabPanel>
    ));
  }, [emojiCategories, handleInsertEmoji]);

  return (
    <Flex direction="column" h="100%" bg={bgColor} position="relative">
      {/* Chat Header */}
      <Flex
        p={4}
        borderBottomWidth="1px"
        borderColor="gray.200"
        alignItems="center"
        bg={inputBgColor}
      >
        {onGoBack && (
          <IconButton
            aria-label="Back"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 19L8 12L15 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            variant="ghost"
            mr={2}
            onClick={onGoBack}
            display={{ base: "flex", md: "none" }}
          />
        )}

        <Avatar size="sm" name={contact.name} src={contact.photoURL} />
        <Box ml={3} flex={1}>
          <Flex align="center">
            <Text fontWeight="bold">{contact.name}</Text>
            {contact.isPremium && (
              <Badge
                ml={2}
                colorScheme="yellow"
                display="flex"
                alignItems="center"
              >
                <SparklesIcon
                  width={12}
                  height={12}
                  style={{ marginRight: "2px" }}
                />
                Premium
              </Badge>
            )}
          </Flex>
          <Text fontSize="xs" color="gray.500">
            {isConnected
              ? "Online"
              : isConnecting
              ? "Connecting..."
              : "Offline"}
          </Text>
        </Box>
      </Flex>

      {/* Messages Area */}
      <Box
        flex={1}
        overflowY="auto"
        p={4}
        css={{
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0,0,0,0.1)",
            borderRadius: "24px",
          },
        }}
      >
        {isConnecting ? (
          <Flex justify="center" align="center" h="100%">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text>Connecting to messaging service...</Text>
            </VStack>
          </Flex>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: "flex",
                  justifyContent:
                    message.senderId === currentUserId
                      ? "flex-end"
                      : "flex-start",
                  marginBottom: "8px",
                }}
              >
                <Box position="relative">
                  <Box
                    maxW={message.isEmoji ? "auto" : "70%"}
                    bg={
                      message.senderId === currentUserId
                        ? userMessageBg
                        : contactMessageBg
                    }
                    color={
                      message.senderId === currentUserId ? "white" : "black"
                    }
                    px={message.isEmoji ? 2 : 4}
                    py={message.isEmoji ? 1 : 2}
                    borderRadius="lg"
                    fontSize={message.isEmoji ? "2xl" : "md"}
                  >
                    <Text>{message.text}</Text>
                    <Flex
                      justify="flex-end"
                      align="center"
                      mt={message.isEmoji ? 0 : 1}
                    >
                      <Text fontSize="xs" opacity={0.7} mr={1}>
                        {formatMessageTime(message.timestamp)}
                      </Text>

                      {/* Status indicators for sent messages */}
                      {message.senderId === currentUserId &&
                        (message.isFailed ? (
                          <Box
                            as="span"
                            color="red.500"
                            fontSize="xs"
                            cursor="pointer"
                            onClick={() => retryMessage(message.id)}
                          >
                            Failed - Tap to retry
                          </Box>
                        ) : message.isDelivered ? (
                          <Box as="span" color="white" fontSize="xs">
                            ✓
                          </Box>
                        ) : (
                          <Box
                            as={motion.span}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: true, duration: 1.5 } as any}
                            color="white"
                            fontSize="xs"
                          >
                            ⋯
                          </Box>
                        ))}
                    </Flex>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Box p={4} bg={inputBgColor} borderTopWidth="1px" borderColor="gray.200">
        {isRecording ? (
          // Recording interface
          <Flex align="center" justify="space-between" width="full">
            <HStack flex={1} spacing={4} pr={2}>
              <Box
                as={motion.div}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: true, duration: 1.5 } as any}
              >
                <MicrophoneIcon width={24} height={24} color="red" />
              </Box>
              <Text>{formatRecordingTime(recordingDuration)}</Text>
              <Progress
                value={recordingDuration}
                max={120}
                colorScheme="red"
                flex={1}
                borderRadius="full"
                size="sm"
                hasStripe
                isAnimated
              />
            </HStack>
            <HStack>
              <IconButton
                aria-label="Cancel recording"
                icon={<XCircleIcon width={20} height={20} />}
                colorScheme="red"
                variant="ghost"
                onClick={cancelRecording}
              />
              <IconButton
                aria-label="Send recording"
                icon={<PaperAirplaneIcon width={20} height={20} />}
                colorScheme="blue"
                onClick={stopRecording}
              />
            </HStack>
          </Flex>
        ) : limitedMessages && !isPremium ? (
          <VStack spacing={2} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" fontWeight="medium">
                Messages remaining: {remainingMessages}
              </Text>
              <Button
                size="xs"
                colorScheme="yellow"
                leftIcon={<SparklesIcon width={12} height={12} />}
                onClick={() => router.push("/profile")}
                visibility={remainingMessages <= 2 ? "visible" : "hidden"}
              >
                Upgrade
              </Button>
            </Flex>
            <InputGroup>
              <Input
                placeholder={
                  remainingMessages > 0
                    ? "Type a message..."
                    : "Upgrade to Premium to send more messages"
                }
                bg={inputBgColor}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={remainingMessages <= 0 || isConnecting}
                ref={inputRef}
              />
              <InputRightElement width="4.5rem">
                <HStack spacing={0}>
                  {remainingMessages > 0 ? (
                    <>
                      <Popover placement="top-end" isLazy>
                        <PopoverTrigger>
                          <IconButton
                            aria-label="Emoji"
                            icon={<FaceSmileIcon width={20} height={20} />}
                            size="sm"
                            variant="ghost"
                            isDisabled={isConnecting}
                          />
                        </PopoverTrigger>
                        <PopoverContent width="300px" zIndex={1500}>
                          <PopoverBody p={0}>
                            <Box>
                              <Tabs
                                isFitted
                                variant="soft-rounded"
                                colorScheme="blue"
                                size="sm"
                                onChange={(index) =>
                                  setEmojiCategoryTab(emojiCategories[index])
                                }
                                p={2}
                              >
                                <TabList mb={2}>
                                  {emojiCategories.map((category) => (
                                    <Tab
                                      key={category}
                                      fontSize="xs"
                                      textTransform="capitalize"
                                    >
                                      {category}
                                    </Tab>
                                  ))}
                                </TabList>
                                <TabPanels>{memoizedEmojiPanels}</TabPanels>
                              </Tabs>
                            </Box>
                          </PopoverBody>
                        </PopoverContent>
                      </Popover>
                      {messageText.trim() ? (
                        <IconButton
                          aria-label="Send message"
                          icon={<PaperAirplaneIcon width={20} height={20} />}
                          size="sm"
                          variant="ghost"
                          onClick={() => sendMessage(messageText)}
                          isDisabled={isConnecting}
                        />
                      ) : (
                        <IconButton
                          aria-label="Voice message"
                          icon={<MicrophoneIcon width={20} height={20} />}
                          size="sm"
                          variant="ghost"
                          onClick={startRecording}
                          isDisabled={isConnecting}
                        />
                      )}
                    </>
                  ) : (
                    <LockClosedIcon width={20} height={20} color="#CBD5E0" />
                  )}
                </HStack>
              </InputRightElement>
            </InputGroup>
          </VStack>
        ) : (
          <HStack spacing={2}>
            <InputGroup>
              <Input
                placeholder={
                  isConnecting ? "Connecting..." : "Type a message..."
                }
                bg={inputBgColor}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isConnecting}
                ref={inputRef}
              />
              <InputRightElement width="8rem">
                <HStack spacing={1}>
                  <Popover placement="top-end" isLazy>
                    <PopoverTrigger>
                      <IconButton
                        aria-label="Emoji"
                        icon={<FaceSmileIcon width={20} height={20} />}
                        size="sm"
                        variant="ghost"
                        isDisabled={isConnecting}
                      />
                    </PopoverTrigger>
                    <PopoverContent width="300px" zIndex={1500}>
                      <PopoverBody p={0}>
                        <Box>
                          <Tabs
                            isFitted
                            variant="soft-rounded"
                            colorScheme="blue"
                            size="sm"
                            onChange={(index) =>
                              setEmojiCategoryTab(emojiCategories[index])
                            }
                            p={2}
                          >
                            <TabList mb={2}>
                              {emojiCategories.map((category) => (
                                <Tab
                                  key={category}
                                  fontSize="xs"
                                  textTransform="capitalize"
                                >
                                  {category}
                                </Tab>
                              ))}
                            </TabList>
                            <TabPanels>{memoizedEmojiPanels}</TabPanels>
                          </Tabs>
                        </Box>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                  <IconButton
                    aria-label="Send image"
                    icon={<PhotoIcon width={20} height={20} />}
                    size="sm"
                    variant="ghost"
                    isDisabled={isConnecting}
                    onClick={() =>
                      toast({
                        title: "Feature coming soon",
                        status: "info",
                        duration: 2000,
                      })
                    }
                  />
                  {messageText.trim() ? (
                    <IconButton
                      aria-label="Send message"
                      icon={<PaperAirplaneIcon width={20} height={20} />}
                      size="sm"
                      colorScheme="blue"
                      onClick={() => sendMessage(messageText)}
                      isDisabled={isConnecting}
                    />
                  ) : (
                    <IconButton
                      aria-label="Voice message"
                      icon={<MicrophoneIcon width={20} height={20} />}
                      size="sm"
                      colorScheme="blue"
                      onClick={startRecording}
                      isDisabled={isConnecting}
                    />
                  )}
                </HStack>
              </InputRightElement>
            </InputGroup>
          </HStack>
        )}
      </Box>
    </Flex>
  );
};
