import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  CloseButton,
  Code,
  VStack,
} from "@chakra-ui/react";
import { useFirebaseConnection } from "../hooks/useFirebaseConnection";
import {
  WifiIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";

interface ConnectionStatusHandlerProps {
  onRetryConnection?: () => void;
}

export const ConnectionStatusHandler: React.FC<
  ConnectionStatusHandlerProps
> = ({ onRetryConnection }) => {
  const { isOnline, isFirebaseConnected, connectionError, forceReconnect } =
    useFirebaseConnection();
  const toast = useToast();
  const toastIdRef = React.useRef<string | number | undefined>(undefined);
  const [showAlert, setShowAlert] = useState(false);

  // Handle connection changes
  useEffect(() => {
    // Generate unique toast IDs based on current time
    const offlineToastId = `connection-offline-toast-${Date.now()}`;
    const errorToastId = `connection-error-toast-${Date.now()}`;

    // Close any existing toasts first to prevent duplicates
    if (toastIdRef.current) {
      if (toast.isActive(toastIdRef.current)) {
        toast.close(toastIdRef.current);
      }
      toastIdRef.current = undefined;
    }

    // Clear existing alerts
    setShowAlert(false);

    if (!isOnline) {
      // Device is offline
      setShowAlert(true);
      toastIdRef.current = toast({
        id: offlineToastId,
        title: "You are offline",
        description: "Using cached data. Some features may be limited.",
        status: "warning",
        duration: null,
        isClosable: true,
        position: "top",
        onCloseComplete: () => {
          toastIdRef.current = undefined;
          // Hide the alert when toast is closed
          setShowAlert(false);
        },
      });
    } else if (!isFirebaseConnected && isOnline) {
      // Online but Firebase disconnected
      setShowAlert(true);

      // Show error details in development mode
      const errorDescription =
        connectionError && process.env.NODE_ENV === "development"
          ? `Error: ${connectionError.message}`
          : "Connected to the internet but having trouble reaching our servers.";

      toastIdRef.current = toast({
        id: errorToastId,
        title: "Connection issues",
        description: errorDescription,
        status: "error",
        duration: null,
        isClosable: true,
        position: "top",
        onCloseComplete: () => {
          toastIdRef.current = undefined;
          // Hide the alert when toast is closed
          setShowAlert(false);
        },
      });
    }

    return () => {
      // Clean up toast on unmount
      if (toastIdRef.current && toast.isActive(toastIdRef.current)) {
        toast.close(toastIdRef.current);
        toastIdRef.current = undefined;
      }
    };
  }, [isOnline, isFirebaseConnected, connectionError, toast]);

  const handleRetryConnection = async () => {
    // Generate unique toast ID for loading toast
    const loadingToastId = `reconnect-loading-${Date.now()}`;

    if (onRetryConnection) {
      onRetryConnection();
    }

    // Close existing toasts
    if (toastIdRef.current) {
      if (toast.isActive(toastIdRef.current)) {
        toast.close(toastIdRef.current);
      }
      toastIdRef.current = undefined;
    }

    setShowAlert(false);

    // Show connecting toast
    const loadingToast = toast({
      id: loadingToastId,
      title: "Reconnecting...",
      status: "loading",
      duration: null,
      position: "top",
    });

    // Try to reconnect Firebase
    const success = await forceReconnect();

    // Close loading toast
    toast.close(loadingToast);

    // Generate unique IDs for success/failure toasts
    const resultToastId = `reconnect-result-${Date.now()}`;

    if (success) {
      toast({
        id: resultToastId,
        title: "Connection restored",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    } else {
      toast({
        id: resultToastId,
        title: "Connection failed",
        description: connectionError
          ? `Error: ${connectionError.message}`
          : "Please check your internet connection and try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    if (toastIdRef.current) {
      if (toast.isActive(toastIdRef.current)) {
        toast.close(toastIdRef.current);
      }
      toastIdRef.current = undefined;
    }
  };

  // Only render when there's a connection issue and alert should be shown
  if ((isOnline && isFirebaseConnected) || !showAlert) {
    return null;
  }

  return (
    <Alert
      status={!isOnline ? "warning" : "error"}
      variant="solid"
      mb={4}
      borderRadius="md"
    >
      <AlertIcon />
      <Box flex="1">
        <VStack align="start" spacing={1}>
          <AlertTitle fontSize="sm">
            {!isOnline ? "You are offline" : "Connection issues"}
          </AlertTitle>
          <Text fontSize="xs">
            {!isOnline
              ? "Using cached data. Some features will be limited."
              : "Connected to internet but having trouble reaching our servers."}
          </Text>
          {connectionError && process.env.NODE_ENV === "development" && (
            <Code fontSize="xs" colorScheme="red" p={1}>
              {connectionError.message}
            </Code>
          )}
        </VStack>
      </Box>
      <Button
        size="sm"
        leftIcon={
          isOnline ? (
            <ArrowPathIcon width={16} height={16} />
          ) : (
            <WifiIcon width={16} height={16} />
          )
        }
        colorScheme={!isOnline ? "yellow" : "red"}
        variant="solid"
        onClick={handleRetryConnection}
        ml={2}
      >
        Retry
      </Button>
      <CloseButton
        size="sm"
        position="absolute"
        right="8px"
        top="8px"
        onClick={handleCloseAlert}
      />
    </Alert>
  );
};

export default ConnectionStatusHandler;
