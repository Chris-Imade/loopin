import React, { useEffect, useState, useRef } from "react";
import { useToast } from "@chakra-ui/react";
import { useUserStore } from "../store/userStore";

const ConnectionStatusHandler: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const { user } = useUserStore();
  const toast = useToast();
  const toastIdRef = useRef<string | number | null>(null);

  // Handle browser online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (toastIdRef.current) {
        toast.close(toastIdRef.current);
        toastIdRef.current = null;
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Only show offline toast if user is logged in
      if (user) {
        toastIdRef.current = toast({
          title: "You are offline",
          description:
            "Some features may be limited until connection is restored.",
          status: "warning",
          duration: 10000,
          isClosable: true,
        });
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (toastIdRef.current) {
        toast.close(toastIdRef.current);
      }
    };
  }, [toast, user]);

  // Return null - no persistent UI, just toast notifications
  return null;
};

export default ConnectionStatusHandler;
