import {
  Button,
  VStack,
  HStack,
  Icon,
  Text,
  Divider,
  useToast,
  Tooltip,
} from "@chakra-ui/react";
import { FaGoogle, FaApple } from "react-icons/fa";
import { useState, useEffect } from "react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import { auth } from "../../firebase/config";
import { useUserStore } from "../../store/userStore";

export const AuthButtons = () => {
  // Debug store access
  const userStore = useUserStore();
  const toast = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  // Debug the store on component mount
  useEffect(() => {
    console.log("[AUTH_DEBUG] UserStore state:", {
      storeExists: !!userStore,
      storeKeys: userStore ? Object.keys(userStore) : [],
      signInWithGoogleExists: typeof userStore?.signInWithGoogle === "function",
    });
  }, [userStore]);

  const handleGoogleSignIn = async () => {
    console.log("[AUTH_DEBUG] Google sign-in button clicked");
    setIsGoogleLoading(true);

    try {
      // Try using the store function if available
      if (typeof userStore?.signInWithGoogle === "function") {
        console.log("[AUTH_DEBUG] Using store signInWithGoogle function");
        await userStore.signInWithGoogle();
      } else {
        // Fallback to direct Firebase auth as a workaround
        console.log(
          "[AUTH_DEBUG] Store function missing - using direct Firebase auth"
        );

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: "select_account",
        });

        console.log("[AUTH_DEBUG] Calling Firebase signInWithPopup directly");
        const result = await signInWithPopup(auth, provider);
        console.log(
          "[AUTH_DEBUG] Direct Firebase auth successful:",
          result.user.uid
        );

        // If you need to update the store manually
        if (typeof userStore?.setSubscriptionStatus === "function") {
          // This assumes your store has this function
          userStore.setSubscriptionStatus("active");
        }
      }

      console.log("[AUTH_DEBUG] Google sign-in completed successfully");
    } catch (error: any) {
      // Detailed error logging
      console.error("[AUTH_DEBUG] Google sign-in error:", {
        errorObject: error,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorType: typeof error,
        isFirebaseAuthError: error?.constructor?.name === "FirebaseError",
      });

      // Show a toast for debugging in development
      if (process.env.NODE_ENV === "development") {
        toast({
          title: "Auth Debug Info",
          description: `Error: ${error?.message || "Unknown error"}, Code: ${
            error?.code || "undefined"
          }`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }

      // Show specific error message for operation-not-allowed
      if (error?.code === "auth/operation-not-allowed") {
        toast({
          title: "Google Sign-In Not Configured",
          description:
            "The Google sign-in method needs to be enabled in Firebase Authentication settings.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    console.log("[AUTH_DEBUG] Apple sign-in button clicked");
    setIsAppleLoading(true);

    try {
      // Try using the store function if available
      if (typeof userStore?.signInWithApple === "function") {
        console.log("[AUTH_DEBUG] Using store signInWithApple function");
        await userStore.signInWithApple();
      } else {
        // Fallback to direct Firebase auth as a workaround
        console.log(
          "[AUTH_DEBUG] Store function missing - using direct Firebase auth"
        );

        const provider = new OAuthProvider("apple.com");
        provider.setCustomParameters({
          prompt: "select_account",
        });

        console.log("[AUTH_DEBUG] Calling Firebase signInWithPopup directly");
        const result = await signInWithPopup(auth, provider);
        console.log(
          "[AUTH_DEBUG] Direct Firebase auth successful:",
          result.user.uid
        );
      }

      console.log("[AUTH_DEBUG] Apple sign-in completed successfully");
    } catch (error: any) {
      // Detailed error logging
      console.error("[AUTH_DEBUG] Apple sign-in error:", {
        errorObject: error,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorType: typeof error,
        isFirebaseAuthError: error?.constructor?.name === "FirebaseError",
      });

      // Show specific error message for operation-not-allowed
      if (error?.code === "auth/operation-not-allowed") {
        toast({
          title: "Apple Sign-In Not Configured",
          description:
            "The Apple sign-in method needs to be enabled in Firebase Authentication settings.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  return (
    <VStack spacing={4} w="full" maxW="md">
      <Button
        w="full"
        leftIcon={<Icon as={FaGoogle} />}
        onClick={handleGoogleSignIn}
        colorScheme="red"
        variant="outline"
        isLoading={isGoogleLoading}
        loadingText="Connecting..."
      >
        Continue with Google
      </Button>

      <Tooltip label="Apple Sign-In coming soon" placement="top" hasArrow>
        <Button
          w="full"
          leftIcon={<Icon as={FaApple} />}
          onClick={handleAppleSignIn}
          variant="outline"
          isLoading={isAppleLoading}
          loadingText="Connecting..."
          isDisabled={true}
          opacity={0.6}
          _hover={{ opacity: 0.6 }}
        >
          Continue with Apple
        </Button>
      </Tooltip>

      {/* Adding a subtle message about limited auth options */}
      <Text fontSize="xs" color="gray.500" textAlign="center" mt={4}>
        More sign-in options coming soon
      </Text>
    </VStack>
  );
};
