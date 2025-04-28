import { create } from "zustand";
import { auth } from "../firebase/config";
import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User,
  AuthError,
} from "firebase/auth";
import { useEffect, useRef, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { initializeSubscriptionListener } from "../lib/firebase";

// Extended user type that includes premium status
interface ExtendedUser extends User {
  isPremium?: boolean;
  country?: string;
  allowInternationalMatching?: boolean;
  subscriptionType?: string;
  subscriptionId?: string;
}

interface UserState {
  user: ExtendedUser | null;
  isLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
  subscriptionStatus?: string;
  setSubscriptionStatus: (status: string) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: true,
  authError: null,
  subscriptionStatus: undefined,

  // Set subscription status
  setSubscriptionStatus: (status: string) =>
    set({ subscriptionStatus: status }),

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, authError: null });
      const provider = new GoogleAuthProvider();

      // Configure auth settings to handle COOP policy
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);

      // For demo purposes, randomly assign premium status
      const extendedUser = result.user as ExtendedUser;
      extendedUser.isPremium = Math.random() > 0.7; // 30% chance of being premium

      set({ user: extendedUser, isLoading: false });
    } catch (error: any) {
      console.error("Google auth error:", error);

      // Handle specific Firebase auth errors
      let errorMessage = "Failed to sign in with Google";
      if (error.code) {
        switch (error.code) {
          case "auth/user-cancelled":
            errorMessage = "You cancelled the sign-in process";
            break;
          case "auth/popup-closed-by-user":
            errorMessage = "The sign-in popup was closed";
            break;
          case "auth/unauthorized-domain":
            errorMessage = "This domain isn't authorized for authentication";
            break;
          case "auth/popup-blocked":
            errorMessage = "Popup was blocked by the browser";
            break;
          case "auth/network-request-failed":
            errorMessage = "Network error. Check your internet connection";
            break;
          default:
            errorMessage = `Authentication error: ${error.code}`;
        }
      }

      set({
        isLoading: false,
        authError: errorMessage,
      });

      throw error; // Re-throw for component-level handling
    }
  },

  // Sign in with Apple
  signInWithApple: async () => {
    try {
      set({ isLoading: true, authError: null });
      const provider = new OAuthProvider("apple.com");

      // Configure auth settings to handle COOP policy
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);

      // For demo purposes, randomly assign premium status
      const extendedUser = result.user as ExtendedUser;
      extendedUser.isPremium = Math.random() > 0.7; // 30% chance of being premium

      set({ user: extendedUser, isLoading: false });
    } catch (error: any) {
      console.error("Apple auth error:", error);

      // Handle specific Firebase auth errors
      let errorMessage = "Failed to sign in with Apple";
      if (error.code) {
        switch (error.code) {
          case "auth/user-cancelled":
            errorMessage = "You cancelled the sign-in process";
            break;
          case "auth/popup-closed-by-user":
            errorMessage = "The sign-in popup was closed";
            break;
          case "auth/unauthorized-domain":
            errorMessage = "This domain isn't authorized for authentication";
            break;
          case "auth/popup-blocked":
            errorMessage = "Popup was blocked by the browser";
            break;
          case "auth/network-request-failed":
            errorMessage = "Network error. Check your internet connection";
            break;
          default:
            errorMessage = `Authentication error: ${error.code}`;
        }
      }

      set({
        isLoading: false,
        authError: errorMessage,
      });

      throw error; // Re-throw for component-level handling
    }
  },

  // Sign in with email
  signInWithEmail: async (email: string, password: string) => {
    try {
      set({ isLoading: true, authError: null });
      const result = await signInWithEmailAndPassword(auth, email, password);

      // For demo purposes, randomly assign premium status
      const extendedUser = result.user as ExtendedUser;
      extendedUser.isPremium = Math.random() > 0.7; // 30% chance of being premium

      set({ user: extendedUser, isLoading: false });
    } catch (error: any) {
      console.error("Email auth error:", error);

      // Handle specific Firebase auth errors
      let errorMessage = "Email sign-in failed";
      if (error.code) {
        switch (error.code) {
          case "auth/user-not-found":
            errorMessage = "No account found with this email";
            break;
          case "auth/wrong-password":
            errorMessage = "Incorrect password";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email format";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many failed attempts. Try again later";
            break;
          case "auth/network-request-failed":
            errorMessage = "Network error. Check your internet connection";
            break;
          default:
            errorMessage = `Authentication error: ${error.code}`;
        }
      }

      set({
        isLoading: false,
        authError: errorMessage,
      });

      throw error; // Re-throw for component-level handling
    }
  },

  // Sign up with email
  signUp: async (email: string, password: string) => {
    try {
      set({ isLoading: true, authError: null });
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // For demo purposes, randomly assign premium status
      const extendedUser = result.user as ExtendedUser;
      extendedUser.isPremium = Math.random() > 0.7; // 30% chance of being premium

      set({ user: extendedUser, isLoading: false });
    } catch (error: any) {
      console.error("Signup error:", error);

      // Handle specific Firebase auth errors
      let errorMessage = "Sign-up failed";
      if (error.code) {
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "This email is already registered";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email format";
            break;
          case "auth/weak-password":
            errorMessage = "Password is too weak";
            break;
          case "auth/network-request-failed":
            errorMessage = "Network error. Check your internet connection";
            break;
          default:
            errorMessage = `Authentication error: ${error.code}`;
        }
      }

      set({
        isLoading: false,
        authError: errorMessage,
      });

      throw error; // Re-throw for component-level handling
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await auth.signOut();
      // Auth state listener will handle updating the state
    } catch (error) {
      console.error("Sign out error:", error);
      set({ authError: "Failed to sign out" });
    }
  },

  // Clear auth error
  clearAuthError: () => set({ authError: null }),
}));

// Store state updater to avoid memory leaks and stale closures
const storeStateUpdater = {
  setUser: (user: ExtendedUser | null) => {
    useUserStore.setState({
      user,
      isLoading: false,
      authError: null,
    });
  },
  setSignedOut: () => {
    useUserStore.setState({
      user: null,
      isLoading: false,
      authError: null,
      subscriptionStatus: undefined,
    });
  },
  setSubscriptionStatus: (status: string) => {
    useUserStore.setState({ subscriptionStatus: status });
  },
};

// Move the auth state listener to a custom hook to avoid running it on the server
export const useAuthStateListener = () => {
  // Use refs to prevent useEffect dependencies from changing
  const authUnsubscribeRef = useRef<(() => void) | null>(null);
  const subscriptionUnsubscribeRef = useRef<(() => void) | null>(null);

  // Safe version of the subscription updater that doesn't get stale
  const handleSubscriptionUpdate = useCallback((status: string) => {
    storeStateUpdater.setSubscriptionStatus(status);
  }, []);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") return;

    // Unsubscribe from previous listeners to prevent duplicates
    if (authUnsubscribeRef.current) {
      authUnsubscribeRef.current();
      authUnsubscribeRef.current = null;
    }

    if (subscriptionUnsubscribeRef.current) {
      subscriptionUnsubscribeRef.current();
      subscriptionUnsubscribeRef.current = null;
    }

    // Set up auth state listener
    authUnsubscribeRef.current = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          // For demo purposes, apply random premium status if not present
          const extendedUser = user as ExtendedUser;
          if (extendedUser.isPremium === undefined) {
            extendedUser.isPremium = Math.random() > 0.7; // 30% chance of being premium
          }

          // Update the store with the user
          storeStateUpdater.setUser(extendedUser);

          // Initialize subscription listener when user is authenticated
          // and clean up any previous one
          if (subscriptionUnsubscribeRef.current) {
            subscriptionUnsubscribeRef.current();
          }

          try {
            subscriptionUnsubscribeRef.current = initializeSubscriptionListener(
              user.uid,
              handleSubscriptionUpdate
            );
          } catch (error) {
            console.error("Failed to initialize subscription listener:", error);
          }
        } else {
          // User is signed out
          storeStateUpdater.setSignedOut();

          // Clean up subscription listener if it exists
          if (subscriptionUnsubscribeRef.current) {
            subscriptionUnsubscribeRef.current();
            subscriptionUnsubscribeRef.current = null;
          }
        }
      },
      (error) => {
        console.error("Auth state changed error:", error);
        // Don't update state here to avoid triggering re-renders
      }
    );

    // Cleanup function
    return () => {
      if (authUnsubscribeRef.current) {
        authUnsubscribeRef.current();
        authUnsubscribeRef.current = null;
      }

      if (subscriptionUnsubscribeRef.current) {
        subscriptionUnsubscribeRef.current();
        subscriptionUnsubscribeRef.current = null;
      }
    };
  }, [handleSubscriptionUpdate]); // Only depend on stable callback
};

// Custom hook to handle auth errors with toast
export const useAuthErrorToast = () => {
  const toast = useToast();
  const authError = useUserStore((state) => state.authError);
  const clearAuthError = useUserStore((state) => state.clearAuthError);

  useEffect(() => {
    if (!authError) return;

    const toastId = toast({
      title: "Authentication Error",
      description: authError,
      status: "error",
      duration: 5000,
      isClosable: true,
    });

    // Clear the error once displayed
    clearAuthError();

    // Clean up toast on unmount if still visible
    return () => {
      if (toast.isActive(toastId)) {
        toast.close(toastId);
      }
    };
  }, [authError, toast, clearAuthError]);
};
