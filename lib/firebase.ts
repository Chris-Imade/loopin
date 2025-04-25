import {
  disableNetwork,
  enableNetwork,
  waitForPendingWrites,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";

// Network status handling
export const handleNetworkStatus = () => {
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      console.log("App is online. Reconnecting to Firestore...");
      enableNetwork(db).then(() => {
        console.log("Firestore network connection re-established");
      });
    });

    window.addEventListener("offline", () => {
      console.log("App is offline. Disabling Firestore network connection...");
      disableNetwork(db).then(() => {
        console.log("Firestore network connection disabled");
      });
    });
  }
};

// Initialize subscription listener with proper error handling
export const initializeSubscriptionListener = (
  userId: string,
  onSubscriptionUpdate: (status: string) => void
): (() => void) => {
  if (!userId) {
    console.warn("Cannot initialize subscription listener without user ID");
    return () => {};
  }

  try {
    // Ensure pending writes are completed when possible
    waitForPendingWrites(db).catch((err) => {
      console.warn("Pending writes could not be completed:", err.message);
    });

    return onSnapshot(
      doc(db, "users", userId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data?.subscriptionStatus) {
            onSubscriptionUpdate(data.subscriptionStatus);
          }
        } else {
          console.log(`No user document found for ID: ${userId}`);
          onSubscriptionUpdate("not_found");
        }
      },
      (error) => {
        console.error("Error in subscription listener:", error);
        // Return a graceful error to the callback rather than crashing
        if (
          error.code === "unavailable" ||
          error.message?.includes("offline") ||
          error.code === "permission-denied"
        ) {
          onSubscriptionUpdate("offline");
        } else {
          // For other errors, we still want to inform the UI
          onSubscriptionUpdate("error");
        }
      }
    );
  } catch (error) {
    console.error("Failed to initialize subscription listener:", error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};
