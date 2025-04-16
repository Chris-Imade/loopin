
import { useEffect, useState } from 'react';
import { useUserStore } from '../store/userStore';
import dynamic from 'next/dynamic';

// Dynamically import AgoraRTC with no SSR
const AgoraRTC = dynamic(() => import('agora-rtc-sdk-ng'), {
  ssr: false,
});

export const VideoChat = () => {
  const [client, setClient] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
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
    if (!client || !user) return;

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
  };

  useEffect(() => {
    if (client && user) {
      initializeAgora();
    }
    return () => {
      client?.leave();
      localVideoTrack?.close();
    };
  }, [client, user]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="relative w-full max-w-4xl">
        <div className="grid grid-cols-2 gap-4">
          {localVideoTrack && (
            <div className="relative aspect-video">
              <div ref={(el) => el && localVideoTrack.play(el)} className="w-full h-full" />
            </div>
          )}
          {remoteVideoTrack && (
            <div className="relative aspect-video">
              <div ref={(el) => el && remoteVideoTrack.play(el)} className="w-full h-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
