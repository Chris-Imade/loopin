
import { useEffect, useState } from 'react';
import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { useUserStore } from '../store/userStore';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

export const VideoChat = () => {
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null);
  const { user } = useUserStore();

  const initializeAgora = async () => {
    await client.join(
      process.env.NEXT_PUBLIC_AGORA_APP_ID!,
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
    if (user) {
      initializeAgora();
    }
    return () => {
      client.leave();
      localVideoTrack?.close();
    };
  }, [user]);

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
