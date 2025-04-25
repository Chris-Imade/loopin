import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { getDatabase, ref, onValue } from "firebase/database";
import {
  getFirestore,
  disableNetwork,
  enableNetwork,
} from "firebase/firestore";

export const useFirebaseConnection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);

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
        });
    };

    // Set up connection monitoring
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Try to set up Firebase connection monitoring if Realtime Database is available
    let unsubscribe: (() => void) | null = null;
    try {
      const database = getDatabase();
      const connectedRef = ref(database, ".info/connected");

      unsubscribe = onValue(connectedRef, (snapshot) => {
        const connected = snapshot.val();
        console.log(
          `🔥 Firebase connection status: ${
            connected ? "connected" : "disconnected"
          }`
        );
        setIsFirebaseConnected(!!connected);
      });
    } catch (error) {
      console.warn("Unable to monitor Firebase connection status:", error);
      // Fall back to browser online status
      setIsFirebaseConnected(navigator.onLine);
    }

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
      // Disable and re-enable network to force a fresh connection
      await disableNetwork(db);
      await enableNetwork(db);
      console.log("Firebase connection reset successful");
      return true;
    } catch (error) {
      console.error("Failed to reset Firebase connection:", error);
      return false;
    }
  };

  return {
    isOnline,
    isFirebaseConnected,
    forceReconnect,
  };
};
