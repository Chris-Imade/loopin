import { useEffect, useState } from "react";
import { db, rtdb } from "../firebase/config";
import {
  ref,
  onValue,
  onDisconnect,
  serverTimestamp,
  set,
} from "firebase/database";
import {
  getFirestore,
  disableNetwork,
  enableNetwork,
} from "firebase/firestore";

export const useFirebaseConnection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  useEffect(() => {
    // Listen for browser online/offline events
    const handleOnline = () => {
      console.log("📶 Browser reports online");
      setIsOnline(true);

      // Re-enable Firebase network when browser comes online
      enableNetwork(db)
        .then(() => {
          console.log("Firebase network re-enabled");
        })
        .catch((error) => {
          console.error("Failed to re-enable Firebase network:", error);
          setConnectionError(error as Error);
        });
    };

    const handleOffline = () => {
      console.log("🔌 Browser reports offline");
      setIsOnline(false);

      // Disable Firebase network to prevent unnecessary retries
      disableNetwork(db)
        .then(() => {
          console.log("Firebase network disabled");
        })
        .catch((error) => {
          console.error("Failed to disable Firebase network:", error);
          setConnectionError(error as Error);
        });
    };

    // Set up connection monitoring
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Try to set up Firebase connection monitoring if Realtime Database is available
    let unsubscribe: (() => void) | null = null;

    try {
      // Make sure rtdb and its methods exist before trying to use them
      if (rtdb && typeof rtdb.ref === "function") {
        console.log("[FIREBASE CONNECTION] Setting up connection monitoring");

        const connectedRef = ref(rtdb, ".info/connected");

        unsubscribe = onValue(
          connectedRef,
          (snapshot) => {
            // Get connected status
            const connected = !!snapshot.val();
            console.log(
              `🔥 Firebase connection status: ${
                connected ? "connected" : "disconnected"
              }`
            );

            setIsFirebaseConnected(connected);
            setConnectionError(null);

            // If we're connected, log a timestamp
            if (connected) {
              try {
                const connectionStatusRef = ref(rtdb, `status/lastOnline`);
                // Set a timestamp when we disconnect
                onDisconnect(connectionStatusRef)
                  .set(serverTimestamp())
                  .catch((error) => {
                    console.warn("Failed to set onDisconnect handler:", error);
                  });

                // Set current status
                set(connectionStatusRef, true).catch((error) => {
                  console.warn("Failed to update connection status:", error);
                });
              } catch (error) {
                console.warn("Error setting connection status:", error);
              }
            }
          },
          (error) => {
            console.error("Firebase connection monitoring error:", error);
            setConnectionError(error as Error);
            setIsFirebaseConnected(false);
          }
        );
      } else {
        console.warn("Realtime Database not properly initialized");
        setIsFirebaseConnected(false);
        setConnectionError(
          new Error("Realtime Database not properly initialized")
        );
      }
    } catch (error) {
      console.warn("Unable to monitor Firebase connection status:", error);
      // Fall back to browser online status
      setIsFirebaseConnected(false);
      setConnectionError(error as Error);
    }

    // Initial status check based on browser connectivity
    setIsOnline(navigator.onLine);

    // Cleanup listeners
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Force reconnection function
  const forceReconnect = async () => {
    if (!isOnline) {
      console.log("Cannot force reconnection while browser is offline");
      return false;
    }

    try {
      // Clear any previous errors
      setConnectionError(null);

      // Disable and re-enable network to force a fresh connection
      await disableNetwork(db);
      await enableNetwork(db);
      console.log("Firebase connection reset successful");
      return true;
    } catch (error) {
      console.error("Failed to reset Firebase connection:", error);
      setConnectionError(error as Error);
      return false;
    }
  };

  return {
    isOnline,
    isFirebaseConnected,
    connectionError,
    forceReconnect,
  };
};
