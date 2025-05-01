import { useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { Layout } from "../../components/Layout";

export default function EmailAuthDisabled() {
  const router = useRouter();

  // Redirect after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Layout>
      <Container maxW="lg" py={12}>
        <Box
          bg={useColorModeValue("white", "gray.800")}
          p={8}
          rounded="xl"
          shadow="lg"
        >
          <VStack spacing={4}>
            <Heading size="lg">Email Authentication Disabled</Heading>

            <Text textAlign="center">
              Email authentication is currently disabled. Please use Google or
              Apple sign-in.
            </Text>

            <Button colorScheme="blue" onClick={() => router.push("/")}>
              Back to Sign In
            </Button>
          </VStack>
        </Box>
      </Container>
    </Layout>
  );
}
