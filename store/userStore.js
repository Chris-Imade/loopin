import create from "zustand";
import { auth } from "../firebase/config";
import { useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
} from "firebase/auth";
import {
  connectSocket,
  disconnectSocket,
  updateUserOnlineStatus,
} from "../lib/socket";

// Create user store with Firebase Auth and MongoDB sync
export const useUserStore = create((set, get) => ({
  user: null,
  mongoUser: null,
  isLoading: true,
  authError: null,

  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      set({ isLoading: true, authError: null });
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Firebase Auth successful - MongoDB sync will happen via auth state listener
      return userCredential.user;
    } catch (error) {
      set({ authError: error.message, isLoading: false });
      throw error;
    }
  },

  // Sign up with email and password
  signUp: async (email, password, displayName) => {
    try {
      set({ isLoading: true, authError: null });
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update profile with display name
      if (displayName) {
        await firebaseUpdateProfile(userCredential.user, { displayName });
      }

      // Firebase Auth successful - MongoDB sync will happen via auth state listener
      return userCredential.user;
    } catch (error) {
      set({ authError: error.message, isLoading: false });
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      // Disconnect socket before signing out
      disconnectSocket();

      // Update online status to false before signing out
      updateUserOnlineStatus(false);

      // Sign out from Firebase
      await firebaseSignOut(auth);

      // Clear user state
      set({ user: null, mongoUser: null });
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },

  // Update user profile (both Firebase and MongoDB)
  updateProfile: async (profileData) => {
    try {
      const { user } = get();
      if (!user) throw new Error("User not authenticated");

      // Update Firebase profile if needed
      if (profileData.displayName || profileData.photoURL) {
        await firebaseUpdateProfile(auth.currentUser, {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL,
        });
      }

      // Sync with MongoDB
      const token = await user.getIdToken();
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      // Update local state with MongoDB data
      const { user: updatedMongoUser } = await response.json();
      set({ mongoUser: updatedMongoUser });

      return updatedMongoUser;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  // Sync Firebase user with MongoDB
  syncWithMongoDB: async (firebaseUser) => {
    try {
      if (!firebaseUser) return null;

      const token = await firebaseUser.getIdToken();
      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("MongoDB sync error:", errorData);
        return null;
      }

      const { user: mongoUser } = await response.json();
      set({ mongoUser });

      return mongoUser;
    } catch (error) {
      console.error("MongoDB sync error:", error);
      return null;
    }
  },
}));

// Hook to initialize auth state listener
export function useAuthStateListener() {
  const { syncWithMongoDB } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Set initial Firebase user state
          useUserStore.setState({ user: firebaseUser, isLoading: true });

          // Sync with MongoDB
          const mongoUser = await syncWithMongoDB(firebaseUser);

          // Get Firebase token for Socket.io connection
          const token = await firebaseUser.getIdToken();

          // Connect to Socket.io with the token
          connectSocket(token);

          // Update online status
          updateUserOnlineStatus(true);

          // Update state with MongoDB data
          useUserStore.setState({
            user: firebaseUser,
            mongoUser,
            isLoading: false,
            authError: null,
          });
        } catch (error) {
          console.error("Auth state sync error:", error);
          useUserStore.setState({ isLoading: false, authError: error.message });
        }
      } else {
        // User is signed out
        disconnectSocket();
        useUserStore.setState({
          user: null,
          mongoUser: null,
          isLoading: false,
        });
      }
    });

    // Set up online/offline status handling
    const handleOnline = () => {
      const { user } = useUserStore.getState();
      if (user) {
        connectSocket();
        updateUserOnlineStatus(true);
      }
    };

    const handleOffline = () => {
      updateUserOnlineStatus(false);
    };

    const handleBeforeUnload = () => {
      updateUserOnlineStatus(false);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      }
    };
  }, []);
}

// Hook to handle authentication errors with toast notifications
export function useAuthErrorToast() {
  const toast = useToast();
  const authError = useUserStore((state) => state.authError);

  useEffect(() => {
    if (authError) {
      toast({
        title: "Authentication Error",
        description: authError,
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      // Clear the error after showing toast
      useUserStore.setState({ authError: null });
    }
  }, [authError, toast]);
}
