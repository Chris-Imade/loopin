/**
 * AudioRecordingService - Handles voice message recording functionality
 *
 * This service provides methods to record, store, and manage audio messages
 * for the chat application.
 */

interface AudioRecordingResult {
  audioUrl: string;
  duration: number;
  blob: Blob;
}

class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: BlobPart[] = [];
  private audioBlob: Blob | null = null;
  private stream: MediaStream | null = null;

  /**
   * Start recording audio from the user's microphone
   * @returns Promise<boolean> Success status
   */
  async startRecording(): Promise<boolean> {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      // Request microphone permission
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create media recorder with optimal settings for voice
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: 128000, // 128kbps - good for voice
      });

      this.audioChunks = [];

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data in 100ms chunks
      return true;
    } catch (error) {
      console.error("Error starting audio recording:", error);
      return false;
    }
  }

  /**
   * Stop recording and get the audio data
   * @returns Promise<AudioRecordingResult> Audio data with URL and duration
   */
  async stopRecording(): Promise<AudioRecordingResult> {
    if (!this.mediaRecorder) {
      throw new Error("Recording not started");
    }

    return new Promise((resolve, reject) => {
      try {
        this.mediaRecorder!.onstop = async () => {
          // Create blob from recorded chunks
          const mimeType = this.getSupportedMimeType();
          this.audioBlob = new Blob(this.audioChunks, { type: mimeType });

          // Generate temporary URL for the blob
          const tempUrl = URL.createObjectURL(this.audioBlob);

          // Get audio duration
          const audioDuration = await this.getAudioDuration(this.audioBlob);

          this.releaseMediaResources();

          try {
            // Upload to server and get permanent URL
            const permanentUrl = await this.uploadAudio(
              this.audioBlob,
              audioDuration
            );

            resolve({
              audioUrl: permanentUrl,
              duration: audioDuration,
              blob: this.audioBlob,
            });
          } catch (uploadError) {
            console.error("Upload failed, using temporary URL:", uploadError);
            // Fallback to temporary URL if upload fails
            resolve({
              audioUrl: tempUrl,
              duration: audioDuration,
              blob: this.audioBlob,
            });
          }
        };

        // Stop recording
        this.mediaRecorder.stop();
      } catch (error) {
        console.error("Error stopping audio recording:", error);
        this.releaseMediaResources();
        reject(error);
      }
    });
  }

  /**
   * Cancel recording and release resources
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      // Stop the recording
      this.mediaRecorder.stop();
      this.releaseMediaResources();

      // Clear the recorded data
      this.audioChunks = [];
      this.audioBlob = null;
    }
  }

  /**
   * Upload the recorded audio to server
   * @param blob The audio blob to upload
   * @param duration The duration of the audio in seconds
   * @returns Promise<string> The permanent URL of the uploaded audio
   */
  async uploadAudio(blob: Blob, duration: number): Promise<string> {
    try {
      // Get auth token from local storage or your auth service
      const token = await this.getAuthToken();

      if (!token) {
        throw new Error("No authentication token available");
      }

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append("audio", blob, `recording.${this.getFileExtension()}`);
      formData.append("duration", duration.toString());

      // Upload to our API endpoint
      const response = await fetch("/api/messages/upload-audio", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading audio:", error);
      throw error;
    }
  }

  /**
   * Get authentication token from storage or auth service
   * @returns Promise<string|null> The auth token or null if not available
   */
  private async getAuthToken(): Promise<string | null> {
    // This implementation depends on your auth system
    // For example, if using Firebase:
    // return auth.currentUser?.getIdToken() || null;

    // For this example, get from localStorage
    return localStorage.getItem("authToken");
  }

  /**
   * Get the duration of an audio blob
   * @param audioBlob The audio blob
   * @returns Promise<number> Duration in seconds
   */
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
        const estimatedDuration = fileSizeInKB / 12; // ~12KB per second for compressed audio
        resolve(estimatedDuration);
      });
    });
  }

  /**
   * Get the supported MIME type for audio recording
   * @returns string The supported MIME type
   */
  private getSupportedMimeType(): string {
    if (typeof window === "undefined") {
      return "audio/webm";
    }

    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4;codecs=opus",
      "audio/mpeg",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "audio/webm"; // Default fallback
  }

  /**
   * Get the file extension based on MIME type
   * @returns string The file extension
   */
  private getFileExtension(): string {
    const mimeType = this.getSupportedMimeType();
    if (mimeType.includes("webm")) return "webm";
    if (mimeType.includes("ogg")) return "ogg";
    if (mimeType.includes("mp4")) return "m4a";
    if (mimeType.includes("mpeg")) return "mp3";
    return "webm"; // Default
  }

  /**
   * Release media resources
   */
  private releaseMediaResources(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
  }
}

// Create a singleton instance
const audioRecordingService = new AudioRecordingService();
export default audioRecordingService;
