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
  useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { CheckCircleIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";

// Mark this page as client-side only
export const dynamic = "force-dynamic";

const SuccessPage = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { coins, loadUserCoins } = useCoinStore();
  const [isProcessing, setIsProcessing] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [initialCoins, setInitialCoins] = useState(0);
  const [finalCoins, setFinalCoins] = useState(0);
  const [addedCoins, setAddedCoins] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const toast = useToast();

  // Safe query parameter access
  useEffect(() => {
    if (router.isReady && router.query.session_id) {
      setSessionId(router.query.session_id as string);
    }
  }, [router.isReady, router.query]);

  // Save initial coins when component mounts
  useEffect(() => {
    if (!initialCoins && coins >= 0) {
      setInitialCoins(coins);
    }
  }, [coins, initialCoins]);

  // Function to fetch coin data directly from the API
  const fetchCoinData = useCallback(async () => {
    if (!user) return;

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

  // Verify the purchase with the server
  const verifyPurchase = useCallback(async () => {
    if (!sessionId || !user) return;

    try {
      // First get the current coin balance
      const currentBalance = await fetchCoinData();
      setInitialCoins(currentBalance);

      // Get the package info from the URL or session
      const packageId = router.query.package_id;
      let purchasedCoins = 0;

      // Default values for different packages
      switch (packageId) {
        case "small":
          purchasedCoins = 100;
          break;
        case "medium":
          purchasedCoins = 300;
          break;
        case "large":
          purchasedCoins = 750;
          break;
        default:
          purchasedCoins = 100; // Default if not specified
      }

      setAddedCoins(purchasedCoins);

      // In a real implementation, you would verify the sessionId with Stripe
      // For now we'll wait for the database to update
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Fetch updated balance from the database
      const updatedBalance = await fetchCoinData();
      setFinalCoins(updatedBalance);

      // Also update the store's coin balance
      await loadUserCoins(user.uid);

      // Complete processing
      setIsProcessing(false);

      // Show success message
      toast({
        title: "Purchase Successful!",
        description: `${purchasedCoins} coins have been added to your account.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error verifying purchase:", error);
      toast({
        title: "Verification Error",
        description:
          "There was an error processing your purchase. Please contact support.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsProcessing(false);
    }
  }, [sessionId, user, router.query, fetchCoinData, loadUserCoins, toast]);

  // Run verification when session ID is available
  useEffect(() => {
    if (sessionId && user) {
      verifyPurchase();
    }
  }, [sessionId, user, verifyPurchase]);

  // Auto-redirect after success
  useEffect(() => {
    if (!isProcessing && !isRedirecting) {
      const timer = setTimeout(() => {
        setIsRedirecting(true);
        window.location.href = "/coins";
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [isProcessing, isRedirecting]);

  // Client-side redirect function
  const handleReturnToCoins = () => {
    setIsRedirecting(true);
    window.location.href = "/coins";
  };

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
                <Heading size="md">Processing Your Purchase</Heading>
                <Spinner size="xl" color="blue.500" thickness="4px" />
                <Text>Please wait while we process your purchase...</Text>
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
                <Heading size="lg">Purchase Successful!</Heading>
                <Text fontSize="lg">
                  Your coins have been added to your balance.
                </Text>

                <VStack spacing={1}>
                  <Text fontSize="md" color="gray.500">
                    Previous Balance: {initialCoins} 🪙
                  </Text>
                  <Text fontSize="md" color="green.500">
                    Added Coins: +{addedCoins} 🪙
                  </Text>
                  <Text fontWeight="bold" fontSize="2xl" color="yellow.400">
                    New Balance: {finalCoins} 🪙
                  </Text>
                </VStack>

                <Box>
                  <Text fontSize="sm" color="gray.500" mb={4}>
                    You will be redirected to the coins page automatically in a
                    few seconds...
                  </Text>
                  <Button
                    leftIcon={<ArrowLeftIcon width={16} height={16} />}
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    onClick={handleReturnToCoins}
                  >
                    Return to Coins Now
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
