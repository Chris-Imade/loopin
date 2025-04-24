import { useEffect, useState, useRef } from "react";
import { useUserStore } from "../store/userStore";
import {
  Box,
  Button,
  Flex,
  Text,
  VStack,
  IconButton,
  useToast,
  HStack,
  Tooltip,
  Badge,
  Heading,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Center,
} from "@chakra-ui/react";
import {
  PhoneXMarkIcon,
  VideoCameraIcon,
  ArrowPathIcon,
  UserPlusIcon,
  SparklesIcon,
  SignalIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useRouter } from "next/router";
import { RandomWaitingMessage } from "./RandomWaitingMessage";

export const VideoChat = () => {
  const [client, setClient] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMainViewPartner, setIsMainViewPartner] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState("excellent");
  const [showControls, setShowControls] = useState(true);
  const [waitingMessage, setWaitingMessage] = useState("");
  const { user } = useUserStore();
  const [AgoraRTC, setAgoraRTC] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const swipeStartRef = useRef(0);
  const swipeRef = useRef(null);
  const controls = useAnimation();
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: true });
  const toast = useToast();
  const router = useRouter();

  // Mock data for contact status
  const isPremium = user?.isPremium || false;
  const [contactAdded, setContactAdded] = useState(false);

  // Fun waiting messages
  const waitingMessages = [
    "Looking for someone as awesome as you...",
    "Searching the galaxy for your next chat buddy...",
    "Roses are red, violets are blue, finding someone special just for you...",
    "Did you know? The average person meets 10,000 people in their lifetime.",
    "Fun fact: You're only 6 connections away from anyone on Earth!",
    "Hang tight! Great conversations are worth waiting for.",
    "Matching you with someone who might change your perspective...",
    "What's the best thing about Switzerland? Not sure, but the flag is a big plus.",
    "Why don't scientists trust atoms? Because they make up everything.",
    "I was going to tell a time-traveling joke, but you didn't like it.",
    "Life's like a box of matches, finding the right one makes you light up!",
    "Connecting dots and people since 2023!",
    "The real treasure was the friends we made along the way...",
    "Plot twist: Your next best friend is loading...",
    "Shuffling through amazing people to find your match...",
  ];

  // Choose random message when searching begins
  useEffect(() => {
    if (isSearching) {
      const randomIndex = Math.floor(Math.random() * waitingMessages.length);
      setWaitingMessage(waitingMessages[randomIndex]);

      // Change message every 8 seconds if still searching
      const messageInterval = setInterval(() => {
        if (isSearching) {
          const newIndex = Math.floor(Math.random() * waitingMessages.length);
          setWaitingMessage(waitingMessages[newIndex]);
        }
      }, 8000);

      return () => clearInterval(messageInterval);
    }
  }, [isSearching]);

  useEffect(() => {
    // Import AgoraRTC only on client-side
    const loadAgora = async () => {
      const AgoraRTCModule = await import("agora-rtc-sdk-ng");
      setAgoraRTC(AgoraRTCModule.default);
    };

    loadAgora();
  }, []);

  useEffect(() => {
    if (!AgoraRTC || typeof window === "undefined") return;

    const initClient = async () => {
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(agoraClient);
    };

    initClient();
  }, [AgoraRTC]);

  // Effect to play video tracks whenever they change
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }

    if (remoteVideoTrack && remoteVideoRef.current) {
      remoteVideoTrack.play(remoteVideoRef.current);
    }

    return () => {
      if (localVideoTrack) {
        localVideoTrack.stop();
      }
      if (remoteVideoTrack) {
        remoteVideoTrack.stop();
      }
    };
  }, [localVideoTrack, remoteVideoTrack, isMainViewPartner]);

  // Set up the hide/show controls functionality
  useEffect(() => {
    const handleInteraction = () => {
      setShowControls(true);

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      controlsTimeoutRef.current = setTimeout(() => {
        if (remoteVideoTrack) {
          setShowControls(false);
        }
      }, 3000);
    };

    window.addEventListener("mousemove", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [remoteVideoTrack]);

  // Change connection quality randomly for demo purposes
  useEffect(() => {
    if (remoteVideoTrack) {
      const interval = setInterval(() => {
        const qualities = ["excellent", "good", "poor"];
        const randomQuality =
          qualities[Math.floor(Math.random() * qualities.length)];
        setConnectionQuality(randomQuality);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [remoteVideoTrack]);

  const handleDisconnect = async () => {
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    if (client) {
      await client.leave();
    }
    setLocalVideoTrack(null);
    setRemoteVideoTrack(null);
    setIsSearching(false);
    setContactAdded(false);
  };

  const initializeAgora = async () => {
    if (!client || !user || !AgoraRTC || isConnecting) {
      console.log("Cannot initialize:", {
        client,
        user,
        AgoraRTC,
        isConnecting,
      });
      return;
    }
    onClose(); // Close welcome modal if open
    setIsConnecting(true);
    setIsSearching(true);

    try {
      // Skip artificial delay if we're coming from a swipe (already showing searching animation)
      if (!swipeStartRef.current) {
        // Show searching animation for a better user experience if this is first connection
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      await client.join(
        process.env.NEXT_PUBLIC_AGORA_APP_ID || "your-app-id",
        "default-channel",
        null,
        user.uid
      );

      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalVideoTrack(tracks[1]);
      await client.publish(tracks);

      client.on("user-published", async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === "video") {
          setRemoteVideoTrack(remoteUser.videoTrack);
          setIsMainViewPartner(true);
          setIsSearching(false);

          toast({
            title: "Connected with someone!",
            description: "Swipe up to find someone new.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") {
          setRemoteVideoTrack(null);
          toast({
            title: "User disconnected",
            description: "Your chat partner has left the call.",
            status: "info",
            duration: 3000,
            isClosable: true,
          });
        }
      });

      client.on("user-left", () => {
        setRemoteVideoTrack(null);
      });
    } catch (error) {
      console.error("Failed to initialize video chat:", error);
      toast({
        title: "Connection failed",
        description: "Could not connect to video chat. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const switchView = () => {
    if (remoteVideoTrack) {
      setIsMainViewPartner((prev) => !prev);
    }
  };

  const handleAddContact = () => {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description:
          "Upgrade to Premium to save contacts and message them later.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setContactAdded(true);
    toast({
      title: "Contact saved!",
      description: "You can now message this user from your contacts.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case "excellent":
        return <SignalIcon width={20} height={20} color="green" />;
      case "good":
        return <SignalIcon width={20} height={20} color="yellow" />;
      case "poor":
        return <SignalIcon width={20} height={20} color="red" />;
      default:
        return <SignalIcon width={20} height={20} color="green" />;
    }
  };

  // Handle swipe gestures
  const handleTouchStart = (e) => {
    swipeStartRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!swipeStartRef.current || !remoteVideoTrack) return;

    const currentY = e.touches[0].clientY;
    const diff = swipeStartRef.current - currentY;

    // If swiping up
    if (diff > 50) {
      controls.start({ y: `-${diff}px` });
    }
    // If swiping down
    else if (diff < -50) {
      controls.start({ y: `${Math.abs(diff)}px` });
    }
  };

  const handleTouchEnd = async (e) => {
    if (!remoteVideoTrack) return;

    const currentY = e.changedTouches[0].clientY;
    const diff = swipeStartRef.current - currentY;

    // If swiped up/down enough to change partner
    if (Math.abs(diff) > 100) {
      // Animation to slide out
      await controls.start({
        y: diff > 0 ? "-100vh" : "100vh",
        opacity: 0,
        transition: { duration: 0.3 },
      });

      await handleDisconnect();

      // Show searching before initializing
      setIsSearching(true);

      // Reset position with no animation
      await controls.set({ y: 0, opacity: 1 });

      // Initialize new connection
      initializeAgora();
    } else {
      // Spring back to center
      controls.start({
        y: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
        },
      });
    }

    swipeStartRef.current = 0;
  };

  return (
    <Box
      h="100vh"
      w="100vw"
      position="fixed"
      top={0}
      left={0}
      bg="black"
      overflow="hidden"
    >
      {/* Welcome Modal */}
      <Modal isOpen={isOpen && !localVideoTrack} onClose={onClose} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="gray.800" color="white" mx={4}>
          <ModalCloseButton />
          <ModalBody p={6}>
            <VStack spacing={6} align="center">
              <Heading size="md" textAlign="center">
                Ready to meet new people?
              </Heading>
              <Text textAlign="center">
                Loopin connects you with new friends from around the world
                through video chat.
                {!isPremium &&
                  " Upgrade to Premium for unlimited messaging and contacts!"}
              </Text>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={initializeAgora}
                isLoading={isConnecting}
                leftIcon={<VideoCameraIcon width={20} height={20} />}
                w="full"
              >
                Start Meeting People
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Main Video Reel */}
      <motion.div
        ref={swipeRef}
        animate={controls}
        transition={{ type: "spring", damping: 30 }}
        style={{
          width: "100%",
          height: "100%",
          touchAction: "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Box
          h="100%"
          w="100%"
          position="relative"
          overflow="hidden"
          bg="gray.900"
          onClick={switchView}
          cursor={remoteVideoTrack ? "pointer" : "default"}
        >
          {/* Main video container */}
          <AnimatePresence>
            {isSearching && !remoteVideoTrack && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 20,
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                }}
              >
                <Box
                  as={motion.div}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={
                    {
                      repeat: Infinity,
                      duration: 2,
                    } as any
                  }
                  mb={4}
                >
                  <VideoCameraIcon width={60} height={60} color="white" />
                </Box>
                <Text color="white" fontSize="xl" fontWeight="bold">
                  Looking for someone to chat with...
                </Text>
                <Box mt={2}>
                  <RandomWaitingMessage />
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main view */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            overflow="hidden"
          >
            {/* When remote user is connected and should be in main view */}
            {remoteVideoTrack && isMainViewPartner ? (
              <div
                ref={remoteVideoRef}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              >
                <Box
                  position="absolute"
                  top={4}
                  left={4}
                  zIndex={2}
                  bg="blackAlpha.700"
                  px={2}
                  py={1}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                >
                  {getConnectionIcon()}
                  <Text fontSize="sm" color="white" ml={1}>
                    {connectionQuality === "excellent"
                      ? "Excellent connection"
                      : connectionQuality === "good"
                      ? "Good connection"
                      : "Poor connection"}
                  </Text>
                </Box>

                {/* Swipe indicators */}
                {remoteVideoTrack && !isSearching && (
                  <>
                    {/* Up indicator */}
                    <Box
                      position="absolute"
                      top={6}
                      left="50%"
                      transform="translateX(-50%)"
                      zIndex={2}
                      opacity={0.7}
                      pointerEvents="none"
                    >
                      <Box
                        as={motion.div}
                        animate={{
                          y: [-5, -15, -5],
                        }}
                        transition={
                          {
                            repeat: Infinity,
                            duration: 2,
                          } as any
                        }
                      >
                        <Box transform="rotate(180deg)">
                          <ArrowPathIcon width={30} height={30} color="white" />
                        </Box>
                      </Box>
                      <Text
                        color="white"
                        fontSize="xs"
                        textAlign="center"
                        mt={1}
                      >
                        Swipe up for next
                      </Text>
                    </Box>

                    {/* Down indicator */}
                    <Box
                      position="absolute"
                      bottom="140px" // Above controls
                      left="50%"
                      transform="translateX(-50%)"
                      zIndex={2}
                      opacity={0.7}
                      pointerEvents="none"
                    >
                      <Box
                        as={motion.div}
                        animate={{
                          y: [5, 15, 5],
                        }}
                        transition={
                          {
                            repeat: Infinity,
                            duration: 2,
                          } as any
                        }
                      >
                        <ArrowPathIcon width={30} height={30} color="white" />
                      </Box>
                      <Text
                        color="white"
                        fontSize="xs"
                        textAlign="center"
                        mt={1}
                      >
                        Swipe down for next
                      </Text>
                    </Box>
                  </>
                )}
              </div>
            ) : (
              /* Local user's video in main view (alone or switched) */
              <div
                ref={localVideoRef}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </Box>

          {/* Picture-in-picture view (only shown when both videos are available) */}
          {remoteVideoTrack && localVideoTrack && (
            <Box
              position="absolute"
              bottom={120} // Positioned higher to avoid overlap with controls
              right={4}
              width="30%"
              aspectRatio="16/9"
              borderRadius="lg"
              overflow="hidden"
              border="2px solid white"
              boxShadow="lg"
              bg="gray.900"
              zIndex={3}
            >
              {isMainViewPartner ? (
                /* Show local video in PIP when remote is main */
                <div
                  ref={localVideoRef}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                /* Show remote video in PIP when local is main */
                <div
                  ref={remoteVideoRef}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </Box>
          )}

          {/* Video controls overlay */}
          <AnimatePresence>
            {(showControls || !remoteVideoTrack) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: "absolute",
                  bottom: "80px",
                  left: 0,
                  right: 0,
                  padding: "16px",
                  zIndex: 4,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Box
                  bg="rgba(0,0,0,0.6)"
                  borderRadius="full"
                  px={4}
                  py={3}
                  boxShadow="lg"
                >
                  <HStack spacing={4}>
                    {!localVideoTrack ? (
                      <Button
                        leftIcon={<VideoCameraIcon width={20} height={20} />}
                        colorScheme="blue"
                        isLoading={isConnecting}
                        onClick={initializeAgora}
                        size="lg"
                        shadow="lg"
                        borderRadius="full"
                      >
                        Start Video Chat
                      </Button>
                    ) : (
                      <>
                        <Tooltip label="Find new partner" placement="top">
                          <IconButton
                            aria-label="Find new partner"
                            icon={<ArrowPathIcon width={24} height={24} />}
                            colorScheme="blue"
                            isLoading={isConnecting}
                            onClick={async () => {
                              await handleDisconnect();
                              await initializeAgora();
                            }}
                            size="lg"
                            isRound
                            shadow="lg"
                          />
                        </Tooltip>

                        {remoteVideoTrack && !contactAdded && (
                          <Tooltip
                            label={
                              isPremium ? "Add to contacts" : "Premium feature"
                            }
                            placement="top"
                          >
                            <IconButton
                              aria-label="Add contact"
                              icon={
                                <Box position="relative">
                                  <UserPlusIcon width={24} height={24} />
                                  {!isPremium && (
                                    <Box
                                      position="absolute"
                                      top="-5px"
                                      right="-5px"
                                    >
                                      <SparklesIcon
                                        width={12}
                                        height={12}
                                        color="#FFD700"
                                      />
                                    </Box>
                                  )}
                                </Box>
                              }
                              colorScheme="green"
                              onClick={handleAddContact}
                              size="lg"
                              isRound
                              shadow="lg"
                            />
                          </Tooltip>
                        )}

                        {remoteVideoTrack && contactAdded && (
                          <Tooltip label="Go to messages" placement="top">
                            <IconButton
                              aria-label="Go to messages"
                              icon={
                                <Box>
                                  <UserPlusIcon width={24} height={24} />
                                  <Badge
                                    position="absolute"
                                    top="-5px"
                                    right="-5px"
                                    colorScheme="green"
                                    borderRadius="full"
                                  >
                                    ✓
                                  </Badge>
                                </Box>
                              }
                              colorScheme="green"
                              onClick={() => router.push("/messages")}
                              size="lg"
                              isRound
                              shadow="lg"
                            />
                          </Tooltip>
                        )}

                        <Tooltip label="End call" placement="top">
                          <IconButton
                            aria-label="End call"
                            icon={<PhoneXMarkIcon width={24} height={24} />}
                            colorScheme="red"
                            onClick={handleDisconnect}
                            size="lg"
                            isRound
                            shadow="lg"
                          />
                        </Tooltip>
                      </>
                    )}
                  </HStack>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </motion.div>
    </Box>
  );
};
