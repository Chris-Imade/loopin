
import { useEffect, useState } from 'react';
import { useUserStore } from '../store/userStore';
import dynamic from 'next/dynamic';
import { Box, Button, Flex, Grid, IconButton, Text, VStack } from '@chakra-ui/react';
import { PhoneXMarkIcon, VideoCameraIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

const AgoraRTC = dynamic(() => import('agora-rtc-sdk-ng'), { ssr: false });

export const VideoChat = () => {
  const [client, setClient] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { user } = useUserStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initClient = async () => {
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);
    };

    initClient();
  }, []);

  const initializeAgora = async () => {
    if (!client || !user || isConnecting) {
      console.log('Cannot initialize:', { client, user, isConnecting });
      return;
    }
    setIsConnecting(true);

    try {
      await client.join(
        process.env.NEXT_PUBLIC_AGORA_APP_ID,
        'default-channel',
        null,
        user.uid
      );

      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalVideoTrack(tracks[1]);
      await client.publish(tracks);

      client.on('user-published', async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === 'video') {
          setRemoteVideoTrack(remoteUser.videoTrack);
        }
      });
    } catch (error) {
      console.error('Failed to initialize video chat:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      localVideoTrack?.close();
      await client?.leave();
      setLocalVideoTrack(null);
      setRemoteVideoTrack(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  useEffect(() => {
    return () => {
      handleDisconnect();
    };
  }, []);

  return (
    <VStack spacing={6} w="full">
      <Text fontSize="2xl" fontWeight="bold">Video Chat</Text>
      
      <Grid
        templateColumns={{ base: '1fr', md: remoteVideoTrack ? 'repeat(2, 1fr)' : '1fr' }}
        gap={4}
        w="full"
      >
        {localVideoTrack && (
          <Box
            position="relative"
            bg="gray.800"
            borderRadius="xl"
            overflow="hidden"
            aspectRatio={16/9}
          >
            <div ref={(el) => el && localVideoTrack.play(el)} style={{ width: '100%', height: '100%' }} />
            <Text
              position="absolute"
              bottom={2}
              left={2}
              bg="blackAlpha.700"
              px={2}
              py={1}
              borderRadius="md"
              fontSize="sm"
            >
              You
            </Text>
          </Box>
        )}
        
        {remoteVideoTrack && (
          <Box
            position="relative"
            bg="gray.800"
            borderRadius="xl"
            overflow="hidden"
            aspectRatio={16/9}
          >
            <div ref={(el) => el && remoteVideoTrack.play(el)} style={{ width: '100%', height: '100%' }} />
            <Text
              position="absolute"
              bottom={2}
              left={2}
              bg="blackAlpha.700"
              px={2}
              py={1}
              borderRadius="md"
              fontSize="sm"
            >
              Partner
            </Text>
          </Box>
        )}
      </Grid>

      <Flex gap={4} justify="center" mt={4}>
        {!localVideoTrack ? (
          <Button
            leftIcon={<VideoCameraIcon width={20} />}
            colorScheme="blue"
            isLoading={isConnecting}
            onClick={initializeAgora}
          >
            Start Video Chat
          </Button>
        ) : (
          <>
            <IconButton
              aria-label="Find new partner"
              icon={<ArrowPathIcon width={20} />}
              colorScheme="blue"
              isLoading={isConnecting}
              onClick={async () => {
                await handleDisconnect();
                await initializeAgora();
              }}
            />
            <IconButton
              aria-label="End call"
              icon={<PhoneXMarkIcon width={20} />}
              colorScheme="red"
              onClick={handleDisconnect}
            />
          </>
        )}
      </Flex>
    </VStack>
  );
};
