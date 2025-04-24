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
import { useEffect } from "react";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useToast } from "@chakra-ui/react";

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
  clearAuthError: () => void;
  subscriptionStatus?: string;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  authError: null,
  clearAuthError: () => set({ authError: null }),
  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, authError: null });
      const provider = new GoogleAuthProvider();
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
          case 'auth/user-cancelled':
            errorMessage = "You cancelled the sign-in process";
            break;
          case 'auth/popup-closed-by-user':
            errorMessage = "The sign-in popup was closed";
            break;
          case 'auth/unauthorized-domain':
            errorMessage = "This domain isn't authorized for authentication";
            break;
          case 'auth/popup-blocked':
            errorMessage = "Popup was blocked by the browser";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network error. Check your internet connection";
            break;
          default:
            errorMessage = `Authentication error: ${error.code}`;
        }
      }
      
      set({ 
        isLoading: false, 
        authError: errorMessage 
      });
      
      throw error; // Re-throw for component-level handling
    }
  },

  signInWithApple: async () => {
    try {
      set({ isLoading: true, authError: null });
      const provider = new OAuthProvider("apple.com");
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
          case 'auth/user-cancelled':
            errorMessage = "You cancelled the sign-in process";
            break;
          case 'auth/popup-closed-by-user':
            errorMessage = "The sign-in popup was closed";
            break;
          case 'auth/unauthorized-domain':
            errorMessage = "This domain isn't authorized for authentication";
            break;
          case 'auth/popup-blocked':
            errorMessage = "Popup was blocked by the browser";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network error. Check your internet connection";
            break;
          default:
            errorMessage = `Authentication error: ${error.code}`;
        }
      }
      
      set({ 
        isLoading: false, 
        authError: errorMessage 
      });
      
      throw error; // Re-throw for component-level handling
    }
  },
  
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
          case 'auth/user-not-found':
            errorMessage = "No account found with this email";
            break;
          case 'auth/wrong-password':
            errorMessage = "Incorrect password";
            break;
          case 'auth/invalid-email':
            errorMessage = "Invalid email format";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Too many failed attempts. Try again later";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network error. Check your internet connection";
            break;
          default:
            errorMessage = `Authentication error: ${error.code}`;
        }
      }
      
      set({ 
        isLoading: false, 
        authError: errorMessage 
      });
      
      throw error; // Re-throw for component-level handling
    }
  },
  
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
          case 'auth/email-already-in-use':
            errorMessage = "This email is already registered";
            break;
          case 'auth/invalid-email':
            errorMessage = "Invalid email format";
            break;
          case 'auth/weak-password':
            errorMessage = "Password is too weak";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network error. Check your internet connection";
            break;
          default:
            errorMessage = `Authentication error: ${error.code}`;
        }
      }
      
      set({ 
        isLoading: false, 
        authError: errorMessage 
      });
      
      throw error; // Re-throw for component-level handling
    }
  },
}));

// Create a hook to display auth errors via toast
export const useAuthErrorToast = () => {
  const toast = useToast();
  const authError = useUserStore((state) => state.authError);
  const clearAuthError = useUserStore((state) => state.clearAuthError);
  
  useEffect(() => {
    if (authError) {
      toast({
        title: "Authentication Error",
        description: authError,
        status: "error",
        duration: 5000,
        isClosable: true,
        onCloseComplete: clearAuthError,
      });
    }
  }, [authError, toast, clearAuthError]);
};

// Move the auth state listener to a custom hook to avoid running it on the server
export const useAuthStateListener = () => {
  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // For demo purposes, apply random premium status if not present
        const extendedUser = user as ExtendedUser;
        if (extendedUser.isPremium === undefined) {
          extendedUser.isPremium = Math.random() > 0.7; // 30% chance of being premium
        }
        useUserStore.setState({ user: extendedUser, isLoading: false, authError: null });
      } else {
        useUserStore.setState({ user: null, isLoading: false, authError: null });
      }
    });

    return () => unsubscribe();
  }, []);
};
