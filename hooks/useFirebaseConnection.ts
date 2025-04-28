import { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export const useFirebaseConnection = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  useEffect(() => {
    // Listen for browser online/offline events
    const handleOnline = () => {
      console.log("Browser reports online");
      setIsOnline(true);
      // Assume Firebase will reconnect automatically
      setIsFirebaseConnected(true);
    };

    const handleOffline = () => {
      console.log("Browser reports offline");
      setIsOnline(false);
      // When offline, some Firebase services won't work
      setIsFirebaseConnected(false);
    };

    // Set up connection monitoring
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial status check based on browser connectivity
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    setIsFirebaseConnected(
      typeof navigator !== "undefined" ? navigator.onLine : true
    );

    // Cleanup listeners
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Force reconnection function (simplified)
  const forceReconnect = async () => {
    if (!isOnline) {
      console.log("Cannot reconnect while browser is offline");
      return false;
    }

    try {
      // Just reload the page to force a reconnection
      if (typeof window !== "undefined") {
        window.location.reload();
      }
      return true;
    } catch (error) {
      console.error("Failed to reconnect:", error);
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
