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
        <Flex minH="100vh" direction={{ base: "column", lg: "row" }}>
            <Box
              flex="1"
              bgGradient={bgGradient}
              py={20}
              px={8}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <VStack spacing={8} maxW="500px">
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
              bgImage="/vci-image.gif"
              bgSize="cover"
              bgPosition="center"
            />
          </Flex>
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