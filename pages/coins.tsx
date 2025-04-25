import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { useUserStore } from "../store/userStore";
import { useCoinStore, coinPackages } from "../store/coinStore";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  useColorModeValue,
  Icon,
  Badge,
  Divider,
  useToast,
  Skeleton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  CircularProgress,
  CircularProgressLabel,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { loadStripe } from "@stripe/stripe-js";
import {
  SparklesIcon,
  CurrencyDollarIcon,
  GiftIcon,
  ShoppingCartIcon,
  ArrowLeftIcon,
  WifiIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { useRouter } from "next/router";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";

// Initialize Stripe with error handling
let stripePromise: Promise<any> | null = null;
const getStripe = () => {
  if (!stripePromise) {
    // Only initialize when needed
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("Stripe publishable key is missing");
      return Promise.reject(new Error("Stripe configuration is missing"));
    }
    stripePromise = loadStripe(key).catch((error) => {
      console.error("Failed to load Stripe:", error);
      return null;
    });
  }
  return stripePromise;
};

const CoinsPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const {
    coins,
    isLoading: coinsLoading,
    isOffline,
    errorMessage,
    loadUserCoins,
    packages,
    dailyRewardClaimed,
    dailyRewardLastClaimed,
    claimDailyReward,
    resetDailyReward,
    clearError,
    setOfflineStatus,
  } = useCoinStore();
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  // Load user coins on mount
  useEffect(() => {
    if (user) {
      loadUserCoins(user.uid);
      resetDailyReward();
    }
  }, [user, loadUserCoins, resetDailyReward]);

  // Watch for online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log("App is online");
      setOfflineStatus(false);
      if (user) {
        loadUserCoins(user.uid);
      }
    };

    const handleOffline = () => {
      console.log("App is offline");
      setOfflineStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user, loadUserCoins, setOfflineStatus]);

  const handlePurchaseCoins = async (packageId: string) => {
    if (!user) {
      toast({
        title: "Please sign in first",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if offline
    if (isOffline) {
      toast({
        title: "You're offline",
        description: "Please connect to the internet to purchase coins",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setPurchaseLoading(packageId);
    setStripeError(null);

    try {
      const stripe = await getStripe().catch((err) => {
        setStripeError(
          "Failed to initialize payment system. Please try again later."
        );
        console.error("Stripe initialization error:", err);
        return null;
      });

      if (!stripe) {
        setPurchaseLoading(null);
        toast({
          title: "Payment System Unavailable",
          description:
            "The payment system is currently unavailable. Please try again later.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const response = await fetch("/api/purchase-coins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId,
          userId: user.uid,
        }),
      });

      const { sessionId } = await response.json();

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        setStripeError(error.message || "Payment error occurred");
        toast({
          title: "Payment Error",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      setStripeError(error?.message || "Failed to process payment");
      toast({
        title: "Error",
        description: "Failed to initiate purchase. Please try again later.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleClaimDailyReward = async () => {
    if (!user) return;

    // Check if offline
    if (isOffline) {
      toast({
        title: "You're offline",
        description:
          "Please connect to the internet to claim your daily reward",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setRewardLoading(true);
    try {
      const claimed = await claimDailyReward(user.uid);

      if (claimed) {
        toast({
          title: "Daily Reward Claimed!",
          description: "You've received 10 Loopin Coins!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Already Claimed",
          description: "You've already claimed your daily reward today.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim daily reward",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setRewardLoading(false);
    }
  };

  const handleRetryConnection = () => {
    if (user) {
      loadUserCoins(user.uid);
      toast({
        title: "Retrying connection",
        description: "Attempting to refresh coin data",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const canClaimDailyReward = dailyRewardLastClaimed !== today;

  const bgColor = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  const highlightBg = useColorModeValue("yellow.50", "yellow.900");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const offlineBg = useColorModeValue("orange.50", "orange.900");

  if (authLoading) {
    return (
      <Layout>
        <VStack spacing={8} py={8}>
          <Skeleton height="60px" width="80%" />
          <Skeleton height="120px" width="90%" />
          <Skeleton height="250px" width="90%" />
        </VStack>
      </Layout>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <Layout>
      <Container maxW="md" py={4}>
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Heading size="lg">
            Loopin Coins
            {isOffline && (
              <Badge ml={2} colorScheme="orange" variant="solid">
                Offline
              </Badge>
            )}
          </Heading>
          <IconButton
            aria-label="Back to profile"
            icon={<ArrowLeftIcon width={16} height={16} />}
            size="sm"
            onClick={() => router.push("/profile")}
          />
        </Flex>

        {isOffline && (
          <Alert status="warning" mb={4} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>You&apos;re offline</AlertTitle>
              <AlertDescription>
                Using cached coin data. Some features are limited.
              </AlertDescription>
            </Box>
            <Button
              size="sm"
              leftIcon={<WifiIcon width={14} height={14} />}
              ml="auto"
              onClick={handleRetryConnection}
            >
              Retry
            </Button>
          </Alert>
        )}

        {stripeError && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Payment System Error</AlertTitle>
              <AlertDescription>{stripeError}</AlertDescription>
            </Box>
            <Button
              size="sm"
              leftIcon={<ExclamationCircleIcon width={14} height={14} />}
              ml="auto"
              onClick={() => setStripeError(null)}
            >
              Dismiss
            </Button>
          </Alert>
        )}

        {errorMessage && !isOffline && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Box>
            <Button
              size="sm"
              leftIcon={<ExclamationCircleIcon width={14} height={14} />}
              ml="auto"
              onClick={clearError}
            >
              Dismiss
            </Button>
          </Alert>
        )}

        <VStack spacing={6} align="stretch">
          {/* Current Balance */}
          <Box
            as={motion.div}
            initial={{ y: 20, opacity: 0 } as any}
            animate={{ y: 0, opacity: 1 } as any}
            p={6}
            bg={cardBg}
            borderRadius="lg"
            boxShadow="md"
            textAlign="center"
          >
            <Stat>
              <StatLabel fontSize="md">Your Balance</StatLabel>
              <StatNumber fontSize="3xl" fontWeight="bold" color="yellow.400">
                {coinsLoading ? (
                  <Skeleton height="44px" width="100px" mx="auto" />
                ) : (
                  `${coins} 🪙`
                )}
              </StatNumber>
              <StatHelpText>
                {isOffline
                  ? "Cached data - connect to update"
                  : "Buy coins or earn daily rewards"}
              </StatHelpText>
            </Stat>
          </Box>

          {/* Daily Reward */}
          <Box
            as={motion.div}
            initial={{ y: 20, opacity: 0 } as any}
            animate={{ y: 0, opacity: 1 } as any}
            transition={{ delay: 0.1 } as any}
            p={6}
            bg={
              isOffline ? offlineBg : canClaimDailyReward ? highlightBg : cardBg
            }
            borderRadius="lg"
            boxShadow="md"
            borderWidth="1px"
            borderColor={
              isOffline
                ? "orange.300"
                : canClaimDailyReward
                ? "yellow.300"
                : borderColor
            }
            opacity={isOffline ? 0.7 : 1}
          >
            <VStack spacing={3}>
              <Flex align="center">
                <Icon as={GiftIcon} boxSize={6} color="yellow.500" mr={2} />
                <Heading size="md">Daily Reward</Heading>
              </Flex>
              <Text>Claim 10 free Loopin Coins every day!</Text>
              <Button
                colorScheme={isOffline ? "orange" : "yellow"}
                leftIcon={
                  isOffline ? (
                    <WifiIcon width={20} height={20} />
                  ) : (
                    <GiftIcon width={20} height={20} />
                  )
                }
                isLoading={rewardLoading}
                isDisabled={isOffline || !canClaimDailyReward}
                onClick={
                  isOffline ? handleRetryConnection : handleClaimDailyReward
                }
                width="full"
              >
                {isOffline
                  ? "Connect to Claim"
                  : canClaimDailyReward
                  ? "Claim Now"
                  : "Already Claimed Today"}
              </Button>
            </VStack>
          </Box>

          {/* Coin Packages */}
          <Box
            as={motion.div}
            initial={{ y: 20, opacity: 0 } as any}
            animate={{ y: 0, opacity: 1 } as any}
            transition={{ delay: 0.2 } as any}
            p={6}
            bg={cardBg}
            borderRadius="lg"
            boxShadow="md"
            opacity={isOffline ? 0.7 : 1}
          >
            <Heading size="md" mb={4}>
              Buy Coins
              {isOffline && (
                <Text
                  fontSize="sm"
                  color="orange.500"
                  fontWeight="normal"
                  mt={1}
                >
                  Online connection required for purchases
                </Text>
              )}
            </Heading>

            <VStack spacing={4} align="stretch">
              {coinPackages.map((pkg) => (
                <Flex
                  key={pkg.id}
                  p={4}
                  direction={{ base: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ base: "flex-start", sm: "center" }}
                  borderWidth="1px"
                  borderColor={pkg.bestValue ? "yellow.300" : borderColor}
                  borderRadius="md"
                  bg={pkg.bestValue ? highlightBg : "transparent"}
                  position="relative"
                  overflow="hidden"
                >
                  {pkg.bestValue && (
                    <Badge
                      position="absolute"
                      top={2}
                      right={2}
                      colorScheme="yellow"
                    >
                      Best Value
                    </Badge>
                  )}
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{pkg.name}</Text>
                    <HStack>
                      <Text fontSize="xl" fontWeight="bold">
                        {pkg.coins} 🪙
                      </Text>
                    </HStack>
                    <Text color="gray.500">${pkg.price.toFixed(2)}</Text>
                  </VStack>
                  <Button
                    mt={{ base: 3, sm: 0 }}
                    colorScheme={isOffline ? "gray" : "blue"}
                    leftIcon={
                      isOffline ? (
                        <WifiIcon width={18} height={18} />
                      ) : (
                        <ShoppingCartIcon width={18} height={18} />
                      )
                    }
                    isLoading={purchaseLoading === pkg.id}
                    onClick={
                      isOffline
                        ? handleRetryConnection
                        : () => handlePurchaseCoins(pkg.id)
                    }
                  >
                    {isOffline ? "Offline" : "Buy Now"}
                  </Button>
                </Flex>
              ))}
            </VStack>
          </Box>

          {/* Usage Information */}
          <Box
            as={motion.div}
            initial={{ y: 20, opacity: 0 } as any}
            animate={{ y: 0, opacity: 1 } as any}
            transition={{ delay: 0.3 } as any}
            p={6}
            bg={cardBg}
            borderRadius="lg"
            boxShadow="md"
          >
            <Heading size="md" mb={4}>
              How to Use Coins
            </Heading>
            <VStack spacing={2} align="start">
              <Text>• Boost your profile (50 coins)</Text>
              <Text>• Extend chat duration (30 coins)</Text>
              <Text>• Send special reactions (10 coins)</Text>
              <Text>• Access premium filters (25 coins)</Text>
              <Text>• Gift items to other users (varies)</Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
};

export default CoinsPage;
