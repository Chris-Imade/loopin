// Use dynamic imports for browser-only modules
// The actual import will happen at runtime on the client
let AgoraRTM: any = null;

interface MessageCallback {
  (senderId: string, message: string): void;
}

interface EmojiData {
  name: string;
  unified: string;
  shortnames: string[];
  category: string;
}

class AgoraRTMService {
  private client: any = null;
  private channel: any = null;
  private messageCallbacks: MessageCallback[] = [];
  private appId: string;
  private ready = false;
  private userId = "";
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: BlobPart[] = [];
  private audioBlob: Blob | null = null;

  // Expanded emoji list with categories
  public emojis = {
    smileys: [
      "😀",
      "😁",
      "😂",
      "🤣",
      "😃",
      "😄",
      "😅",
      "😆",
      "😉",
      "😊",
      "😋",
      "😎",
      "😍",
      "😘",
      "🥰",
      "😗",
      "😙",
      "😚",
      "🙂",
      "🤗",
    ],
    gestures: [
      "👍",
      "👎",
      "👌",
      "✌️",
      "🤞",
      "🤟",
      "🤙",
      "🖕",
      "🖐️",
      "✋",
      "👋",
      "👏",
      "🙌",
      "🙏",
      "🤝",
      "💪",
      "💅",
      "👂",
      "👃",
      "🧠",
    ],
    hearts: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "♥️",
      "😻",
      "💔",
      "💌",
    ],
    activities: [
      "🎉",
      "🎊",
      "🎈",
      "🎂",
      "🎁",
      "🎮",
      "🕹️",
      "🎯",
      "🎲",
      "🎭",
      "🎨",
      "🎤",
      "🎧",
      "🎼",
      "🎹",
      "🥁",
      "🎷",
      "🎸",
      "🎻",
      "🎬",
    ],
    animals: [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
      "🙈",
      "🙉",
      "🙊",
      "🐔",
      "🐧",
    ],
    food: [
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🍆",
      "🥑",
      "🥦",
      "🥬",
    ],
  };

  constructor(appId: string = process.env.NEXT_PUBLIC_AGORA_APP_ID || "") {
    this.appId = appId;
  }

  private async loadAgoraRTM() {
    if (typeof window === "undefined") {
      return false;
    }

    if (!AgoraRTM) {
      try {
        // Dynamic import only on client side
        AgoraRTM = (await import("agora-rtm-sdk")).default;
      } catch (err) {
        console.error("Failed to load Agora RTM SDK:", err);
        return false;
      }
    }

    return true;
  }

  async init(userId: string) {
    try {
      if (!this.appId) {
        console.error("Agora App ID is not set");
        return false;
      }

      // Ensure we're on client side and load the SDK
      if (!(await this.loadAgoraRTM())) {
        return false;
      }

      // For Agora RTM 2.x, we need to use the SDK differently
      // Create a new instance with appId
      try {
        // @ts-ignore - Ignore type checking for Agora SDK
        this.client = new AgoraRTM.RTM(this.appId);
        const { status } = await this.client.login(userId);

        if (status !== "SUCCESS") {
          throw new Error(`Login failed with status: ${status}`);
        }

        // Set up message event handler for RTM 2.x
        this.client.on("MessageFromPeer", (message) => {
          this.messageCallbacks.forEach((callback) => {
            callback(message.publisher, message.text);
          });
        });
      } catch (err) {
        console.error("RTM initialization error:", err);
        // Fallback method for different Agora RTM versions
        try {
          // @ts-ignore - Ignore type checking for Agora SDK
          this.client = AgoraRTM.createInstance(this.appId);
          await this.client.login({ uid: userId });

          // Set up message event handler for RTM 1.x
          this.client.on("MessageFromPeer", ({ text }, peerId) => {
            this.messageCallbacks.forEach((callback) => {
              callback(peerId, text);
            });
          });
        } catch (fallbackErr) {
          console.error("RTM fallback initialization error:", fallbackErr);
          return false;
        }
      }

      this.userId = userId;
      this.ready = true;
      return true;
    } catch (error) {
      console.error("Error initializing Agora RTM client", error);
      return false;
    }
  }

  async joinChannel(channelName: string) {
    if (!this.ready || !this.client) {
      return false;
    }

    try {
      // Try RTM 2.x method first
      try {
        // @ts-ignore
        this.channel = await this.client.createChannel(channelName);
        const { status } = await this.channel.join();

        if (status !== "SUCCESS") {
          throw new Error(`Channel join failed with status: ${status}`);
        }

        // Set up channel message event handler for RTM 2.x
        this.channel.on("ChannelMessage", (message: any) => {
          this.messageCallbacks.forEach((callback) => {
            callback(message.publisher, message.text);
          });
        });
      } catch (err) {
        // Fallback to RTM 1.x method
        console.log("Using RTM 1.x channel method", err);
        // @ts-ignore
        this.channel = this.client.createChannel(channelName);
        await this.channel.join();

        // Set up channel message event handler for RTM 1.x
        this.channel.on("ChannelMessage", (message: any, memberId: string) => {
          this.messageCallbacks.forEach((callback) => {
            callback(memberId, message.text);
          });
        });
      }

      return true;
    } catch (error) {
      console.error("Error joining channel", error);
      return false;
    }
  }

  async sendMessageToPeer(peerId: string, message: string) {
    if (!this.ready || !this.client) {
      return false;
    }

    try {
      // Try RTM 2.x method first
      try {
        // @ts-ignore
        const result = await this.client.sendMessageToPeer(
          {
            text: message,
          },
          peerId
        );
        return result.status === "SUCCESS";
      } catch (err) {
        // Fallback to RTM 1.x method
        // @ts-ignore
        await this.client.sendMessageToPeer({ text: message }, peerId);
        return true;
      }
    } catch (error) {
      console.error("Error sending peer message", error);
      return false;
    }
  }

  async sendChannelMessage(message: string) {
    if (!this.ready || !this.channel) {
      return false;
    }

    try {
      // Try RTM 2.x method first
      try {
        // @ts-ignore
        const result = await this.channel.sendMessage({ text: message });
        return result.status === "SUCCESS";
      } catch (err) {
        // Fallback to RTM 1.x method
        // @ts-ignore
        await this.channel.sendMessage({ text: message });
        return true;
      }
    } catch (error) {
      console.error("Error sending channel message", error);
      return false;
    }
  }

  onMessage(callback: MessageCallback) {
    this.messageCallbacks.push(callback);
  }

  removeMessageListener(callback: MessageCallback) {
    this.messageCallbacks = this.messageCallbacks.filter(
      (cb) => cb !== callback
    );
  }

  async logout() {
    if (this.channel) {
      try {
        // Try RTM 2.x method first
        try {
          // @ts-ignore
          const result = await this.channel.leave();
          if (result.status !== "SUCCESS") {
            throw new Error(
              `Channel leave failed with status: ${result.status}`
            );
          }
        } catch (err) {
          // Fallback to RTM 1.x method
          // @ts-ignore
          await this.channel.leave();
        }
      } catch (error) {
        console.error("Error leaving channel", error);
      }
      this.channel = null;
    }

    if (this.client) {
      try {
        // Try RTM 2.x method first
        try {
          // @ts-ignore
          const result = await this.client.logout();
          if (result.status !== "SUCCESS") {
            throw new Error(`Logout failed with status: ${result.status}`);
          }
        } catch (err) {
          // Fallback to RTM 1.x method
          // @ts-ignore
          await this.client.logout();
        }
      } catch (error) {
        console.error("Error logging out", error);
      }
      this.client = null;
    }

    this.ready = false;
    this.userId = "";
  }

  getAllEmojis(): string[] {
    return Object.values(this.emojis).flat();
  }

  getEmojisByCategory(category: keyof typeof this.emojis): string[] {
    return this.emojis[category] || [];
  }

  isReady() {
    return this.ready;
  }

  // Audio recording methods
  async startAudioRecording(): Promise<boolean> {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error("Error starting audio recording:", error);
      return false;
    }
  }

  async stopAudioRecording(): Promise<{ audioUrl: string; duration: number }> {
    if (!this.mediaRecorder) {
      throw new Error("Recording not started");
    }

    return new Promise((resolve, reject) => {
      try {
        this.mediaRecorder!.onstop = async () => {
          // Create blob from recorded chunks
          this.audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });

          // Create URL for the blob
          const audioUrl = URL.createObjectURL(this.audioBlob);

          // Get audio duration
          const audioDuration = await this.getAudioDuration(this.audioBlob);

          // Stop tracks to release microphone
          const tracks = this.mediaRecorder!.stream.getTracks();
          tracks.forEach((track) => track.stop());

          resolve({
            audioUrl,
            duration: audioDuration,
          });
        };

        // Stop recording
        this.mediaRecorder.stop();
      } catch (error) {
        console.error("Error stopping audio recording:", error);
        reject(error);
      }
    });
  }

  cancelAudioRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      // Stop the recording
      this.mediaRecorder.stop();

      // Release microphone
      const tracks = this.mediaRecorder.stream.getTracks();
      tracks.forEach((track) => track.stop());

      // Clear the recorded data
      this.audioChunks = [];
      this.audioBlob = null;
    }
  }

  private getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audioElement = new Audio();
      audioElement.src = URL.createObjectURL(audioBlob);

      audioElement.addEventListener("loadedmetadata", () => {
        // Get duration in seconds
        resolve(audioElement.duration);

        // Clean up
        URL.revokeObjectURL(audioElement.src);
      });

      // Handle errors and provide fallback duration
      audioElement.addEventListener("error", () => {
        console.warn("Error getting audio duration, using estimate");
        // Estimate duration based on file size (rough estimate)
        const fileSizeInKB = audioBlob.size / 1024;
        const estimatedDuration = fileSizeInKB / 12; // ~12KB per second for WebM
        resolve(estimatedDuration);
      });
    });
  }

  // Method to upload audio to storage and get a permanent URL
  async uploadAudio(audioBlob: Blob): Promise<string> {
    // In a real implementation, you would upload the blob to your storage service
    // For now, we'll use the temporary object URL
    return URL.createObjectURL(audioBlob);
  }
}

// Create a singleton instance
const agoraRTMService = new AgoraRTMService();
export default agoraRTMService;
