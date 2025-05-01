import { useState, useEffect } from "react";
import {
  Box,
  VStack,
  Text,
  Code,
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  useClipboard,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from "@chakra-ui/react";
import { auth } from "../../firebase/config";
import { getAuth, fetchSignInMethodsForEmail } from "firebase/auth";

export const AuthDebugger = () => {
  const [showDebugger] = useState(process.env.NODE_ENV === "development");
  const [hostname, setHostname] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [signInMethods, setSignInMethods] = useState<string[]>([]);
  const [authProviders, setAuthProviders] = useState<string[]>([]);
  const { hasCopied, onCopy } = useClipboard(hostname);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(window.location.hostname);
      // Get the auth domain from Firebase config
      const authConfig = getAuth().config;
      // @ts-ignore - authDomain might not be directly accessible in the type
      setAuthDomain(authConfig.authDomain || "Not available");

      // Check available sign-in methods for test@example.com
      fetchSignInMethodsForEmail(auth, "test@example.com")
        .then((methods) => {
          setSignInMethods(methods);
        })
        .catch((error) => {
          console.error("Error fetching sign-in methods:", error);
          setSignInMethods(["Error fetching methods"]);
        });

      // List available auth providers
      // This is a simple way to estimate what providers might be configured
      const providers = [];
      if ((window as any).gapi) providers.push("Google");
      if ((window as any).AppleID) providers.push("Apple");
      if ((window as any).FB) providers.push("Facebook");
      setAuthProviders(providers);
    }
  }, []);

  if (!showDebugger) return null;

  return (
    <>
      {/* Floating button instead of a box */}
      <Button
        position="fixed"
        bottom="4"
        right="4"
        zIndex={1000}
        colorScheme="blue"
        size="sm"
        onClick={onOpen}
      >
        Auth Debug
      </Button>

      {/* Use a drawer instead of inline component */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Authentication Debugger</DrawerHeader>

          <DrawerBody>
            <VStack align="start" spacing={4}>
              <Box>
                <Text fontWeight="bold">Current Hostname:</Text>
                <Code onClick={onCopy} cursor="pointer">
                  {hostname} {hasCopied && "(copied!)"}
                </Code>
              </Box>

              <Box>
                <Text fontWeight="bold">Firebase Auth Domain:</Text>
                <Code>{authDomain}</Code>
              </Box>

              <Box>
                <Text fontWeight="bold">Available Sign-in Methods:</Text>
                {signInMethods.length > 0 ? (
                  <Code>{signInMethods.join(", ")}</Code>
                ) : (
                  <Text color="yellow.300">No methods available</Text>
                )}
              </Box>

              <Box>
                <Text fontWeight="bold">Detected Auth Providers:</Text>
                {authProviders.length > 0 ? (
                  <Code>{authProviders.join(", ")}</Code>
                ) : (
                  <Text color="yellow.300">No providers detected</Text>
                )}
              </Box>

              <Box mt={2}>
                <Text fontWeight="bold">Recommendation:</Text>
                <Text>
                  {hostname !== authDomain
                    ? `Add "${hostname}" to Firebase authorized domains in the Firebase Console.`
                    : "Your current domain matches the Firebase auth domain."}
                </Text>
              </Box>
            </VStack>
          </DrawerBody>

          <DrawerFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => {
                window.open(
                  "https://console.firebase.google.com/project/_/authentication/settings",
                  "_blank",
                  "noopener"
                );
              }}
            >
              Open Firebase Console
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default AuthDebugger;
