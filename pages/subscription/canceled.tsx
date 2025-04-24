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

const CanceledPage = () => {
  const router = useRouter();
  const cardBg = useColorModeValue("white", "gray.700");

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
            <VStack spacing={6}>
              <Icon as={XCircleIcon} w={20} h={20} color="red.500" mb={2} />
              <Heading size="lg">Subscription Canceled</Heading>
              <Text fontSize="lg">
                Your subscription purchase was canceled. No payment was
                processed.
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
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
};

export default CanceledPage;
