/**
 * Utility for loading Agora RTC SDK with retry capabilities
 */

// Add type definition for NetworkInformation API
interface NetworkInformation {
  saveData: boolean;
  effectiveType: string;
}

// Extend Navigator type
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

// Cache the imported module to prevent multiple imports
let cachedAgoraRTC: any = null;

/**
 * Load the Agora RTC SDK with retry capabilities
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelay Initial delay in ms (will increase with backoff)
 * @returns The Agora RTC SDK module or null on failure
 */
export const loadAgoraRTCModule = async (
  maxRetries = 3,
  initialDelay = 1000
): Promise<any | null> => {
  // Return cached module if available
  if (cachedAgoraRTC) {
    return cachedAgoraRTC;
  }

  // Only run in browser environment
  if (typeof window === "undefined") {
    console.log("[AGORA] Not loading in SSR environment");
    return null;
  }

  // Try to load the module with retries
  let retryCount = 0;

  const attemptLoad = async (): Promise<any | null> => {
    try {
      console.log(
        `[AGORA] Loading SDK (attempt ${retryCount + 1}/${maxRetries})`
      );

      // Add a small randomization to prevent multiple simultaneous requests
      const jitter = Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, jitter));

      // Use chunk preloading to ensure the chunk is available
      if (
        window.navigator &&
        (navigator as NavigatorWithConnection).connection &&
        ((navigator as NavigatorWithConnection).connection?.saveData ===
          false ||
          (navigator as NavigatorWithConnection).connection?.effectiveType ===
            "4g")
      ) {
        // Preload only if not on save-data mode and on a good connection
        const moduleUrl =
          "/_next/static/chunks/node_modules_agora-rtc-sdk-ng_AgoraRTC_N-production_fba3a36b.js";
        const preloadLink = document.createElement("link");
        preloadLink.rel = "preload";
        preloadLink.as = "script";
        preloadLink.href = moduleUrl;
        document.head.appendChild(preloadLink);
      }

      // Actual import
      const AgoraRTCModule = await import("agora-rtc-sdk-ng");

      // Cache the result
      cachedAgoraRTC = AgoraRTCModule.default;

      console.log("[AGORA] SDK loaded successfully");
      return cachedAgoraRTC;
    } catch (error) {
      console.error(`[AGORA] Error loading SDK:`, error);

      if (retryCount < maxRetries - 1) {
        retryCount++;
        const delay =
          initialDelay * Math.pow(2, retryCount) + Math.random() * 1000;
        console.log(`[AGORA] Retrying in ${Math.round(delay)}ms...`);

        // Wait with exponential backoff + jitter
        await new Promise((resolve) => setTimeout(resolve, delay));
        return attemptLoad();
      } else {
        console.error("[AGORA] Max retries reached, giving up");
        return null;
      }
    }
  };

  return attemptLoad();
};

export default loadAgoraRTCModule;
