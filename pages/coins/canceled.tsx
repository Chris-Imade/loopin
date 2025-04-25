import { useRouter } from "next/router";
import { Layout } from "../../components/Layout";
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { XCircleIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";

// Mark this page as client-side only
export const dynamic = "force-dynamic";

const CanceledPage = () => {
  const router = useRouter();
  const cardBg = useColorModeValue("white", "gray.700");

  // Handle navigation in a client-safe way
  const handleReturnToCoins = () => {
    router.push("/coins");
  };

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
            <VStack spacing={6}>
              <Icon as={XCircleIcon} w={20} h={20} color="red.500" mb={2} />
              <Heading size="lg">Purchase Canceled</Heading>
              <Text fontSize="lg">
                Your coin purchase was canceled. No payment was processed.
              </Text>
              <Button
                leftIcon={<ArrowLeftIcon width={16} height={16} />}
                colorScheme="blue"
                size="lg"
                width="full"
                onClick={handleReturnToCoins}
                mt={4}
              >
                Return to Coins
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
};

export default CanceledPage;
