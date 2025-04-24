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
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { CheckCircleIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";

const SuccessPage = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { coins } = useCoinStore();
  const [isProcessing, setIsProcessing] = useState(true);
  const { session_id } = router.query;

  useEffect(() => {
    // In a real implementation, you would verify the session with Stripe here
    // For demo purposes, we'll just simulate a processing delay
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [session_id]);

  const cardBg = useColorModeValue("white", "gray.700");

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <Layout>
      <Container maxW="md" py={8}>
        <VStack spacing={6} align="stretch">
          <Box
            as={motion.div}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
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
                <Text fontWeight="bold" fontSize="2xl" color="yellow.400">
                  Current Balance: {coins} 🪙
                </Text>
                <Button
                  leftIcon={<ArrowLeftIcon width={16} height={16} />}
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  onClick={() => router.push("/coins")}
                  mt={4}
                >
                  Return to Coins
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
