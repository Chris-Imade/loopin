import React, { useEffect } from "react";
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

  // Handle connection changes
  useEffect(() => {
    if (!isOnline) {
      // Device is offline
      if (!toastIdRef.current) {
        toastIdRef.current = toast({
          title: "You are offline",
          description: "Using cached data. Some features may be limited.",
          status: "warning",
          duration: null,
          isClosable: true,
          position: "top",
        });
      }
    } else if (!isFirebaseConnected && isOnline) {
      // Online but Firebase disconnected
      if (!toastIdRef.current) {
        toastIdRef.current = toast({
          title: "Connection issues",
          description:
            "Connected to the internet but having trouble reaching our servers.",
          status: "error",
          duration: null,
          isClosable: true,
          position: "top",
        });
      }
    } else {
      // We're fully connected, close any existing toasts
      if (toastIdRef.current) {
        toast.close(toastIdRef.current);
        toastIdRef.current = undefined;
      }
    }

    return () => {
      // Clean up toast on unmount
      if (toastIdRef.current) {
        toast.close(toastIdRef.current);
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
      });
    } else {
      toast({
        title: "Connection failed",
        description: "Please check your internet connection and try again.",
        status: "error",
        duration: 5000,
      });
    }
  };

  // Only render when there's a connection issue
  if (isOnline && isFirebaseConnected) {
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
        onClick={() => {
          if (toastIdRef.current) {
            toast.close(toastIdRef.current);
            toastIdRef.current = undefined;
          }
        }}
      />
    </Alert>
  );
};

export default ConnectionStatusHandler;
