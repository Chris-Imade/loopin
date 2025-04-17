import type { NextPage } from "next";
import { Layout } from "../components/Layout";
import { VideoChat } from "../components/VideoChat";
import { useUserStore } from "../store/userStore";
import { AuthButtons } from "../components/auth/AuthButtons";
import {
  Box,
  Center,
  Container,
  Heading,
  Text,
  VStack,
  Spinner,
  useColorModeValue,
  Flex,
} from "@chakra-ui/react";

const Home: NextPage = () => {
  const { user, isLoading } = useUserStore();
  const bgGradient = useColorModeValue(
    "linear(to-r, blue.400, purple.500)",
    "linear(to-r, blue.600, purple.700)",
  );

  if (isLoading) {
    return (
      <Layout>
        <Center h="80vh">
          <Spinner size="xl" />
        </Center>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <Box
          minH="90vh"
          bgGradient={bgGradient}
          py={20}
          px={4}
          position="relative"
          overflow="hidden"
        >
          <Container maxW="container.xl">
            <Flex
              direction={{ base: "column", lg: "row" }}
              align="center"
              justify="space-between"
              gap={8}
            >
              <Box flex="1" maxW={{ base: "100%", lg: "50%" }}>
                <VStack spacing={8} textAlign="center">
                  <Heading
                    fontSize={{ base: "4xl", md: "5xl" }}
                    fontWeight="bold"
                    color="white"
                  >
                    Connect with People Worldwide
                  </Heading>
                  <Text fontSize="xl" color="whiteAlpha.900">
                    Join our video chat community and make new friends across
                    the globe
                  </Text>
                  <Box
                    bg={useColorModeValue("white", "gray.800")}
                    p={8}
                    rounded="xl"
                    shadow="2xl"
                    w="full"
                  >
                    <AuthButtons />
                  </Box>
                </VStack>
              </Box>
              <Box
                display={{ base: "none", lg: "block" }}
                flex="1"
                h="600px"
                position="relative"
              >
                <Box
                  position="absolute"
                  right="0"
                  top="50%"
                  transform="translateY(-50%)"
                  w="full"
                  h="full"
                  bgImage="/vci-image.gif"
                  bgSize="contain"
                  bgPosition="center"
                  bgRepeat="no-repeat"
                />
              </Box>
            </Flex>
          </Container>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <VideoChat />
    </Layout>
  );
};

export default Home;
