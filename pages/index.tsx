import type { NextPage } from "next";
import Head from "next/head";
import { VideoChat } from "../components/VideoChat";
import { useUserStore } from "../store/userStore";

const Home: NextPage = () => {
  const { user, isLoading } = useUserStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in to continue</div>;
  }

  return (
    <div>
      <Head>
        <title>Social Video Chat</title>
        <meta name="description" content="Modern social video chat app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <VideoChat />
      </main>
    </div>
  );
};

export default Home;