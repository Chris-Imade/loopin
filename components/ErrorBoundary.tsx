import React from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Container,
  Icon,
  useColorMode,
} from "@chakra-ui/react";
import { ExclamationIcon } from "@heroicons/react/solid";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });
    console.error("Application error:", error, errorInfo);
  }

  isAuthError(): boolean {
    const errorCode = (this.state.error as any)?.code;
    return typeof errorCode === "string" && errorCode.startsWith("auth/");
  }

  getErrorMessage(): string {
    if (!this.state.error) return "An unknown error occurred";

    // Handle Firebase auth errors
    if (this.isAuthError()) {
      const errorCode = (this.state.error as any).code;
      switch (errorCode) {
        case "auth/user-cancelled":
          return "You cancelled the sign-in process. Please try again when you're ready.";
        case "auth/unauthorized-domain":
          return "This domain isn't authorized for authentication. Please contact support.";
        case "auth/popup-closed-by-user":
          return "The sign-in popup was closed before completing authentication.";
        case "auth/popup-blocked":
          return "The sign-in popup was blocked by your browser. Please allow popups for this site.";
        case "auth/network-request-failed":
          return "A network error occurred. Please check your internet connection and try again.";
        default:
          return `Authentication error: ${errorCode}`;
      }
    }

    return (
      this.state.error.message || "Something went wrong with the application"
    );
  }

  render() {
    // Replace the hook with a static value matching the dark theme
    const bgColor = "gray.800"; // Default dark mode background

    if (this.state.hasError) {
      return (
        <Container maxW="lg" py={10}>
          <Box
            p={8}
            bg={bgColor}
            boxShadow="lg"
            rounded="md"
            textAlign="center"
          >
            <VStack spacing={6}>
              <Icon
                as={ExclamationIcon}
                w={16}
                h={16}
                color={this.isAuthError() ? "yellow.500" : "red.500"}
              />
              <Heading size="lg">
                {this.isAuthError()
                  ? "Authentication Error"
                  : "Something went wrong"}
              </Heading>
              <Text fontSize="md">{this.getErrorMessage()}</Text>
              <Button
                colorScheme="blue"
                onClick={() => {
                  this.setState({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                  });
                  window.location.href = "/";
                }}
              >
                Go to Home Page
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  this.setState({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                  });
                }}
              >
                Try Again
              </Button>
            </VStack>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
