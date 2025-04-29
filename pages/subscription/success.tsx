import { useEffect, useState, useCallback } from "react";
import { Layout } from "../../components/Layout";
import { useRouter } from "next/router";
import { useCoinStore } from "../../store/coinStore";
import { useUserStore } from "../../store/userStore";
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Icon,
  Spinner,
  HStack,
  Badge,
  useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ArrowLeftIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

// Mark this page as client-side only
export const dynamic = "force-dynamic";

const SuccessPage = () => {
  const router = useRouter();
  const { user, setSubscriptionStatus } = useUserStore();
  const { coins, loadUserCoins, addCoins } = useCoinStore();
  const [isProcessing, setIsProcessing] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [planName, setPlanName] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [initialCoins, setInitialCoins] = useState(0);
  const [finalCoins, setFinalCoins] = useState(0);
  const [bonusCoins, setBonusCoins] = useState(0);
  const toast = useToast();

  // Get query params safely only on client-side
  useEffect(() => {
    if (router.isReady && router.query.session_id) {
      setSessionId(router.query.session_id as string);
    }
  }, [router.isReady, router.query]);

  // Save initial coin balance
  useEffect(() => {
    if (!initialCoins && coins >= 0) {
      setInitialCoins(coins);
    }
  }, [coins, initialCoins]);

  // Function to fetch coin data directly from the API
  const fetchCoinData = useCallback(async () => {
    if (!user) return 0;

    try {
      const response = await fetch(`/api/user/coins?userId=${user.uid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch coin data: ${response.statusText}`);
      }

      const data = await response.json();
      return data.coins || 0;
    } catch (error) {
      console.error("Error fetching coin data:", error);
      return 0;
    }
  }, [user]);

  // Handle verification of subscription with the server
  const verifySubscription = useCallback(async () => {
    if (!sessionId || !user) return;

    try {
      // In a real implementation, we would verify with our backend
      // For now, simulate a network request
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Parse the subscription type from URL or use a default
      const subscriptionType = router.query.plan || "premium-monthly";

      // Update user's subscription status in state
      if (typeof setSubscriptionStatus === "function") {
        setSubscriptionStatus(subscriptionType as string);
      }

      // Track bonus coins amount
      let coinBonus = 0;

      // Set plan name based on subscription type
      if (subscriptionType === "premium-monthly") {
        setPlanName("Premium Monthly");
        // Add bonus coins for premium monthly (50)
        coinBonus = 50;
      } else if (subscriptionType === "premium-yearly") {
        setPlanName("Premium Yearly");
        // Add bonus coins for premium yearly (100)
        coinBonus = 100;
      } else if (subscriptionType === "creator") {
        setPlanName("Creator Plan");
        // Add bonus coins for creator plan (150)
        coinBonus = 150;
      }

      // Set the bonus for display
      setBonusCoins(coinBonus);

      // Get current coins before adding bonus
      const currentCoins = await fetchCoinData();
      setInitialCoins(currentCoins);

      // Add coins to user's account
      if (coinBonus > 0) {
        await addCoins(user.uid, coinBonus);
      }

      // Refresh user's coin balance after a brief delay to ensure the server has updated
      setTimeout(async () => {
        // Update the store's coin balance
        await loadUserCoins(user.uid);

        // Fetch the latest balance directly from the API for accurate display
        const updatedCoins = await fetchCoinData();
        setFinalCoins(updatedCoins);
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      console.error("Error verifying subscription:", error);
      toast({
        title: "Verification Error",
        description:
          "There was an error verifying your subscription. Please contact support.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsProcessing(false);
    }
  }, [
    sessionId,
    user,
    router.query,
    setSubscriptionStatus,
    addCoins,
    loadUserCoins,
    fetchCoinData,
    toast,
  ]);

  useEffect(() => {
    if (sessionId && user) {
      verifySubscription();
    }
  }, [sessionId, user, verifySubscription]);

  // Client-side only redirect - but only if explicitly triggered
  const handleReturnToProfile = () => {
    setIsRedirecting(true);
    // Use hard navigation to ensure latest data
    window.location.href = "/profile";
  };

  // Auto-redirect after a delay
  useEffect(() => {
    if (!isProcessing && !isRedirecting) {
      const timer = setTimeout(() => {
        // Auto-redirect after 10 seconds
        setIsRedirecting(true);
        window.location.href = "/profile";
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isProcessing, isRedirecting]);

  const cardBg = useColorModeValue("white", "gray.700");

  if (!user) {
    return (
      <Layout>
        <Container maxW="md" py={8}>
          <VStack spacing={6}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
          </VStack>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="md" py={8}>
        <VStack spacing={6} align="stretch">
          <Box
            as={motion.div}
            initial={{ y: 20, opacity: 0 } as any}
            animate={{ y: 0, opacity: 1 } as any}
            transition={{ duration: 0.3 } as any}
            p={8}
            bg={cardBg}
            borderRadius="lg"
            boxShadow="md"
            textAlign="center"
          >
            {isProcessing ? (
              <VStack spacing={6}>
                <Heading size="md">Processing Your Subscription</Heading>
                <Spinner size="xl" color="blue.500" thickness="4px" />
                <Text>Please wait while we process your subscription...</Text>
              </VStack>
            ) : (
              <VStack spacing={6}>
                <Icon
                  as={CheckCircleIcon}
                  w={20}
                  h={20}
                  color="green.500"
                  mb={2}
                />
                <Heading size="lg">Subscription Active!</Heading>

                <HStack>
                  <Badge
                    colorScheme="yellow"
                    px={2}
                    py={1}
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                  >
                    <SparklesIcon
                      width={16}
                      height={16}
                      style={{ marginRight: "4px" }}
                    />
                    {planName || "Premium"}
                  </Badge>
                </HStack>

                <Text fontSize="lg">
                  Your subscription has been activated successfully.
                </Text>

                <Text fontWeight="bold" fontSize="md">
                  You now have access to all premium features!
                </Text>

                <VStack spacing={1}>
                  <Text fontSize="md" color="gray.500">
                    Previous Balance: {initialCoins} 🪙
                  </Text>
                  <Text fontSize="md" color="green.500">
                    Bonus Coins: +{bonusCoins} 🪙
                  </Text>
                  <Text fontWeight="bold" fontSize="lg" color="yellow.400">
                    Current Balance: {finalCoins || coins} 🪙
                  </Text>
                </VStack>

                <Box>
                  <Text fontSize="sm" color="gray.500" mb={4}>
                    You will be redirected to your profile automatically in a
                    few seconds...
                  </Text>
                  <Button
                    leftIcon={<ArrowLeftIcon width={16} height={16} />}
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    onClick={handleReturnToProfile}
                  >
                    Return to Profile Now
                  </Button>
                </Box>
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
};

export default SuccessPage;
