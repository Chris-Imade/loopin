import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Layout } from "../components/Layout";
import { useUserStore } from "../store/userStore";
import { loadStripe } from "@stripe/stripe-js";
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  Spinner,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";

// Mark this page as client-side only to prevent router-related errors during build
export const dynamic = "force-dynamic";

// Initialize Stripe only on the client side
const getStripePromise = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
};

const SubscriptionPage = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [planInfo, setPlanInfo] = useState<{ plan?: string; priceId?: string }>(
    {}
  );

  const cardBg = useColorModeValue("white", "gray.700");

  // First useEffect to safely get query params after hydration
  useEffect(() => {
    if (router.isReady && router.query) {
      const { plan, priceId } = router.query;
      setPlanInfo({
        plan: typeof plan === "string" ? plan : undefined,
        priceId: typeof priceId === "string" ? priceId : undefined,
      });
    }
  }, [router.isReady, router.query]);

  // Second useEffect to handle checkout after we have the query params
  useEffect(() => {
    const handleCheckout = async () => {
      if (!user || !planInfo.plan || !planInfo.priceId) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId: planInfo.priceId,
            userId: user.uid,
            planId: planInfo.plan,
          }),
        });

        const { sessionId } = await response.json();
        const stripe = await getStripePromise();

        if (stripe) {
          const { error } = await stripe.redirectToCheckout({
            sessionId,
          });

          if (error) {
            console.error("Stripe checkout error:", error);
            toast({
              title: "Payment Error",
              description: error.message,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error creating checkout session:", error);
        toast({
          title: "Error",
          description: "Failed to initiate subscription checkout",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
      }
    };

    if (user && planInfo.plan && planInfo.priceId) {
      handleCheckout();
    }
  }, [user, planInfo, toast]);

  // Client-side only redirect
  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return (
      <Layout>
        <Container maxW="md" py={8}>
          <Box
            p={8}
            bg={cardBg}
            borderRadius="lg"
            boxShadow="md"
            textAlign="center"
          >
            <VStack spacing={6}>
              <Heading size="lg">Loading...</Heading>
              <Spinner size="xl" color="blue.500" thickness="4px" />
            </VStack>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="md" py={8}>
        <Box
          p={8}
          bg={cardBg}
          borderRadius="lg"
          boxShadow="md"
          textAlign="center"
        >
          <VStack spacing={6}>
            <Heading size="lg">Redirecting to Checkout</Heading>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text>
              Please wait while we redirect you to our secure checkout page...
            </Text>
            <Button
              colorScheme="blue"
              variant="outline"
              onClick={() => router.push("/profile")}
              isDisabled={isLoading}
            >
              Cancel
            </Button>
          </VStack>
        </Box>
      </Container>
    </Layout>
  );
};

export default SubscriptionPage;
