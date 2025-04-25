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
  const { isOnline, isFirebaseConnected, forceReconnect } =
    useFirebaseConnection();
  const toast = useToast();
  const toastIdRef = React.useRef<string | number | undefined>(undefined);
  const [showAlert, setShowAlert] = useState(false);

  // Handle connection changes
  useEffect(() => {
    // Close any existing toasts first to prevent duplicates
    if (toastIdRef.current) {
      toast.close(toastIdRef.current);
      toastIdRef.current = undefined;
    }

    if (!isOnline) {
      // Device is offline
      setShowAlert(true);
      toastIdRef.current = toast({
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
      toastIdRef.current = toast({
        title: "Connection issues",
        description:
          "Connected to the internet but having trouble reaching our servers.",
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
    } else {
      // We're fully connected, close any existing toasts
      setShowAlert(false);
      if (toastIdRef.current) {
        toast.close(toastIdRef.current);
        toastIdRef.current = undefined;
      }
    }

    return () => {
      // Clean up toast on unmount
      if (toastIdRef.current) {
        toast.close(toastIdRef.current);
        toastIdRef.current = undefined;
      }
    };
  }, [isOnline, isFirebaseConnected, toast]);

  const handleRetryConnection = async () => {
    if (onRetryConnection) {
      onRetryConnection();
    }

    // Try to reconnect Firebase
    const success = await forceReconnect();

    if (success) {
      toast({
        title: "Connection restored",
        status: "success",
        duration: 3000,
        isClosable: true,
        onCloseComplete: () => {
          setShowAlert(false);
        },
      });
    } else {
      toast({
        title: "Connection failed",
        description: "Please check your internet connection and try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    if (toastIdRef.current) {
      toast.close(toastIdRef.current);
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
        <AlertTitle fontSize="sm">
          {!isOnline ? "You are offline" : "Connection issues"}
        </AlertTitle>
        <Text fontSize="xs">
          {!isOnline
            ? "Using cached data. Some features will be limited."
            : "Connected to internet but having trouble reaching our servers."}
        </Text>
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
