import { useEffect, useState } from "react";
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
  const { user } = useUserStore();
  const { coins } = useCoinStore();
  const [isProcessing, setIsProcessing] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [planName, setPlanName] = useState("");

  // Get query params safely only on client-side
  useEffect(() => {
    if (router.isReady && router.query.session_id) {
      setSessionId(router.query.session_id as string);
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    // In a real implementation, you would verify the session with Stripe here
    // For demo purposes, we'll just simulate a processing delay
    if (!sessionId) return;

    const timer = setTimeout(() => {
      setIsProcessing(false);

      // Set plan name based on user subscription type
      if (user?.subscriptionType === "premium-monthly") {
        setPlanName("Premium Monthly");
      } else if (user?.subscriptionType === "premium-yearly") {
        setPlanName("Premium Yearly");
      } else if (user?.subscriptionType === "creator") {
        setPlanName("Creator Plan");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId, user?.subscriptionType]);

  // Client-side only redirect
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      router.push("/");
    }
  }, [user, router]);

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

                <Text fontWeight="bold" fontSize="lg" color="yellow.400">
                  Current Coin Balance: {coins} 🪙
                </Text>

                <Button
                  leftIcon={<ArrowLeftIcon width={16} height={16} />}
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  onClick={() => router.push("/profile")}
                  mt={4}
                >
                  Return to Profile
                </Button>
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
};

export default SuccessPage;
