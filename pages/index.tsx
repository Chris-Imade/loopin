
import type { NextPage } from "next";
import { Layout } from "../components/Layout";
import { VideoChat } from "../components/VideoChat";
import { useUserStore } from "../store/userStore";
import { Button, Center, Spinner, Text, VStack } from "@chakra-ui/react";

const Home: NextPage = () => {
  const { user, isLoading, signIn } = useUserStore();

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
        <Center h="80vh">
          <VStack spacing={4}>
            <Text fontSize="xl">Welcome to Social Video Chat</Text>
            <Button colorScheme="blue" onClick={signIn}>
              Sign in to continue
            </Button>
          </VStack>
        </Center>
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
